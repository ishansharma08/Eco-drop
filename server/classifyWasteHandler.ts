import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiClassificationRaw {
  item: string;
  material: string;
  category: string;
  bin: string;
  confidence: number;
  explanation: string;
}

const FALLBACK_UNKNOWN: GeminiClassificationRaw = {
  item: 'Unknown',
  material: 'Unknown',
  category: 'Unknown',
  bin: 'Unknown',
  confidence: 0,
  explanation: 'The object is not clearly visible enough to classify.'
};

const CLASSIFICATION_PROMPT = `You are an expert waste classification and materials recycling vision assistant.
Examine the image provided and identify the primary waste item shown.

You MUST return ONLY a JSON object with this exact structure:
{
  "item": "Specific name of the object (e.g. Plastic water bottle, Banana peel, Aluminum soda can, Used paper tissue, Smartphone)",
  "material": "Specific material composition (e.g. PET plastic, Organic fruit peel, Aluminum alloy, Soiled paper fiber, E-waste electronics)",
  "category": "One of: Recyclable | Organic / Compostable | General Waste | Hazardous Waste | E-Waste | Glass | Metal | Unknown",
  "bin": "One of: Recycling | Compost | General Waste | Hazardous Waste | E-Waste Collection | Glass Bin | Metal Bin | Unknown",
  "confidence": float between 0.0 and 1.0,
  "explanation": "Concise 1-2 sentence explanation of what is shown and why."
}

Special rules:
1. If the image is blurry, empty, unidentifiable, or the object is not clearly visible, return:
{
  "item": "Unknown",
  "material": "Unknown",
  "category": "Unknown",
  "bin": "Unknown",
  "confidence": 0.0,
  "explanation": "The object is not clearly visible enough to classify."
}
2. Focus primarily on objective item and material identification.
3. Return ONLY the raw JSON object. Do not wrap in markdown or backticks. No conversational filler.`;

/**
 * Strips data URL scheme and extracts mimeType + raw base64 data
 */
export function extractBase64FromDataUrl(dataUrl: string): { mimeType: string; base64Data: string } {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('Invalid image data provided.');
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], base64Data: match[2] };
  }

  // Raw base64 fallback
  return { mimeType: 'image/jpeg', base64Data: dataUrl };
}

/**
 * Parses JSON output from Gemini safely, handling potential code blocks
 */
function parseGeminiJson(rawText: string): GeminiClassificationRaw {
  try {
    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return FALLBACK_UNKNOWN;
    }

    const parsed = JSON.parse(cleaned.slice(start, end + 1));

    return {
      item: String(parsed.item || 'Unknown'),
      material: String(parsed.material || 'Unknown'),
      category: String(parsed.category || 'Unknown'),
      bin: String(parsed.bin || 'Unknown'),
      confidence: typeof parsed.confidence === 'number'
        ? Math.min(1, Math.max(0, parsed.confidence))
        : 0.5,
      explanation: String(parsed.explanation || 'Analyzed with Google Gemini Vision.')
    };
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', rawText, err);
    return FALLBACK_UNKNOWN;
  }
}

/**
 * Classifies an image using Google Gemini Vision API via the official SDK
 */
export async function classifyWasteWithGemini(
  imageDataUrl: string,
  apiKey?: string
): Promise<GeminiClassificationRaw> {
  const resolvedKey = apiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!resolvedKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to your .env file.');
  }

  const { mimeType, base64Data } = extractBase64FromDataUrl(imageDataUrl);

  if (!base64Data || base64Data.length < 50) {
    throw new Error('Image data is empty or invalid.');
  }

  const genAI = new GoogleGenerativeAI(resolvedKey);

  // Candidate models in preference order
  const modelCandidates = ['gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  let lastError: Error | null = null;

  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      });

      const response = await model.generateContent([
        CLASSIFICATION_PROMPT,
        {
          inlineData: {
            mimeType,
            data: base64Data
          }
        }
      ]);

      const text = response.response.text();
      if (!text) {
        return FALLBACK_UNKNOWN;
      }

      return parseGeminiJson(text);
    } catch (err: any) {
      lastError = err;
      console.warn(`Attempt with ${modelName} encountered:`, err.message || err);
      // Try next model if 404 or model not found
      if (err.status === 404 || err.message?.includes('not found')) {
        continue;
      }
      // For rate limits (429) or other errors, break and report
      break;
    }
  }

  throw lastError || new Error('Unable to analyze the image right now. Please try again.');
}
