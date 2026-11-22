import type {GradeLabel, SheetCatalogItem} from '../types/exam';

/**
 * Central configuration for sheets, question counts, grading thresholds, and score weights.
 * Adjust any threshold or weight here without touching UI or grading algorithms.
 */

export const SHEET_CATALOG: SheetCatalogItem[] = [
  {
    id: '01_vital-signs',
    number: 1,
    filename: '01_vital-signs.json',
    arabicTitle: 'العلامات الحيوية',
    englishTitle: 'Vital Signs',
  },
  {
    id: '02_anatomy-of-the-airway',
    number: 2,
    filename: '02_anatomy-of-the-airway.json',
    arabicTitle: 'تشريح مجرى الهواء',
    englishTitle: 'Anatomy of the Airway',
  },
  {
    id: '03_respiration',
    number: 3,
    filename: '03_respiration.json',
    arabicTitle: 'فسيولوجيا التنفس',
    englishTitle: 'Physiology of Respiration',
  },
  {
    id: '04_pain-management',
    number: 4,
    filename: '04_pain-management.json',
    arabicTitle: 'إدارة الألم',
    englishTitle: 'Pain Management',
  },
  {
    id: '05_respiratory-mucus-sputum-cough',
    number: 5,
    filename: '05_respiratory-mucus-sputum-cough.json',
    arabicTitle: 'المخاط والبلغم والسعال ونفث الدم',
    englishTitle: 'Mucus, Sputum, Cough & Haemoptysis',
  },
  {
    id: '06_blood-transfusion',
    number: 6,
    filename: '06_blood-transfusion.json',
    arabicTitle: 'نقل الدم',
    englishTitle: 'Blood Transfusion',
  },
  {
    id: '07_autonomic-nervous-system',
    number: 7,
    filename: '07_autonomic-nervous-system.json',
    arabicTitle: 'الجهاز العصبي اللاإرادي',
    englishTitle: 'Autonomic Nervous System',
  },
  {
    id: '08_vertebral-column-spinal-cord',
    number: 8,
    filename: '08_vertebral-column-spinal-cord.json',
    arabicTitle: 'العمود الفقري والحبل الشوكي',
    englishTitle: 'Vertebral Column & Spinal Cord',
  },
  {
    id: '09_kidney',
    number: 9,
    filename: '09_kidney.json',
    arabicTitle: 'الكلى والجهاز البولي',
    englishTitle: 'Kidney & Renal Function',
  },
  {
    id: '10_heart-and-liver',
    number: 10,
    filename: '10_heart-and-liver.json',
    arabicTitle: 'القلب والكبد',
    englishTitle: 'The Heart and Liver',
  },
];

export const QUESTION_COUNT_TIERS = {
  smallGroupMaxSheets: 4,
  smallGroup: {
    fillIn: 10,
    mcq: 5,
    writing: 4,
  },
  largeGroup: {
    fillIn: 15,
    mcq: 10,
    writing: 8,
  },
} as const;

export const EXAM_WEIGHTS = {
  fillIn: 0.3,
  mcq: 0.4,
  writing: 0.3,
} as const;

export const FIB_GRADING_CONFIG = {
  shortWordMaxLength: 8,
  shortWordMaxDistance: 1,
  longWordMaxDistance: 2,
} as const;

export const WRITING_GRADING_CONFIG = {
  pointCoveredThreshold: 0.55,
  pointPartialThreshold: 0.35,
  pointPartialCreditWeight: 0.5,
  questionCorrectThreshold: 0.7,
  questionPartialThreshold: 0.4,
  weights: {
    keywordOverlap: 0.45,
    fuzzyOverlap: 0.35,
    tokenSetSimilarity: 0.2,
  },
} as const;

export function getGradeClassification(totalScore: number): {
  label: GradeLabel;
  encouragement: string;
} {
  if (totalScore >= 90) {
    return {
      label: 'ممتاز',
      encouragement: 'أداء رائع ومتمكّن، استمر بنفس الثبات والتركيز.',
    };
  }
  if (totalScore >= 75) {
    return {
      label: 'جيد جداً',
      encouragement: 'مستوى قوي جداً، مراجعة سريعة للنقاط الناقصة ستوصلك للعلامة الكاملة.',
    };
  }
  if (totalScore >= 60) {
    return {
      label: 'جيد',
      encouragement: 'بداية طيبة، ركّز على الشيتات الأقل درجة لتثبيت المفاهيم الأساسية.',
    };
  }
  return {
    label: 'يحتاج مراجعة',
    encouragement: 'لا بأس، هذه فرصة ممتازة لاكتشاف نقاط الضعف ومراجعتها بهدوء.',
  };
}
