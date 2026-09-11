// Configurable Disposal Classification Layer for EcoDrop
// Decouples AI material detection from local municipal recycling rules

export type WasteCategoryType =
  | 'Recyclable'
  | 'Organic / Compostable'
  | 'General Waste'
  | 'Hazardous Waste'
  | 'E-Waste'
  | 'Glass'
  | 'Metal'
  | 'Unknown';

export interface DisposalRule {
  keywords: string[];
  materials: string[];
  category: WasteCategoryType;
  binName: string;
  binColor: string; // Color theme
  badgeColor: string; // Tailwind classes
  binColorHex: string;
  icon: 'recycle' | 'leaf' | 'trash' | 'alert' | 'zap' | 'glass' | 'package' | 'help';
  preparationInstructions: string[];
  pointsPerUnit: number;
  unit: 'kg' | 'count';
  isRecyclable: boolean;
  notes?: string;
}

export interface StructuredWasteResult {
  item: string;
  material: string;
  category: WasteCategoryType;
  bin: string;
  confidence: number;
  explanation: string;
  binColor?: string;
  binBadge?: string;
  instructions?: string[];
  isLowConfidence?: boolean;
  pointsEarned?: number;
  unit?: 'kg' | 'count';
}

/**
 * Configurable disposal rules mapping materials and items to municipal collection bins.
 * Easy to modify or extend for different municipalities without altering AI code.
 */
