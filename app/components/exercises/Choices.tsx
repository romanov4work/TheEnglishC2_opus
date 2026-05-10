import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Word } from '../../../src/db/database';
import { ChoiceResult } from '../../../src/types/words';
import { hapticSuccess, hapticError, hapticLight } from '../../../src/utils/feedback';

interface ChoicesProps {
  word: Word;
  choices: string[];
  selectedChoice: string | null;
  result: ChoiceResult;
  onChoice: (choice: string) => void;
}

export default function Choices({ word, choices, selectedChoice, result, onChoice }: ChoicesProps) {
  const handleChoice = (choice: string) => {
    if (result) return;
    hapticLight();
    onChoice(choice);
  };

  // Trigger haptic feedback when result changes
  if (result === 'correct') {
    hapticSuccess();
  } else if (result === 'wrong') {
    hapticError();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.word}>{word.word}</Text>
      {word.phonetic && <Text style={styles.phonetic}>[{word.phonetic}]</Text>}

      <View style={styles.choicesGrid}>
        {choices.map((choice, idx) => {
          const isSelected = selectedChoice === choice;
          const isCorrect = result === 'correct' && isSelected;
          const isWrong = result === 'wrong' && isSelected;

          return (
            <Pressable
              key={idx}
              style={[
                styles.choiceBtn,
                isCorrect && styles.choiceCorrect,
                isWrong && styles.choiceWrong,
              ]}
              onPress={() => handleChoice(choice)}
              disabled={!!result}
            >
              <Text style={styles.choiceText}>{choice}</Text>
            </Pressable>
          );
        })}
      </View>

      {result && (
        <Text style={[styles.resultText, result === 'correct' ? styles.correct : styles.wrong]}>
          {result === 'correct' ? '✓ Правильно' : '✗ Неправильно'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  word: { fontSize: 36, fontWeight: '300', color: '#fff', textAlign: 'center', marginBottom: 12 },
  phonetic: { fontSize: 16, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 40 },
  choicesGrid: { gap: 12 },
  choiceBtn: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  choiceCorrect: {
    backgroundColor: 'rgba(34,197,94,0.2)',
    borderColor: 'rgba(34,197,94,0.5)',
  },
  choiceWrong: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderColor: 'rgba(239,68,68,0.5)',
  },
  choiceText: { fontSize: 18, fontWeight: '400', color: '#fff', textAlign: 'center' },
  resultText: { fontSize: 18, fontWeight: '400', textAlign: 'center', marginTop: 30 },
  correct: { color: '#22c55e' },
  wrong: { color: '#ef4444' },
});
