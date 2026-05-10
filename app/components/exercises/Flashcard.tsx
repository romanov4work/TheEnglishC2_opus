import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Word } from '../../../src/db/database';
import { speak } from '../../../src/utils/helpers';
import { hapticLight, hapticMedium } from '../../../src/utils/feedback';

interface FlashcardProps {
  word: Word;
  showAnswer: boolean;
  onToggleAnswer: () => void;
  onNext: () => void;
}

export default function Flashcard({ word, showAnswer, onToggleAnswer, onNext }: FlashcardProps) {
  const handleToggle = () => {
    hapticLight();
    onToggleAnswer();
  };

  const handleNext = () => {
    hapticMedium();
    onNext();
  };

  const handleSpeak = () => {
    hapticLight();
    speak(word.word);
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.card} onPress={handleToggle}>
        <Text style={styles.word}>{word.word}</Text>
        {word.phonetic && <Text style={styles.phonetic}>[{word.phonetic}]</Text>}
        {showAnswer && (
          <>
            <Text style={styles.translation}>{word.translation}</Text>
            {word.examples && (
              <Text style={styles.example}>{JSON.parse(word.examples)[0]}</Text>
            )}
          </>
        )}
      </Pressable>

      <Pressable style={styles.speakBtn} onPress={handleSpeak}>
        <Text style={styles.speakText}>🔊</Text>
      </Pressable>

      {showAnswer && (
        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>Далее</Text>
        </Pressable>
      )}

      {!showAnswer && (
        <Text style={styles.hint}>Нажмите на карточку</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 40,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  word: { fontSize: 36, fontWeight: '300', color: '#fff', marginBottom: 12 },
  phonetic: { fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 20 },
  translation: { fontSize: 24, color: 'rgba(255,255,255,0.8)', marginTop: 20 },
  example: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 16, textAlign: 'center', fontStyle: 'italic' },
  speakBtn: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  speakText: { fontSize: 24 },
  nextBtn: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nextText: { fontSize: 16, fontWeight: '400', color: '#fff', textAlign: 'center' },
  hint: { fontSize: 14, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 20 },
});