export const DISPOSAL_RULES: DisposalRule[] = [
  {
    category: 'Recyclable',
    binName: 'BLUE / RECYCLING BIN',
    binColor: 'blue',
    binColorHex: '#2563eb',
    badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    icon: 'recycle',
    keywords: [
      'plastic bottle',
      'water bottle',
      'soda bottle',
      'milk jug',
      'detergent bottle',
      'shampoo bottle',
      'plastic container',
      'cardboard',
      'cardboard box',
      'paper',
      'newspaper',
      'magazine',
      'book',
      'books',
      'carton',
      'egg carton',
      'paper bag'
    ],
    materials: [
      'pet plastic',
      'pete',
      'pet',
      'hdpe',
      'pp',
      'polypropylene',
      'paper',
      'cardboard',
      'corrugated cardboard'
    ],
    preparationInstructions: [
      'Empty and lightly rinse any liquid or residue',
      'Flatten cardboard boxes to save bin space',
      'Keep dry and free of food grease'
    ],
    pointsPerUnit: 10,
    unit: 'kg',
    isRecyclable: true
  },
  {
    category: 'Organic / Compostable',
    binName: 'GREEN / COMPOST BIN',
    binColor: 'green',
    binColorHex: '#16a34a',
    badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    icon: 'leaf',
    keywords: [
      'banana peel',
      'apple core',
      'food waste',
      'vegetable scrap',
      'fruit',
      'vegetable',
      'eggshell',
      'coffee grounds',
      'tea bag',
      'bread',
      'leftovers',
      'leaves',
      'grass',
      'garden waste',
      'plant'
    ],
    materials: [
      'organic',
      'food',
      'compostable',
      'biodegradable',
      'plant matter',
      'cellulose'
    ],
    preparationInstructions: [
      'Remove all plastic stickers, twist ties, or cling wrap',
      'Keep separate from non-compostable packaging',
      'Drop into green composting bin or municipal organic waste bin'
    ],
    pointsPerUnit: 5,
    unit: 'kg',
    isRecyclable: false
  },
  {
    category: 'Metal',
    binName: 'GRAY / METAL & CAN BIN',
    binColor: 'slate',
    binColorHex: '#64748b',
    badgeColor: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
    icon: 'package',
    keywords: [
      'aluminum can',
      'tin can',
      'soda can',
      'beverage can',
      'food tin',
      'metal lid',
      'aluminum foil',
      'steel can',
      'metal scraps'
    ],
    materials: [
      'aluminum',
      'tin',
      'steel',
      'metal',
      'alu',
      'tinplate',
      'brass',
      'copper'
    ],
    preparationInstructions: [
      'Rinse clean of liquids or sauces',
      'Push lid inside can or remove sharp edges',
      'Lightly crush aluminum cans to conserve bin volume'
    ],
    pointsPerUnit: 18,
    unit: 'kg',
    isRecyclable: true
  },
  {
    category: 'Glass',
    binName: 'TEAL / GLASS BIN',
    binColor: 'teal',
    binColorHex: '#0d9488',
    badgeColor: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
    icon: 'glass',
    keywords: [
      'glass bottle',
      'glass jar',
      'wine bottle',
      'beer bottle',
      'sauce jar',
      'perfume bottle'
    ],
    materials: [
      'glass',
      'soda-lime glass',
      'borosilicate glass',
      'flint glass',
      'amber glass'
    ],
    preparationInstructions: [
      'Rinse clean with water',
      'Separate metal or plastic caps/corks',
      'Do not break; place gently into glass bin'
    ],
    pointsPerUnit: 12,
    unit: 'kg',
    isRecyclable: true
  },
  {
    category: 'Hazardous Waste',
    binName: 'RED / HAZARDOUS WASTE DROP-OFF',
    binColor: 'red',
    binColorHex: '#dc2626',
    badgeColor: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
    icon: 'alert',
    keywords: [
      'battery',
      'lithium battery',
      'aa battery',
      'car battery',
      'paint can',
      'motor oil',
      'pesticide',
      'chemical cleaner',
      'aerosol can',
      'fluorescent tube',
      'medical waste',
      'syringe',
      'thermometer'
    ],
    materials: [
      'lithium',
      'lead-acid',
      'mercury',
      'toxic chemical',
      'solvent',
      'heavy metal'
    ],
    preparationInstructions: [
      'Keep in original leak-proof container if possible',
      'Tape battery terminals with clear tape',
      'Deliver directly to authorized hazardous collection center'
    ],
    pointsPerUnit: 25,
    unit: 'count',
    isRecyclable: false
  },
  {
    category: 'E-Waste',
    binName: 'PURPLE / E-WASTE COLLECTION BIN',
    binColor: 'purple',
    binColorHex: '#9333ea',
    badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    icon: 'zap',
    keywords: [
      'smartphone',
      'phone',
      'mobile',
      'laptop',
      'tablet',
      'charger',
      'cable',
      'printed circuit board',
      'headphone',
      'earbuds',
      'keyboard',
      'mouse',
      'calculator',
      'electronic device'
    ],
    materials: [
      'electronics',
      'e-waste',
      'pcb',
      'circuit',
      'lithium-ion',
      'electronic component'
    ],
    preparationInstructions: [
      'Remove SIM and memory cards; perform factory reset',
      'Keep cords and adapters neatly bundled',
      'Bring to designated EcoDrop e-waste collection bin'
    ],
    pointsPerUnit: 50,
    unit: 'count',
    isRecyclable: true
  },
  {
    category: 'General Waste',
    binName: 'BLACK / GENERAL WASTE BIN',
    binColor: 'zinc',
    binColorHex: '#71717a',
    badgeColor: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30',
    icon: 'trash',
    keywords: [
      'used tissue',
      'paper towel',
      'napkin',
      'chip packet',
      'crisp packet',
      'candy wrapper',
      'styrofoam',
      'thermocol',
      'cigarette butt',
      'diaper',
      'sanitary pad',
      'broken ceramic',
      'sponge',
      'dust'
    ],
    materials: [
      'mixed waste',
      'multi-layer laminate',
      'non-recyclable plastic',
      'soiled paper',
      'polystyrene foam',
      'ceramic'
    ],
    preparationInstructions: [
      'Bag securely to prevent litter and odors',
      'Dispose of in black municipal landfill/general waste bin',
      'Not eligible for recycling points'
    ],
    pointsPerUnit: 0,
    unit: 'kg',
    isRecyclable: false
  }
];

export const UNKNOWN_DISPOSAL_RESULT: StructuredWasteResult = {
  item: 'Unknown',
  material: 'Unknown',
  category: 'Unknown',
  bin: 'UNKNOWN / INSPECTION NEEDED',
  confidence: 0,
  explanation: 'The object is not clearly visible enough to classify accurately.',
  binColor: 'amber',
  binBadge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  instructions: [
    'Hold the item closer to the camera and center it in frame',
    'Ensure good lighting and avoid heavy shadows or glare',
    'Try capturing against a clean, plain background'
  ],
  isLowConfidence: true,
  pointsEarned: 0,
  unit: 'kg'
};

