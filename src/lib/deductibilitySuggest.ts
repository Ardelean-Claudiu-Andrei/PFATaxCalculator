// src/lib/deductibilitySuggest.ts
// Purpose: Suggest (NOT force) deductibility type + warnings based on:
// - user activity domain (IT / MEDICAL / OTHER)
// - category (training, equipment, utilities, car, etc.)
// - title/description keywords
// - amount threshold for assets (amortization)
//
// You can use this in UI to:
// - set defaults (if user didn't touch)
// - show warnings + require justification
//
// NOTE: Make sure your UI passes category IDs that match these constants,
// e.g. "training", "equipment", "utilities", "car", "rent", "marketing", etc.

export type ActivityDomain = 'IT' | 'MEDICAL' | 'OTHER';

export type DeductibilityType =
  | 'full'     // deductible (100% * businessUsePercent)
  | 'partial'  // deductible with a fixed percent (e.g. car 50%)
  | 'asset'    // fixed asset -> amortization
  | 'limited'  // deductible but capped annually (e.g. pilon III)
  | 'none';    // non-deductible (cashflow only)

export type DeductibilitySuggestion = {
  type: DeductibilityType;
  warnings: string[];
  // optional extras you might want later:
  suggestedBusinessUsePercent?: number; // e.g. utilities at home
  suggestedPartialPercent?: number;     // e.g. car 50%
  suggestedUsefulLifeMonths?: number;   // e.g. equipment asset default
};

export type SuggestDeductibilityInput = {
  domain: ActivityDomain;
  category: string; // normalized category id
  title: string;    // user-entered name/description
  amount: number;   // RON
};

// ------------------------------
// Keywords (expandable)
// ------------------------------
const MEDICAL_KEYWORDS = [
  'medical', 'clinica', 'cabinet', 'pacient', 'tratament', 'recuperare', 'reabilitare',
  'kineto', 'kinetoterap', 'fizioterap', 'fiziokinet',
  'terapie manual', 'manual therapy',
  'dry needling', 'trigger point',
  'mulligan', 'maitland', 'bobath', 'mckenzie',
  'kinesiotaping', 'kinesio', 'taping',
  'posturo', 'posturologie',
  'tecar', 'laser terapeutic', 'electroterapie', 'ultrasunet',
  'masaj terapeutic', 'miofascial', 'fascia',
  'ortopedic', 'neurologic', 'sportiv',
  'coloana', 'lombar', 'cervical', 'articulatie',
  'acreditat', 'credit profesional', 'formare', 'specializare', 'perfectionare',
  // common abbreviations
  'dmi',
];

const IT_TECH_KEYWORDS = [
  'react', 'react native', 'vue', 'angular',
  'javascript', 'typescript', 'html', 'css', 'sass', 'tailwind',
  'node', 'nodejs', 'express', 'nestjs',
  'dotnet', '.net', 'c#', 'java', 'spring', 'php', 'laravel', 'python', 'django', 'fastapi',
  'android', 'ios', 'swift', 'kotlin',
  'sql', 'mysql', 'postgres', 'mongodb', 'redis',
  'firebase', 'firestore',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'devops',
  'git', 'github', 'gitlab', 'bitbucket',
  'jest', 'cypress', 'playwright', 'unit test', 'e2e', 'testing',
  'microservices', 'clean architecture', 'design patterns',
];

const IT_MANAGEMENT_KEYWORDS = [
  'agile', 'scrum', 'kanban', 'safe', 'lean',
  'product owner', 'product management', 'project management', 'pmp',
  'leadership', 'management',
  'time management', 'communication', 'negotiation',
  'roadmap', 'stakeholder',
  'qa', 'quality assurance', 'process improvement', 'continuous improvement',
];

const GENERIC_BUSINESS_KEYWORDS = [
  'contabilitate', 'finante', 'taxe', 'fiscal',
  'juridic', 'legal', 'contract', 'gdpr', 'protectia datelor',
  'marketing', 'branding', 'seo', 'social media', 'ads', 'google ads', 'meta ads',
  'vanzari', 'sales',
];

// Equipment hints (useful if you want smarter asset suggestions)
const EQUIPMENT_KEYWORDS = [
  'laptop', 'notebook', 'macbook', 'pc', 'calculator',
  'monitor', 'display', 'imprimanta', 'printer', 'scanner',
  'telefon', 'smartphone', 'iphone', 'samsung',
  'router', 'modem', 'switch',
  'camera', 'aparat foto', 'obiectiv', 'lens',
  'masa', 'birou', 'scaun', 'chair',
];

function normCategory(raw: string): string {
  return (raw || '').trim().toLowerCase();
}

