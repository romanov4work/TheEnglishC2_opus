import { Word, ExerciseType } from '../types/words';

export function speak(word: string) {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  }
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getChoices(correct: Word, all: Word[]): string[] {
  const others = all.filter(w => w.id !== correct.id);
  const shuffled = shuffleArray(others).slice(0, 3);
  return shuffleArray([correct.translation, ...shuffled.map(w => w.translation)]);
}

export function getLetters(word: string): string[] {
  return shuffleArray(word.split(''));
}

export function getExerciseTypeByIndex(index: 0 | 1 | 2 | 3): ExerciseType {
  const types: ExerciseType[] = ['flashcard', 'choices', 'assembly', 'input'];
  return types[index];
}