/**
 * Maps an item and material identified by Gemini to a validated local disposal bin and category.
 * Provides resilient rule-based verification and defaults.
 */
export function classifyDisposal(
  item: string,
  material: string,
  geminiCategory?: string,
  geminiBin?: string,
  confidence = 0.85,
  explanation = ''
): StructuredWasteResult {
  const normItem = (item || '').toLowerCase().trim();
  const normMaterial = (material || '').toLowerCase().trim();
  const normCat = (geminiCategory || '').toLowerCase().trim();

  // If item or material is explicitly unknown or empty
  if (!normItem || normItem === 'unknown' || normMaterial === 'unknown' || confidence < 0.25) {
    return {
      ...UNKNOWN_DISPOSAL_RESULT,
      confidence: Math.round(confidence * 100) / 100,
      explanation: explanation || UNKNOWN_DISPOSAL_RESULT.explanation
    };
  }

  // 1. Check exact / partial keyword match in item name
  for (const rule of DISPOSAL_RULES) {
    for (const kw of rule.keywords) {
      if (normItem.includes(kw) || kw.includes(normItem)) {
        return {
          item: capitalizeWords(item),
          material: capitalizeWords(material),
          category: rule.category,
          bin: rule.binName,
          confidence: Math.round(confidence * 100) / 100,
          explanation: explanation || `Detected as ${rule.category.toLowerCase()} material.`,
          binColor: rule.binColor,
          binBadge: rule.badgeColor,
          instructions: rule.preparationInstructions,
          isLowConfidence: confidence < 0.60,
          pointsEarned: rule.pointsPerUnit,
          unit: rule.unit
        };
      }
    }
  }

  // 2. Check material matches
  for (const rule of DISPOSAL_RULES) {
    for (const mat of rule.materials) {
      if (normMaterial.includes(mat) || mat.includes(normMaterial)) {
        return {
          item: capitalizeWords(item),
          material: capitalizeWords(material),
          category: rule.category,
          bin: rule.binName,
          confidence: Math.round(confidence * 100) / 100,
          explanation: explanation || `Material identified as ${rule.category.toLowerCase()}.`,
          binColor: rule.binColor,
          binBadge: rule.badgeColor,
          instructions: rule.preparationInstructions,
          isLowConfidence: confidence < 0.60,
          pointsEarned: rule.pointsPerUnit,
          unit: rule.unit
        };
      }
    }
  }

  // 3. Check if Gemini suggested category matches any of our canonical categories
  for (const rule of DISPOSAL_RULES) {
    if (normCat.includes(rule.category.toLowerCase()) || rule.category.toLowerCase().includes(normCat)) {
      return {
        item: capitalizeWords(item),
        material: capitalizeWords(material),
        category: rule.category,
        bin: rule.binName,
        confidence: Math.round(confidence * 100) / 100,
        explanation: explanation || `Classified under ${rule.category}.`,
        binColor: rule.binColor,
        binBadge: rule.badgeColor,
        instructions: rule.preparationInstructions,
        isLowConfidence: confidence < 0.60,
        pointsEarned: rule.pointsPerUnit,
        unit: rule.unit
      };
    }
  }

  // 4. Fallback for unmapped but non-empty items
  const fallbackRule = normMaterial.includes('plastic') || normMaterial.includes('paper')
    ? DISPOSAL_RULES[0] // Recyclable
    : DISPOSAL_RULES[6]; // General Waste

  return {
    item: capitalizeWords(item),
    material: capitalizeWords(material),
    category: fallbackRule.category,
    bin: fallbackRule.binName,
    confidence: Math.round(confidence * 100) / 100,
    explanation: explanation || `Identified as ${item}, directed to ${fallbackRule.binName}.`,
    binColor: fallbackRule.binColor,
    binBadge: fallbackRule.badgeColor,
    instructions: fallbackRule.preparationInstructions,
    isLowConfidence: confidence < 0.60,
    pointsEarned: fallbackRule.pointsPerUnit,
    unit: fallbackRule.unit
  };
}

function capitalizeWords(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
