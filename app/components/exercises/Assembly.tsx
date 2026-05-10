import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Word } from '../../../src/db/database';
import { ChoiceResult } from '../../../src/types/words';
import { hapticSuccess, hapticError, hapticLight } from '../../../src/utils/feedback';

interface AssemblyProps {
  word: Word;
  letters: string[];
  assembled: string;
  result: ChoiceResult;
  onLetterPress: (letter: string, idx: number) => void;
  onBackspace: () => void;
}

export default function Assembly({ word, letters, assembled, result, onLetterPress, onBackspace }: AssemblyProps) {
  const handleLetterPress = (letter: string, idx: number) => {
    hapticLight();
    onLetterPress(letter, idx);
  };

  const handleBackspace = () => {
    hapticLight();
    onBackspace();
  };

  // Trigger haptic feedback when result changes
  if (result === 'correct') {
    hapticSuccess();
  } else if (result === 'wrong') {
    hapticError();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.translation}>{word.translation}</Text>

      <View style={styles.assembledBox}>
        <Text style={styles.assembledText}>{assembled || '_'.repeat(word.word.length)}</Text>
      </View>

      <View style={styles.lettersGrid}>
        {letters.map((letter, idx) => (
          <Pressable key={idx} style={styles.letterBtn} onPress={() => handleLetterPress(letter, idx)}>
            <Text style={styles.letterText}>{letter}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.backspaceBtn} onPress={handleBackspace}>
        <Text style={styles.backspaceText}>⌫ Стереть</Text>
      </Pressable>

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
  translation: { fontSize: 24, fontWeight: '300', color: '#fff', textAlign: 'center', marginBottom: 40 },
  assembledBox: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 30,
    minHeight: 60,
    justifyContent: 'center',
  },
  assembledText: { fontSize: 28, fontWeight: '400', color: '#fff', textAlign: 'center', letterSpacing: 2 },
  lettersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
  letterBtn: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterText: { fontSize: 20, fontWeight: '400', color: '#fff' },
  backspaceBtn: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backspaceText: { fontSize: 16, fontWeight: '400', color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  resultText: { fontSize: 18, fontWeight: '400', textAlign: 'center', marginTop: 30 },
  correct: { color: '#22c55e' },
  wrong: { color: '#ef4444' },
});
