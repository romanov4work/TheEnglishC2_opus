import AsyncStorage from '@react-native-async-storage/async-storage';

const WORDS_KEY = 'words';
const PROGRESS_KEY = 'user_progress';

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
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
  lastReview: number;
}

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
  // Just ensure storage is ready
  const words = await getAll<Word>(WORDS_KEY);
  void words;
}

export async function seedWords(wordsToAdd: Omit<Word, 'id'>[]): Promise<void> {
  const words = await getAll<Word>(WORDS_KEY);
  if (words.length > 0) return; // already seeded
  const newWords = wordsToAdd.map((w, i) => ({ ...w, id: i + 1 }));
  await setAll(WORDS_KEY, newWords);
}

export async function getDueCards(): Promise<{ word: Word; progress: UserProgress | null }[]> {
  const words = await getAll<Word>(WORDS_KEY);
  const progressList = await getAll<UserProgress>(PROGRESS_KEY);
  const now = Date.now();

  const result: { word: Word; progress: UserProgress | null }[] = [];

  for (const word of words) {
    const prog = progressList.find(p => p.wordId === word.id) || null;
    if (!prog || prog.nextReview <= now) {
      result.push({ word, progress: prog });
    }
  }

  // Sort: new first, then by nextReview
  result.sort((a, b) => {
    if (!a.progress && b.progress) return -1;
    if (a.progress && !b.progress) return 1;
    if (!a.progress && !b.progress) return 0;
    return (a.progress!.nextReview - b.progress!.nextReview);
  });

  return result.slice(0, 20);
}

export async function saveProgress(
  wordId: number,
  nextReview: number,
  easeFactor: number,
  interval: number,
  repetitions: number
): Promise<void> {
  const progressList = await getAll<UserProgress>(PROGRESS_KEY);
  const existingIdx = progressList.findIndex(p => p.wordId === wordId);
  const now = Date.now();

  if (existingIdx >= 0) {
    progressList[existingIdx] = { ...progressList[existingIdx], nextReview, easeFactor, interval, repetitions, lastReview: now };
  } else {
    progressList.push({ id: progressList.length + 1, wordId, nextReview, easeFactor, interval, repetitions, lastReview: now });
  }

  await setAll(PROGRESS_KEY, progressList);
}

export async function getStats(total: number): Promise<{ new: number; learning: number; mastered: number }> {
  const progressList = await getAll<UserProgress>(PROGRESS_KEY);
  const learned = progressList.filter(p => p.repetitions > 0).length;
  return { new: total - learned, learning: learned, mastered: 0 };
}

// --- SM-2 Algorithm ---
export function calculateNextReview(
  progress: UserProgress,
  quality: 0 | 1 | 2 | 3 | 4 | 5
): { easeFactor: number; interval: number; repetitions: number; nextReview: number } {
  let { easeFactor, interval, repetitions } = progress;
  const now = Date.now();

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const nextReview = now + interval * 24 * 60 * 60 * 1000;

  return { easeFactor, interval, repetitions, nextReview };
}

export function parseExamples(examplesStr?: string): string[] {
  if (!examplesStr) return [];
  try { return JSON.parse(examplesStr); } catch { return []; }
}