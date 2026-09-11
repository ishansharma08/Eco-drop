import { wasteCategories } from '@/lib/mockData';

export interface WasteScanResult {
  name: string;
  category: string;
  categoryId: string;
  unit: 'kg' | 'count';
  defaultQty: number;
  confidence: number;
  resinCode: string;
  recyclable: boolean;
  contamination: boolean;
  contaminationMsg?: string;
  instructions: string[];
  pointsPerUnit: number;
  badgeColor: string;
}

const GEMINI_KEY_STORAGE = 'ecodrop_gemini_api_key';
const VALID_CATEGORY_IDS = new Set(wasteCategories.map((c) => c.id));

const BADGE_COLORS: Record<string, string> = {
  plastic: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  paper: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  glass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  metal: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  ewaste: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  books: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

const MODELS = ['gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

export function getGeminiApiKey(): string {
  const fromStorage = localStorage.getItem(GEMINI_KEY_STORAGE)?.trim();
  if (fromStorage) return fromStorage;
  return (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
}

export function saveGeminiApiKey(key: string) {
  const trimmed = key.trim();
  if (trimmed) localStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
  else localStorage.removeItem(GEMINI_KEY_STORAGE);
}

export function stripDataUrlPrefix(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: 'image/jpeg', data: dataUrl };
}

const SCAN_PROMPT = `You are EcoDrop's waste-recycling classifier for drop-off hubs in Jaipur, India.
Look at the photo and identify the primary recyclable (or contaminated) item.

Return ONLY valid JSON with this exact shape:
{
  "name": "specific item name",
  "categoryId": "plastic" | "paper" | "glass" | "metal" | "ewaste" | "books",
  "confidence": 0-100 number,
  "resinCode": "short material/resin code like PETE #1, ALU #41, PAP #20, GL #72, E-WASTE, or CONTAMINATED",
  "recyclable": boolean,
  "contamination": boolean,
  "contaminationMsg": "string or empty",
  "defaultQty": number,
  "unit": "kg" | "count",
  "instructions": ["3 short preparation steps"]
}

Rules:
- categoryId must be one of: plastic, paper, glass, metal, ewaste, books.
- Use "ewaste" for phones, laptops, batteries, chargers, cables.
- Use "books" for books and magazines; other paper/cardboard is "paper".
- Use "count" only for electronics; otherwise "kg".
- defaultQty: realistic estimate (bottles ~0.03-0.6 kg, cans ~0.02-0.4, boxes 0.3-3, phones 1).
- If food grease, liquids, or mixed trash make it non-recyclable, set recyclable=false and contamination=true.
- If the photo is not waste, still pick the closest category and lower confidence.
- No markdown, no extra keys, no commentary.`;

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, '```').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Gemini did not return JSON');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizeResult(raw: Record<string, unknown>): WasteScanResult {
  let categoryId = String(raw.categoryId || raw.category || 'plastic').toLowerCase();
  if (categoryId.includes('plastic')) categoryId = 'plastic';
  else if (categoryId.includes('glass')) categoryId = 'glass';
  else if (categoryId.includes('metal') || categoryId.includes('can') || categoryId.includes('alu')) categoryId = 'metal';
  else if (categoryId.includes('e-waste') || categoryId.includes('ewaste') || categoryId.includes('electronic')) categoryId = 'ewaste';
  else if (categoryId.includes('book')) categoryId = 'books';
  else if (categoryId.includes('paper') || categoryId.includes('cardboard')) categoryId = 'paper';
  if (!VALID_CATEGORY_IDS.has(categoryId)) categoryId = 'plastic';

  const catalog = wasteCategories.find((c) => c.id === categoryId)!;
  const unit = categoryId === 'ewaste' ? 'count' : 'kg';
  const qtyRaw = Number(raw.defaultQty);
  const defaultQty = Number.isFinite(qtyRaw) && qtyRaw > 0
    ? Math.round(qtyRaw * 100) / 100
    : catalog.unit === 'count' ? 1 : 0.5;

  const confidenceRaw = Number(raw.confidence);
  const confidence = Number.isFinite(confidenceRaw)
    ? Math.min(99.9, Math.max(1, Math.round(confidenceRaw * 10) / 10))
    : 80;

  const instructions = Array.isArray(raw.instructions)
    ? raw.instructions.map((s) => String(s)).filter(Boolean).slice(0, 5)
    : [];

  const recyclable = Boolean(raw.recyclable);
  const contamination = Boolean(raw.contamination);

  return {
    name: String(raw.name || catalog.name),
    category: catalog.name,
    categoryId,
    unit,
    defaultQty: unit === 'count' ? Math.max(1, Math.round(defaultQty)) : defaultQty,
    confidence,
    resinCode: String(raw.resinCode || catalog.name),
    recyclable,
    contamination,
    contaminationMsg: contamination
      ? String(raw.contaminationMsg || 'This item looks contaminated and may not be accepted as clean recyclable material.')
      : undefined,
    instructions: instructions.length
      ? instructions
      : [
          'Rinse or empty residue before drop-off',
          'Keep materials dry and loosely packed',
          'Hand this item to the station operator with your digital pass',
        ],
    pointsPerUnit: catalog.pointsPerUnit,
    badgeColor: contamination
      ? 'bg-destructive/10 text-destructive border-destructive/20'
      : BADGE_COLORS[categoryId] || BADGE_COLORS.plastic,
  };
}

async function callGeminiModel(apiKey: string, model: string, mimeType: string, data: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: SCAN_PROMPT },
            { inline_data: { mime_type: mimeType, data } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `Gemini request failed (${response.status})`;
    const err = new Error(message) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  const text: string =
    payload?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('\n') || '';
  if (!text) {
    throw new Error('Gemini returned an empty analysis. Try a clearer photo.');
  }
  return extractJson(text) as Record<string, unknown>;
}

export async function analyzeWasteImage(imageDataUrl: string, apiKey = getGeminiApiKey()): Promise<WasteScanResult> {
  if (!apiKey) {
    throw new Error('Add your Gemini API key to analyze live camera scans.');
  }

  const { mimeType, data } = stripDataUrlPrefix(imageDataUrl);
  let lastError: Error | null = null;

  for (const model of MODELS) {
    try {
      const raw = await callGeminiModel(apiKey, model, mimeType, data);
      return normalizeResult(raw);
    } catch (error) {
      lastError = error as Error;
      const status = (error as Error & { status?: number }).status;
      if (status === 404 || status === 400) continue;
      throw error;
    }
  }

  throw lastError || new Error('Gemini analysis failed');
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that photo'));
    reader.readAsDataURL(file);
  });
}

export async function urlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Could not load sample photo');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not encode sample photo'));
    reader.readAsDataURL(blob);
  });
}