function normText(raw: string): string {
  return (raw || '').toLowerCase().trim();
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

function isStrongMedical(text: string): boolean {
  // Stronger filter (to reduce false positives)
  return includesAny(text, MEDICAL_KEYWORDS);
}

function isStrongIT(text: string): { tech: boolean; mgmt: boolean } {
  const tech = includesAny(text, IT_TECH_KEYWORDS);
  const mgmt = includesAny(text, IT_MANAGEMENT_KEYWORDS);
  return { tech, mgmt };
}

// ------------------------------
// Main suggestion function
// ------------------------------
export function suggestDeductibility(input: SuggestDeductibilityInput): DeductibilitySuggestion {
  const category = normCategory(input.category);
  const title = normText(input.title);
  const amount = Number.isFinite(input.amount) ? input.amount : 0;

  const warnings: string[] = [];

  // -----------------------------
  // TRAINING / CURSURI
  // -----------------------------
  if (category === 'training' || category === 'cursuri' || category === 'course') {
    const medical = isStrongMedical(title);
    const it = isStrongIT(title);
    const genericBiz = includesAny(title, GENERIC_BUSINESS_KEYWORDS);

    // Cross-domain strong mismatch => default "none" (cashflow only)
    if (input.domain === 'IT') {
      if (medical && !it.tech && !it.mgmt) {
        return {
          type: 'none',
          warnings: [
            'Pare un curs medical/kineto (ex: DMI, dry needling, Mulligan). Pentru domeniu IT, îl sugerăm ca NEdeductibil (doar cashflow) — sau adaugă justificare clară dacă îl consideri legat de activitate.',
          ],
        };
      }

      if (!it.tech && !it.mgmt && !genericBiz) {
        warnings.push('Cursul nu pare direct legat de IT. Adaugă justificare sau marchează ca nedeductibil.');
      } else if (!it.tech && it.mgmt) {
        warnings.push('Curs de management/agile: de obicei ok, dar păstrează justificarea (rol, proiect, activitate).');
      }

      return { type: 'full', warnings };
    }

    if (input.domain === 'MEDICAL') {
      if ((it.tech || it.mgmt) && !medical) {
        return {
          type: 'none',
          warnings: [
            'Pare un curs IT/management IT (ex: React, Git, AWS). Pentru domeniu Medical/Kineto, îl sugerăm ca NEdeductibil (doar cashflow) — sau adaugă justificare (ex: aplicație pentru cabinet, digitalizare) dacă e cazul.',
          ],
        };
      }

      if (!medical && !genericBiz) {
        warnings.push('Cursul nu pare direct legat de domeniul Medical/Kineto. Adaugă justificare sau marchează ca nedeductibil.');
      }

      return { type: 'full', warnings };
    }

    // OTHER
    if (!genericBiz && !medical && !it.tech && !it.mgmt) {
      warnings.push('Verifică legătura cursului cu activitatea ta. Dacă e personal, marchează ca nedeductibil.');
    }

    return { type: 'full', warnings };
  }

  // -----------------------------
  // EQUIPMENT / ECHIPAMENTE
  // -----------------------------
  if (category === 'equipment' || category === 'echipamente') {
    const looksLikeEquipment = includesAny(title, EQUIPMENT_KEYWORDS);

    // If over threshold -> asset (amortization)
    if (amount >= 2500) {
      const suggestedUsefulLifeMonths = 36; // default (you can refine per item)
      return {
        type: 'asset',
        warnings: looksLikeEquipment ? [] : ['Suma pare pentru un bun/echipament. Verifică dacă e mijloc fix (amortizare).'],
        suggestedUsefulLifeMonths,
      };
    }

    // Below threshold -> full (expense)
    return {
      type: 'full',
      warnings: looksLikeEquipment ? [] : [],
    };
  }

  // -----------------------------
  // UTILITIES at home (often mixed use) -> suggest business use %
  // -----------------------------
  if (category === 'utilities' || category === 'utilitati') {
    // soft suggestion only; user decides
    return {
      type: 'full',
      warnings: ['Dacă utilitățile sunt pentru locuință + activitate, setează un % de utilizare profesională (ex: 30–50%).'],
      suggestedBusinessUsePercent: 50,
    };
  }

  // -----------------------------
  // CAR / AUTO (commonly 50% when mixed use)
  // -----------------------------
  if (category === 'car' || category === 'auto' || category === 'vehicle') {
    return {
      type: 'partial',
      warnings: [
        'Auto folosit mixt (personal + activitate): în practică se aplică des 50% deductibil. Dacă e exclusiv pe activitate, păstrează dovezi (foi parcurs etc.).',
      ],
      suggestedPartialPercent: 50,
    };
  }

  // -----------------------------
  // RENT / CHIRIE (usually full if contract on PFA; may be mixed use if home)
  // -----------------------------
  if (category === 'rent' || category === 'chirie') {
    return {
      type: 'full',
      warnings: ['Dacă spațiul e locuință + sediu, setează un % (suprafață/folosință) și păstrează contract/acte.'],
      suggestedBusinessUsePercent: 50,
    };
  }

  // -----------------------------
  // MARKETING (generally ok, but can be personal)
  // -----------------------------
  if (category === 'marketing') {
    return {
      type: 'full',
      warnings: ['Asigură-te că serviciile/ads sunt pentru activitate (factură pe PFA/PFI).'],
    };
  }

  // -----------------------------
  // DEFAULT
  // -----------------------------
  return { type: 'full', warnings: [] };
}
