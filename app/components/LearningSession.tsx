import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LearningSession as LearningSessionType, ExerciseType } from '../../src/types/words';
import { Word } from '../../src/db/database';
import Flashcard from './exercises/Flashcard';
import Choices from './exercises/Choices';
import Assembly from './exercises/Assembly';
import Input from './exercises/Input';

interface LearningSessionProps {
  session: LearningSessionType;
  exerciseType: ExerciseType;
  currentWord: Word;

  // Flashcard state
  showAnswer: boolean;
  onToggleAnswer: () => void;

  // Choices state
  choices: string[];
  selectedChoice: string | null;
  choiceResult: 'correct' | 'wrong' | null;
  onChoice: (choice: string) => void;

  // Assembly state
  letters: string[];
  assembled: string;
  assemblyResult: 'correct' | 'wrong' | null;
  onLetterPress: (letter: string, idx: number) => void;
  onBackspace: () => void;

  // Input state
  userInput: string;
  inputResult: 'correct' | 'wrong' | null;
  onInputChange: (text: string) => void;
  onInputSubmit: () => void;

  onNext: () => void;
  onClose: () => void;
}

export default function LearningSession({
  session,
  exerciseType,
  currentWord,
  showAnswer,
  onToggleAnswer,
  choices,
  selectedChoice,
  choiceResult,
  onChoice,
  letters,
  assembled,
  assemblyResult,
  onLetterPress,
  onBackspace,
  userInput,
  inputResult,
  onInputChange,
  onInputSubmit,
  onNext,
  onClose,
}: LearningSessionProps) {
  const exerciseNames = ['Карточка', '4 варианта', 'Сборка', 'Ввод'];
  const progress = `${session.currentWordIndex + 1}/${session.unknownWords.length} • ${exerciseNames[session.currentExerciseType]}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <Text style={styles.progressText}>{progress}</Text>
      </View>

      {exerciseType === 'flashcard' && (
        <Flashcard
          word={currentWord}
          showAnswer={showAnswer}
          onToggleAnswer={onToggleAnswer}
          onNext={onNext}
        />
      )}

      {exerciseType === 'choices' && (
        <Choices
          word={currentWord}
          choices={choices}
          selectedChoice={selectedChoice}
          result={choiceResult}
          onChoice={onChoice}
        />
      )}

      {exerciseType === 'assembly' && (
        <Assembly
          word={currentWord}
          letters={letters}
          assembled={assembled}
          result={assemblyResult}
          onLetterPress={onLetterPress}
          onBackspace={onBackspace}
        />
      )}

      {exerciseType === 'input' && (
        <Input
          word={currentWord}
          userInput={userInput}
          result={inputResult}
          onInputChange={onInputChange}
          onSubmit={onInputSubmit}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  closeText: { fontSize: 24, color: 'rgba(255,255,255,0.5)' },
  progressText: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
});
