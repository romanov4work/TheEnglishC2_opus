import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CardState } from '../../src/types/words';
import { speak } from '../../src/utils/helpers';

interface SortingPhaseProps {
  card: CardState;
  currentIndex: number;
  totalCards: number;
  unknownCount: number;
  onKnow: (know: boolean) => void;
  onClose: () => void;
}

export default function SortingPhase({
  card,
  currentIndex,
  totalCards,
  unknownCount,
  onKnow,
  onClose,
}: SortingPhaseProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {totalCards} • Незнакомых: {unknownCount}/3
        </Text>
      </View>

      <View style={styles.cardArea}>
        <View style={styles.flashcard}>
          <Pressable style={styles.speakBtn} onPress={() => speak(card.word.word)}>
            <Text style={styles.speakBtnText}>🔊</Text>
          </Pressable>
          <Text style={styles.wordText}>{card.word.word}</Text>
          {card.word.phonetic && <Text style={styles.phoneticText}>{card.word.phonetic}</Text>}
          <Text style={styles.divider}>—</Text>
          <Text style={styles.translationText}>{card.word.translation}</Text>
          {card.word.partOfSpeech && <Text style={styles.posText}>{card.word.partOfSpeech}</Text>}
        </View>
      </View>

      <View style={styles.buttons}>
        <Pressable style={[styles.btn, styles.btnKnow]} onPress={() => onKnow(true)}>
          <Text style={styles.btnText}>Знаю</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnDontKnow]} onPress={() => onKnow(false)}>
          <Text style={styles.btnText}>Не знаю</Text>
        </Pressable>
      </View>
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
  cardArea: { flex: 1, justifyContent: 'center', padding: 20 },
  flashcard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 40,
    alignItems: 'center',
  },
  speakBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
  },
  speakBtnText: { fontSize: 20 },
  wordText: { fontSize: 36, fontWeight: '300', color: '#fff', marginBottom: 8 },
  phoneticText: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 20 },
  divider: { fontSize: 20, color: 'rgba(255,255,255,0.2)', marginVertical: 20 },
  translationText: { fontSize: 24, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  posText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' },
  buttons: { flexDirection: 'row', gap: 12, padding: 20 },
  btn: {
    flex: 1,
    padding: 18,
    borderRadius: 4,
    borderWidth: 1,
  },
  btnKnow: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  btnDontKnow: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  btnText: { fontSize: 16, fontWeight: '400', color: '#fff', textAlign: 'center' },
});
