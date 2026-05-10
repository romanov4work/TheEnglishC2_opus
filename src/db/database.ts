import AsyncStorage from '@react-native-async-storage/async-storage';

const WORDS_KEY = 'words';
const PROGRESS_KEY = 'user_progress';
const SETTINGS_KEY = 'settings';
const STREAK_KEY = 'streak';
const LAST_STUDY_KEY = 'last_study_date';
const STUDY_HISTORY_KEY = 'study_history';

export interface Word {
  id: number;
  word: string;
  translation: string;
  phonetic?: string;
  partOfSpeech?: string;
  examples?: string;
  level: string;
  tags: string;
}

export interface UserProgress {
  id: number;
  wordId: number;

  // Card state
  state: 'new' | 'learning' | 'review' | 'relearning';
  learningStep: 0 | 1 | 2 | 3 | 4;

  // SM-2 parameters
  easeFactor: number;
  interval: number;
  repetitions: number;

  // Timestamps
  nextReview: number;
  lastReview: number;

  // Statistics
  totalReviews: number;
  correctReviews: number;
  lapses: number;
}

export interface Settings {
  dailyNewLimit: number;
  dailyReviewLimit: number;
  learningIntervals: number[]; // in milliseconds
  graduatingInterval: number;
  easyBonus: number;
}

const DEFAULT_SETTINGS: Settings = {
  dailyNewLimit: 20,
  dailyReviewLimit: 200,
  learningIntervals: [
    10 * 60 * 1000,      // 10 minutes
    24 * 60 * 60 * 1000, // 1 day
    4 * 24 * 60 * 60 * 1000,  // 4 days
    10 * 24 * 60 * 60 * 1000, // 10 days
  ],
  graduatingInterval: 10 * 24 * 60 * 60 * 1000, // 10 days
  easyBonus: 1.3,
};

