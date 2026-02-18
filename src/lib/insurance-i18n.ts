export const COLUMN_LABELS = {
  he: {
    category: 'תחום',
    main_branch: 'ענף ראשי',
    sub_branch: 'ענף (משני)',
    product_type: 'סוג מוצר',
    company: 'חברה',
    coverage_period: 'תקופת ביטוח',
    additional_details: 'פרטים נוספים',
    premium_nis: 'פרמיה בש"ח',
    premium_type: 'סוג פרמיה',
    policy_number: 'מספר פוליסה',
    plan_classification: 'סיווג תכנית',
  },
  en: {
    category: 'Category',
    main_branch: 'Main Branch',
    sub_branch: 'Sub Branch',
    product_type: 'Product Type',
    company: 'Company',
    coverage_period: 'Coverage Period',
    additional_details: 'Additional Details',
    premium_nis: 'Premium (NIS)',
    premium_type: 'Premium Type',
    policy_number: 'Policy Number',
    plan_classification: 'Plan Classification',
  },
} as const;

export type InsuranceLang = 'he' | 'en';

export type ColumnKey = keyof typeof COLUMN_LABELS.he;

export const VISIBLE_COLUMNS: ColumnKey[] = [
  'category',
  'main_branch',
  'sub_branch',
  'product_type',
  'company',
  'coverage_period',
  'additional_details',
  'premium_nis',
  'premium_type',
  'policy_number',
  'plan_classification',
];

const CATEGORY_TRANSLATIONS: Record<string, string> = {
  'כללי': 'General',
  'בריאות ותאונות אישיות': 'Health & Personal Accidents',
  'בריאות': 'Health',
  'חיים ואבדן כושר עבודה': 'Life & Disability',
  'חיים': 'Life',
  'פנסיה': 'Pension',
  'רכב': 'Vehicle',
  'דירה': 'Home/Property',
  'משכנתא': 'Mortgage',
  'נסיעות לחו"ל': 'Travel',
  'אחריות מקצועית': 'Professional Liability',
  'אלמנטרי': 'Elementary',
};

const VALUE_TRANSLATIONS: Record<string, string> = {
  // Premium types
  'שנתית': 'Annual',
  'חודשית': 'Monthly',
  'רבעונית': 'Quarterly',
  'חד פעמית': 'One-time',
  // Plan classification
  'אישי': 'Personal',
  'משפחתי': 'Family',
  'קבוצתי': 'Group',
  // Product types
  'פוליסת ביטוח': 'Insurance Policy',
  'הסכם שירות': 'Service Agreement',
  // Common insurance branches
  'ביטוח רכב': 'Vehicle Insurance',
  'רכב חובה': 'Mandatory Vehicle',
  'ביטוח מקיף': 'Comprehensive',
  'ביטוח צד ג': 'Third Party',
  'ביטוח דירה': 'Home Insurance',
  'מבנה': 'Structure',
  'תכולה': 'Contents',
  'ביטוח בריאות': 'Health Insurance',
  'ביטוח חיים': 'Life Insurance',
  'אובדן כושר עבודה': 'Loss of Work Capacity',
  'ייעוץ ובדיקות': 'Consultations & Tests',
  'ניתוחים וטיפולים': 'Surgeries & Treatments',
  'תרופות': 'Medications',
  'שיניים': 'Dental',
  'מתחדש': 'Renewable',
  // Common company names
  'איי. די. איי. חברה לביטוח בע"מ': 'IDI Insurance',
  'מנורה מבטחים ביטוח בע"מ': 'Menora Mivtachim Insurance',
  'הראל חברה לביטוח בע"מ': 'Harel Insurance',
  'מגדל חברה לביטוח בע"מ': 'Migdal Insurance',
  'כלל חברה לביטוח בע"מ': 'Clal Insurance',
  'הפניקס חברה לביטוח בע"מ': 'Phoenix Insurance',
  'איילון חברה לביטוח בע"מ': 'Ayalon Insurance',
  'ביטוח ישיר': 'Bituach Yashir (Direct Insurance)',
  'שירביט חברה לביטוח בע"מ': 'Shirbit Insurance',
};

export function translateValue(value: string, lang: InsuranceLang): string {
  if (lang === 'he' || !value) return value;
  return VALUE_TRANSLATIONS[value] ?? value;
}

export function translateCategory(value: string, lang: InsuranceLang): string {
  if (lang === 'he' || !value) return value;
  return CATEGORY_TRANSLATIONS[value] ?? value;
}
