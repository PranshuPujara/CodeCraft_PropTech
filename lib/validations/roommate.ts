/**
 * Roommate Validation & Normalization Module
 * Rental Intelligence Platform
 * PRODUCT.md §6.7 | ARCHITECTURE.md §7
 */

export interface CanonicalRoommateProfile {
  [key: string]: string | number;
  budget: number;
  sleepSchedule: string;
  workSchedule: string;
  cleanliness: string;
  noiseTolerance: string;
  guests: string;
  smoking: string;
  foodPreferences: string;
  pets: string;
  socialPreferences: string;
}

export const REQUIRED_ROOMMATE_KEYS = [
  'budget',
  'sleepSchedule',
  'workSchedule',
  'cleanliness',
  'noiseTolerance',
  'guests',
  'smoking',
  'foodPreferences',
  'pets',
  'socialPreferences',
] as const;

export type RequiredRoommateKey = (typeof REQUIRED_ROOMMATE_KEYS)[number];

export interface ProfileValidationResult {
  isValid: boolean;
  missingKeys: string[];
  normalized?: CanonicalRoommateProfile;
  budgetError?: string;
}

/**
 * Extracts and normalizes a single roommate profile, mapping aliases to canonical fields.
 */
export function extractAndNormalizeProfile(
  raw: Record<string, any> | undefined | null,
  profileLabel: 'profileA' | 'profileB' = 'profileA'
): ProfileValidationResult {
  if (!raw || typeof raw !== 'object') {
    return {
      isValid: false,
      missingKeys: [...REQUIRED_ROOMMATE_KEYS],
    };
  }

  // Extract raw values with alias support
  const budgetRaw = raw.budget;
  const sleepRaw = raw.sleepSchedule ?? raw.sleep ?? raw.sleep_routine;
  const workRaw = raw.workSchedule ?? raw.workStudySchedule ?? raw.work_schedule ?? raw.work;
  const cleanlinessRaw = raw.cleanliness ?? raw.cleanlinessStandards;
  const noiseRaw = raw.noiseTolerance ?? raw.noise ?? raw.noise_tolerance;
  const guestsRaw = raw.guests ?? raw.guestPreferences ?? raw.guest_preferences;
  const smokingRaw = raw.smoking ?? raw.smokingHabits;
  const foodRaw = raw.foodPreferences ?? raw.food ?? raw.food_preferences;
  const petsRaw = raw.pets ?? raw.petPreferences;
  const socialRaw = raw.socialPreferences ?? raw.social ?? raw.social_preferences;

  const missingKeys: string[] = [];

  // Check budget presence
  if (budgetRaw === undefined || budgetRaw === null) {
    missingKeys.push('budget');
  } else if (typeof budgetRaw === 'string' && budgetRaw.trim() === '') {
    missingKeys.push('budget');
  }

  // Check string fields presence and non-whitespace
  const checkField = (key: RequiredRoommateKey, val: any) => {
    if (val === undefined || val === null) {
      missingKeys.push(key);
    } else if (typeof val === 'string' && val.trim() === '') {
      missingKeys.push(key);
    }
  };

  checkField('sleepSchedule', sleepRaw);
  checkField('workSchedule', workRaw);
  checkField('cleanliness', cleanlinessRaw);
  checkField('noiseTolerance', noiseRaw);
  checkField('guests', guestsRaw);
  checkField('smoking', smokingRaw);
  checkField('foodPreferences', foodRaw);
  checkField('pets', petsRaw);
  checkField('socialPreferences', socialRaw);

  if (missingKeys.length > 0) {
    return {
      isValid: false,
      missingKeys,
    };
  }

  // Parse and validate numerical budget
  let parsedBudget: number;
  if (typeof budgetRaw === 'number') {
    parsedBudget = budgetRaw;
  } else if (typeof budgetRaw === 'string') {
    const cleaned = budgetRaw.replace(/[^\d.-]/g, '');
    parsedBudget = Number(cleaned);
  } else {
    parsedBudget = NaN;
  }

  if (isNaN(parsedBudget) || parsedBudget <= 0 || parsedBudget > 10000000) {
    return {
      isValid: false,
      missingKeys: [],
      budgetError: `Invalid budget in ${profileLabel}: must be a positive number up to 10,000,000.`,
    };
  }

  const normalized: CanonicalRoommateProfile = {
    budget: parsedBudget,
    sleepSchedule: String(sleepRaw).trim(),
    workSchedule: String(workRaw).trim(),
    cleanliness: String(cleanlinessRaw).trim(),
    noiseTolerance: String(noiseRaw).trim(),
    guests: String(guestsRaw).trim(),
    smoking: String(smokingRaw).trim(),
    foodPreferences: String(foodRaw).trim(),
    pets: String(petsRaw).trim(),
    socialPreferences: String(socialRaw).trim(),
  };

  return {
    isValid: true,
    missingKeys: [],
    normalized,
  };
}

export interface PairValidationResult {
  isValid: boolean;
  error?: string;
  missingKeysA: string[];
  missingKeysB: string[];
  profileA?: CanonicalRoommateProfile;
  profileB?: CanonicalRoommateProfile;
}

/**
 * Validates both profileA and profileB for completeness and budget validity.
 */
export function validateRoommatePair(
  rawA: Record<string, any> | undefined | null,
  rawB: Record<string, any> | undefined | null
): PairValidationResult {
  if (!rawA || !rawB) {
    return {
      isValid: false,
      error: 'Both profileA and profileB are required.',
      missingKeysA: rawA ? [] : [...REQUIRED_ROOMMATE_KEYS],
      missingKeysB: rawB ? [] : [...REQUIRED_ROOMMATE_KEYS],
    };
  }

  const resA = extractAndNormalizeProfile(rawA, 'profileA');
  const resB = extractAndNormalizeProfile(rawB, 'profileB');

  if (resA.missingKeys.length > 0 || resB.missingKeys.length > 0) {
    return {
      isValid: false,
      error: 'Profiles are incomplete. They must contain all required preferences.',
      missingKeysA: resA.missingKeys,
      missingKeysB: resB.missingKeys,
    };
  }

  if (resA.budgetError) {
    return {
      isValid: false,
      error: resA.budgetError,
      missingKeysA: [],
      missingKeysB: [],
    };
  }

  if (resB.budgetError) {
    return {
      isValid: false,
      error: resB.budgetError,
      missingKeysA: [],
      missingKeysB: [],
    };
  }

  return {
    isValid: true,
    missingKeysA: [],
    missingKeysB: [],
    profileA: resA.normalized,
    profileB: resB.normalized,
  };
}