// --- Simple Storage Wrapper (web + native) ---
async function getAll<T>(key: string): Promise<T[]> {
  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

async function setAll<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

async function updateItem<T>(key: string, predicate: (item: T) => boolean, updater: (item: T) => T): Promise<void> {
  const items = await getAll<T>(key);
  const updated = items.map(item => predicate(item) ? updater(item) : item);
  await setAll(key, updated);
}

// --- Database Operations ---
export async function initDatabase(): Promise<void> {
  // Ensure storage is ready and migrate old data
  const words = await getAll<Word>(WORDS_KEY);
  void words;
  await migrateProgress();
}

export async function seedWords(wordsToAdd: Omit<Word, 'id'>[]): Promise<void> {
  const words = await getAll<Word>(WORDS_KEY);
  if (words.length > 0) return; // already seeded
  const newWords = wordsToAdd.map((w, i) => ({ ...w, id: i + 1 }));
  await setAll(WORDS_KEY, newWords);
}

export async function getDueCards(levelFilter?: string | null, tagFilter?: string | null): Promise<{ word: Word; progress: UserProgress | null }[]> {
  const words = await getAll<Word>(WORDS_KEY);
  const progressList = await getAll<UserProgress>(PROGRESS_KEY);
  const settings = await getSettings();
  const now = Date.now();

  // Apply filters
  let filteredWords = words;
  if (levelFilter) {
    filteredWords = filteredWords.filter(w => w.level === levelFilter);
  }
  if (tagFilter) {
    filteredWords = filteredWords.filter(w => {
      try {
        const tags = JSON.parse(w.tags);
        return tags.includes(tagFilter);
      } catch {
        return false;
      }
    });
  }

  const result: { word: Word; progress: UserProgress | null }[] = [];
  let newCount = 0;
  let reviewCount = 0;

  for (const word of filteredWords) {
    const prog = progressList.find(p => p.wordId === word.id);

    if (!prog) {
      // New card
      if (newCount < settings.dailyNewLimit) {
        result.push({ word, progress: null });
        newCount++;
      }
    } else if (prog.nextReview <= now) {
      // Due for review
      if (reviewCount < settings.dailyReviewLimit) {
        result.push({ word, progress: prog });
        reviewCount++;
      }
    }
  }

  // Sort: new first, then by nextReview
  result.sort((a, b) => {
    if (!a.progress && b.progress) return -1;
    if (a.progress && !b.progress) return 1;
    if (!a.progress && !b.progress) return 0;
    return (a.progress!.nextReview - b.progress!.nextReview);
  });

  return result;
}

export async function rateCard(
  wordId: number,
  rating: 1 | 2 | 3 | 4,
  currentProgress: UserProgress | null
): Promise<UserProgress> {
  const settings = await getSettings();
  const now = Date.now();

  // Initialize new card
  if (!currentProgress) {
    currentProgress = {
      id: 0,
      wordId,
      state: 'new',
      learningStep: 0,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: now,
      lastReview: 0,
      totalReviews: 0,
      correctReviews: 0,
      lapses: 0,
    };
  }

  let newProgress = { ...currentProgress };
  newProgress.lastReview = now;
  newProgress.totalReviews += 1;

  // Rating logic
  if (rating === 1) {
    // Again - reset to step 1
    newProgress.state = 'relearning';
    newProgress.learningStep = 1;
    newProgress.nextReview = now + settings.learningIntervals[0];
    newProgress.lapses += 1;
    newProgress.easeFactor = Math.max(1.3, newProgress.easeFactor - 0.2);
  } else if (rating === 2) {
    // Hard - stay on current step
    newProgress.nextReview = now + (newProgress.interval * 0.5);
    newProgress.easeFactor = Math.max(1.3, newProgress.easeFactor - 0.15);
  } else if (rating === 3) {
    // Good - advance to next step
    newProgress.correctReviews += 1;

    if (newProgress.learningStep === 0) {
      newProgress.state = 'learning';
      newProgress.learningStep = 1;
      newProgress.nextReview = now + settings.learningIntervals[0];
    } else if (newProgress.learningStep < 4) {
      const currentStep = newProgress.learningStep;
      newProgress.learningStep += 1;
      newProgress.nextReview = now + settings.learningIntervals[currentStep];
    } else {
      // Graduate to review
      newProgress.state = 'review';
      newProgress.repetitions += 1;
      newProgress.interval = settings.graduatingInterval;
      newProgress.nextReview = now + settings.graduatingInterval;
    }
  } else if (rating === 4) {
    // Easy - skip to review
    newProgress.correctReviews += 1;
    newProgress.state = 'review';
    newProgress.repetitions += 1;
    newProgress.easeFactor = Math.min(2.5, newProgress.easeFactor + 0.15);
    newProgress.interval = 4 * 24 * 60 * 60 * 1000 * settings.easyBonus;
    newProgress.nextReview = now + newProgress.interval;
  }

  // Save to storage
  const progressList = await getAll<UserProgress>(PROGRESS_KEY);
  const existingIdx = progressList.findIndex(p => p.wordId === wordId);

  if (existingIdx >= 0) {
    newProgress.id = progressList[existingIdx].id;
    progressList[existingIdx] = newProgress;
  } else {
    newProgress.id = progressList.length + 1;
    progressList.push(newProgress);
  }

  await setAll(PROGRESS_KEY, progressList);
  await updateStreak();

  return newProgress;
}

export async function getStats(total: number): Promise<{
  new: number;
  learning: number;
  review: number;
  dueToday: number;
  retentionRate: number;
}> {
  const progressList = await getAll<UserProgress>(PROGRESS_KEY);
  const now = Date.now();

  const newCards = total - progressList.length;
  const learningCards = progressList.filter(p => p.state === 'learning' || p.state === 'relearning').length;
  const reviewCards = progressList.filter(p => p.state === 'review').length;
  const dueToday = progressList.filter(p => p.nextReview <= now).length;

  const totalReviews = progressList.reduce((sum, p) => sum + p.totalReviews, 0);
  const correctReviews = progressList.reduce((sum, p) => sum + p.correctReviews, 0);
  const retentionRate = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;

  return { new: newCards, learning: learningCards, review: reviewCards, dueToday, retentionRate };
}

// --- Migration for old progress data ---
export async function migrateProgress(): Promise<void> {
  const progressList = await getAll<UserProgress>(PROGRESS_KEY);
  let migrated = false;

  for (let i = 0; i < progressList.length; i++) {
    const p = progressList[i];

    // Check if already migrated
    if ('state' in p && 'learningStep' in p) continue;

    // Migrate old format to new
    const newP: UserProgress = {
      ...p,
      state: p.repetitions === 0 ? 'new' : 'review',
      learningStep: p.repetitions === 0 ? 0 : 4,
      totalReviews: p.repetitions || 0,
      correctReviews: p.repetitions || 0,
      lapses: 0,
    };

    progressList[i] = newP;
    migrated = true;
  }

  if (migrated) {
    await setAll(PROGRESS_KEY, progressList);
  }
}

export function parseExamples(examplesStr?: string): string[] {
  if (!examplesStr) return [];
  try { return JSON.parse(examplesStr); } catch { return []; }
}

// --- Settings ---
export async function getSettings(): Promise<Settings> {
  const data = await AsyncStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// --- Streak ---
export async function getStreak(): Promise<number> {
  const data = await AsyncStorage.getItem(STREAK_KEY);
  return data ? parseInt(data, 10) : 0;
}

export async function updateStreak(): Promise<void> {
  const today = new Date().toDateString();
  const lastStudy = await AsyncStorage.getItem(LAST_STUDY_KEY);

  if (lastStudy === today) {
    return; // Already studied today
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  const currentStreak = await getStreak();

  if (lastStudy === yesterday) {
    // Continue streak
    await AsyncStorage.setItem(STREAK_KEY, String(currentStreak + 1));
  } else {
    // Reset streak
    await AsyncStorage.setItem(STREAK_KEY, '1');
  }

  await AsyncStorage.setItem(LAST_STUDY_KEY, today);
  await addStudyDate(today);
}

// --- Study History ---
export async function getStudyHistory(): Promise<string[]> {
  const data = await AsyncStorage.getItem(STUDY_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

export async function addStudyDate(date: string): Promise<void> {
  const history = await getStudyHistory();
  if (!history.includes(date)) {
    history.push(date);
    await AsyncStorage.setItem(STUDY_HISTORY_KEY, JSON.stringify(history));
  }
}

export async function getLongestStreak(): Promise<number> {
  const history = await getStudyHistory();
  if (history.length === 0) return 0;

  const sorted = history.sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

// --- Filters ---
export async function getAvailableLevels(): Promise<string[]> {
  const words = await getAll<Word>(WORDS_KEY);
  const levels = new Set(words.map(w => w.level));
  return Array.from(levels).sort();
}

export async function getAvailableTags(): Promise<string[]> {
  const words = await getAll<Word>(WORDS_KEY);
  const tagsSet = new Set<string>();

  words.forEach(w => {
    try {
      const tags = JSON.parse(w.tags);
      tags.forEach((tag: string) => tagsSet.add(tag));
    } catch {
      // ignore invalid JSON
    }
  });

  return Array.from(tagsSet).sort();
}