import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Word } from '../../../src/db/database';
import { ChoiceResult } from '../../../src/types/words';

interface InputProps {
  word: Word;
  userInput: string;
  result: ChoiceResult;
  onInputChange: (text: string) => void;
  onSubmit: () => void;
}

export default function Input({ word, userInput, result, onInputChange, onSubmit }: InputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.word}>{word.word}</Text>
      {word.phonetic && <Text style={styles.phonetic}>[{word.phonetic}]</Text>}

      <TextInput
        style={styles.input}
        value={userInput}
        onChangeText={onInputChange}
        placeholder="Введите перевод"
        placeholderTextColor="rgba(255,255,255,0.3)"
        autoFocus
        editable={!result}
      />

      {!result && (
        <Pressable style={styles.submitBtn} onPress={onSubmit}>
          <Text style={styles.submitText}>Проверить</Text>
        </Pressable>
      )}

      {result && (
        <>
          <Text style={[styles.resultText, result === 'correct' ? styles.correct : styles.wrong]}>
            {result === 'correct' ? '✓ Правильно' : '✗ Неправильно'}
          </Text>
          {result === 'wrong' && (
            <Text style={styles.correctAnswer}>Правильный ответ: {word.translation}</Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  word: { fontSize: 36, fontWeight: '300', color: '#fff', textAlign: 'center', marginBottom: 12 },
  phonetic: { fontSize: 16, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 40 },
  input: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  submitText: { fontSize: 16, fontWeight: '400', color: '#fff', textAlign: 'center' },
  resultText: { fontSize: 18, fontWeight: '400', textAlign: 'center', marginTop: 30 },
  correct: { color: '#22c55e' },
  wrong: { color: '#ef4444' },
  correctAnswer: { fontSize: 16, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 12 },
});
