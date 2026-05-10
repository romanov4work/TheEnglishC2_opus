import { useEffect, useState, useCallback } from 'react';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, Dimensions, Alert } from 'react-native';
import { getDueCards, seedWords, saveProgress, getStats, calculateNextReview, parseExamples, Word, UserProgress } from '../src/db/database';
import { SEED_WORDS } from '../src/data/seedWords';

type Phase = 'menu' | 'card';

interface CardState {
  word: Word;
  progress: UserProgress | null;
}

export default function WordsPage() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [cards, setCards] = useState<CardState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ new: 0, learning: 0, mastered: 0 });

  const loadCards = useCallback(async () => {
    try {
      await seedWords(SEED_WORDS);
      const due = await getDueCards();
      setCards(due);
      const s = await getStats(SEED_WORDS.length);
      setStats(s);
      setLoading(false);
    } catch (e) {
      Alert.alert('Error', String(e));
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCards(); }, [loadCards]);

  const handleRate = async (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    const current = cards[currentIndex];
    const defaultProgress: UserProgress = {
      id: 0, wordId: current.word.id, easeFactor: 2.5,
      interval: 0, repetitions: 0, nextReview: 0, lastReview: 0,
    };
    const prev = current.progress || defaultProgress;
    const { easeFactor, interval, repetitions, nextReview } = calculateNextReview(prev, quality);
    await saveProgress(current.word.id, nextReview, easeFactor, interval, repetitions);
    setShowAnswer(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setPhase('menu');
      loadCards();
    }
  };

  if (phase === 'menu') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Link href="/" asChild>
            <Pressable style={styles.back}><Text style={styles.backText}>←</Text></Pressable>
          </Link>
          <Text style={styles.title}>Слова</Text>
        </View>
        <View style={styles.menu}>
          <Text style={styles.menuTitle}>Тренировка</Text>
          {loading ? (
            <Text style={styles.loadingText}>Загрузка...</Text>
          ) : (
            <>
              <Pressable style={styles.menuCard} onPress={() => { loadCards(); setPhase('card'); setCurrentIndex(0); setShowAnswer(false); }}>
                <Text style={styles.menuCardTitle}>Начать тренировку</Text>
                <Text style={styles.menuCardSub}>{cards.length} карточек на повторение</Text>
              </Pressable>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{stats.new}</Text>
                  <Text style={styles.statLabel}>Новые</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{stats.learning}</Text>
                  <Text style={styles.statLabel}>Учу</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{SEED_WORDS.length}</Text>
                  <Text style={styles.statLabel}>Всего</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    );
  }

  if (phase === 'card') {
    const current = cards[currentIndex];
    if (!current) return null;

    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.cardHeader}>
          <Pressable onPress={() => setPhase('menu')}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <Text style={styles.progressText}>{currentIndex + 1} / {cards.length}</Text>
        </View>
        <View style={styles.cardArea}>
          {!showAnswer ? (
            <Pressable style={styles.flashcard} onPress={() => setShowAnswer(true)}>
              <Text style={styles.wordText}>{current.word.word}</Text>
              {current.word.phonetic && <Text style={styles.phoneticText}>{current.word.phonetic}</Text>}
              <Text style={styles.tapHint}>нажмите, чтобы увидеть перевод</Text>
            </Pressable>
          ) : (
            <View style={styles.flashcard}>
              <Text style={styles.wordText}>{current.word.word}</Text>
              {current.word.phonetic && <Text style={styles.phoneticText}>{current.word.phonetic}</Text>}
              <Text style={styles.divider}>—</Text>
              <Text style={styles.translationText}>{current.word.translation}</Text>
              {current.word.partOfSpeech && <Text style={styles.posText}>{current.word.partOfSpeech}</Text>}
              {current.word.examples && parseExamples(current.word.examples).length > 0 && (
                <Text style={styles.exampleText}>"{parseExamples(current.word.examples)[0]}"</Text>
              )}
            </View>
          )}
        </View>
        {showAnswer && (
          <View style={styles.rateArea}>
            <Text style={styles.rateTitle}>Как вспомнили?</Text>
            <View style={styles.rateButtons}>
              <Pressable style={styles.rateBtn} onPress={() => handleRate(1)}>
                <Text style={styles.rateBtnText}>Снова</Text>
                <Text style={styles.rateBtnSub}>1 дн</Text>
              </Pressable>
              <Pressable style={styles.rateBtn} onPress={() => handleRate(3)}>
                <Text style={styles.rateBtnText}>Трудно</Text>
                <Text style={styles.rateBtnSub}>~3 дн</Text>
              </Pressable>
              <Pressable style={styles.rateBtn} onPress={() => handleRate(5)}>
                <Text style={styles.rateBtnText}>Легко</Text>
                <Text style={styles.rateBtnSub}>{">"}7 дн</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 24, color: '#fff', fontWeight: '300' },
  title: { fontSize: 28, fontWeight: '200', color: '#fff', letterSpacing: -1, marginLeft: 12 },
  menu: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  menuTitle: { fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: '300', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 32 },
  loadingText: { fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: '300' },
  menuCard: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 4, padding: 28 },
  menuCardTitle: { fontSize: 22, fontWeight: '300', color: '#fff', marginBottom: 8 },
  menuCardSub: { fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: '300' },
  statsRow: { flexDirection: 'row', marginTop: 32 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 32, fontWeight: '200', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: '300', letterSpacing: 1, marginTop: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10 },
  closeText: { fontSize: 20, color: 'rgba(255,255,255,0.3)', fontWeight: '300' },
  progressText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: '300' },
  cardArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  flashcard: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: 40, alignItems: 'center', minHeight: 280, justifyContent: 'center' },
  wordText: { fontSize: 36, fontWeight: '200', color: '#fff', textAlign: 'center', letterSpacing: -1 },
  phoneticText: { fontSize: 16, color: 'rgba(255,255,255,0.3)', fontWeight: '300', marginTop: 12 },
  divider: { fontSize: 24, color: 'rgba(255,255,255,0.15)', marginVertical: 16 },
  translationText: { fontSize: 28, fontWeight: '300', color: '#fff', textAlign: 'center' },
  posText: { fontSize: 13, color: 'rgba(255,255,255,0.25)', fontWeight: '300', marginTop: 16, fontStyle: 'italic' },
  exampleText: { fontSize: 14, color: 'rgba(255,255,255,0.25)', fontWeight: '300', marginTop: 16, textAlign: 'center', fontStyle: 'italic' },
  tapHint: { fontSize: 12, color: 'rgba(255,255,255,0.15)', fontWeight: '300', marginTop: 24, letterSpacing: 1 },
  rateArea: { paddingHorizontal: 20, paddingBottom: 40 },
  rateTitle: { fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: '300', textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 },
  rateButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  rateBtn: { flex: 1, marginHorizontal: 6, paddingVertical: 20, borderRadius: 4, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rateBtnText: { fontSize: 15, fontWeight: '400', color: '#fff' },
  rateBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: '300', marginTop: 4 },
});