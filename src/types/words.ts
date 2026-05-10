import { Word, UserProgress } from '../db/database';

export type Phase = 'menu' | 'sorting' | 'learning';
export type ExerciseType = 'flashcard' | 'choices' | 'assembly' | 'input';
export type ChoiceResult = 'correct' | 'wrong' | null;

export interface CardState {
  word: Word;
  progress: UserProgress | null;
}

export interface LearningSession {
  unknownWords: Word[];
  currentExerciseType: 0 | 1 | 2 | 3;
  currentWordIndex: number;
}

export interface Stats {
  new: number;
  learning: number;
  review: number;
  dueToday: number;
  retentionRate: number;
}
