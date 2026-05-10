import { useEffect, useState, useCallback } from 'react';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, Alert, TextInput } from 'react-native';
import { getDueCards, seedWords, rateCard, getStats, getStreak, parseExamples, Word, UserProgress } from '../src/db/database';
import { SEED_WORDS } from '../src/data/seedWords';

type Phase = 'menu' | 'training';
type ExerciseType = 'flashcard' | 'choices' | 'assembly' | 'input';
type ChoiceResult = 'correct' | 'wrong' | null;

function getExerciseType(progress: UserProgress | null): ExerciseType {
  if (!progress || progress.learningStep === 0 || progress.learningStep === 1) return 'flashcard';
  if (progress.learningStep === 2) return 'choices';
  if (progress.learningStep === 3) return 'assembly';
  return 'input';
}

function speak(word: string) {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getChoices(correct: Word, all: Word[]): string[] {
  const others = all.filter(w => w.id !== correct.id);
  const shuffled = shuffleArray(others).slice(0, 3);
  return shuffleArray([correct.translation, ...shuffled.map(w => w.translation)]);
}

function getLetters(word: string): string[] {
  return shuffleArray(word.split(''));
}

export default function WordsPage() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [cards, setCards] = useState<CardState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ new: 0, learning: 0, review: 0, dueToday: 0, retentionRate: 0 });
  const [streak, setStreak] = useState(0);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('flashcard');

  // choices
  const [choices, setChoices] = useState<string[]>([]);
  const [choiceResult, setChoiceResult] = useState<ChoiceResult>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  // assembly
  const [letters, setLetters] = useState<string[]>([]);
  const [assembled, setAssembled] = useState<string>('');
  const [assemblyResult, setAssemblyResult] = useState<ChoiceResult>(null);

  // input
  const [userInput, setUserInput] = useState('');
  const [inputResult, setInputResult] = useState<ChoiceResult>(null);

  interface CardState {
    word: Word;
    progress: UserProgress | null;
  }

  const loadCards = useCallback(async () => {
    try {
      await seedWords(SEED_WORDS);
      const due = await getDueCards();
      setCards(due);
      const s = await getStats(SEED_WORDS.length);
      setStats(s);
      const str = await getStreak();
      setStreak(str);
      setLoading(false);
    } catch (e) {
      Alert.alert('Error', String(e));
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCards(); }, [loadCards]);

  const startTraining = () => {
    if (cards.length === 0) {
      Alert.alert('Нет карточек', 'Все слова изучены на сегодня!');
      return;
    }
    setPhase('training');
    setCurrentIndex(0);
    setShowAnswer(false);
    setChoiceResult(null);
    setSelectedChoice(null);
    setAssembled('');
    setUserInput('');
    setInputResult(null);

    const current = cards[0];
    const type = getExerciseType(current.progress);
    setExerciseType(type);

    if (type === 'choices') {
      setChoices(getChoices(current.word, SEED_WORDS as Word[]));
    }
    if (type === 'assembly') {
      setLetters(getLetters(current.word.word));
    }
  };

  const handleRate = async (rating: 1 | 2 | 3 | 4) => {
    const current = cards[currentIndex];
    if (!current) return;

    try {
      await rateCard(current.word.id, rating, current.progress);
      setShowAnswer(false);
      moveNext();
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  };

  const moveNext = () => {
    if (currentIndex < cards.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const next = cards[nextIdx];
      const type = getExerciseType(next.progress);
      setExerciseType(type);

      if (type === 'choices') {
        setChoices(getChoices(next.word, SEED_WORDS as Word[]));
        setChoiceResult(null);
        setSelectedChoice(null);
      }
      if (type === 'assembly') {
        setLetters(getLetters(next.word.word));
        setAssembled('');
        setAssemblyResult(null);
      }
      if (type === 'input') {
        setUserInput('');
        setInputResult(null);
      }
    } else {
      setPhase('menu');
      loadCards();
    }
  };

  const handleChoice = (choice: string) => {
    const current = cards[currentIndex];
    if (!current) return;
    setSelectedChoice(choice);
    const correct = choice === current.word.translation;
    setChoiceResult(correct ? 'correct' : 'wrong');
    const rating = correct ? 3 : 1;
    setTimeout(() => handleRate(rating as 1 | 2 | 3 | 4), 800);
  };

  const handleLetterPress = (letter: string, idx: number) => {
    const current = cards[currentIndex];
    if (!current) return;
    const newAssembled = assembled + letter;
    const newLetters = [...letters];
    newLetters.splice(idx, 1);
    setAssembled(newAssembled);
    setLetters(newLetters);

    if (newAssembled.length === current.word.word.length) {
      const correct = newAssembled === current.word.word;
      setAssemblyResult(correct ? 'correct' : 'wrong');
      const rating = correct ? 3 : 1;
      setTimeout(() => handleRate(rating as 1 | 2 | 3 | 4), 800);
    }
  };

  const handleBackspace = () => {
    if (assembled.length === 0) return;
    const lastLetter = assembled[assembled.length - 1];
    setAssembled(assembled.slice(0, -1));
    setLetters([...letters, lastLetter]);
  };

  const handleInputSubmit = () => {
    const current = cards[currentIndex];
    if (!current) return;
    const correct = userInput.toLowerCase().trim() === current.word.translation.toLowerCase().trim();
    setInputResult(correct ? 'correct' : 'wrong');
    const rating = correct ? 3 : 1;
    setTimeout(() => handleRate(rating as 1 | 2 | 3 | 4), 800);
  };

  // === MENU ===
  if (phase === 'menu') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Link href="/" asChild><Pressable style={styles.back}><Text style={styles.backText}>←</Text></Pressable></Link>
          <Text style={styles.title}>Слова</Text>
        </View>
        <View style={styles.menu}>
          {loading ? (
            <Text style={styles.loadingText}>Загрузка...</Text>
          ) : (
            <>
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Сегодня</Text>
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
                    <Text style={styles.statNum}>{stats.review}</Text>
                    <Text style={styles.statLabel}>Повторение</Text>
                  </View>
                </View>
                <View style={styles.dueRow}>
                  <Text style={styles.dueText}>К изучению: {stats.dueToday}</Text>
                </View>
              </View>

              {streak > 0 && (
                <View style={styles.streakCard}>
                  <Text style={styles.streakIcon}>🔥</Text>
                  <Text style={styles.streakText}>{streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'} подряд</Text>
                </View>
              )}

              <Pressable style={styles.startBtn} onPress={startTraining}>
                <Text style={styles.startBtnText}>Начать тренировку</Text>
              </Pressable>

              <View style={styles.infoRow}>
                <Text style={styles.infoText}>Точность: {stats.retentionRate}%</Text>
                <Text style={styles.infoText}>Всего: {SEED_WORDS.length}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  }

  const current = cards[currentIndex];
  if (!current) return null;

  // === TRAINING (automatic exercise type) ===
  if (phase === 'training') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.cardHeader}>
          <Pressable onPress={() => setPhase('menu')}><Text style={styles.closeText}>✕</Text></Pressable>
          <Text style={styles.progressText}>{currentIndex + 1} / {cards.length}</Text>
        </View>

        {exerciseType === 'flashcard' && (
          <View style={styles.cardArea}>
            {!showAnswer ? (
              <Pressable style={styles.flashcard} onPress={() => setShowAnswer(true)}>
                <Pressable style={styles.speakBtn} onPress={() => speak(current.word.word)}>
                  <Text style={styles.speakBtnText}>🔊</Text>
                </Pressable>
                <Text style={styles.wordText}>{current.word.word}</Text>
                {current.word.phonetic && <Text style={styles.phoneticText}>{current.word.phonetic}</Text>}
                <Text style={styles.tapHint}>нажмите, чтобы увидеть перевод</Text>
              </Pressable>
            ) : (
              <View style={styles.flashcard}>
                <Pressable style={styles.speakBtn} onPress={() => speak(current.word.word)}>
                  <Text style={styles.speakBtnText}>🔊</Text>
                </Pressable>
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
        )}

        {exerciseType === 'choices' && (
          <View style={styles.choicesArea}>
            <View style={styles.choicesTop}>
              <Text style={styles.choicesWord}>{current.word.word}</Text>
              <Pressable style={styles.speakBtn} onPress={() => speak(current.word.word)}>
                <Text style={styles.speakBtnText}>🔊</Text>
              </Pressable>
            </View>
            <Text style={styles.choicesHint}>Выберите перевод:</Text>
            <View style={styles.choicesGrid}>
              {choices.map((choice, i) => {
                let bg = 'rgba(255,255,255,0.05)';
                if (choiceResult === 'correct' && choice === current.word.translation) bg = 'rgba(16,185,129,0.2)';
                if (choiceResult === 'wrong' && choice === selectedChoice) bg = 'rgba(239,68,68,0.2)';
                return (
                  <Pressable
                    key={i}
                    style={[styles.choiceBtn, { backgroundColor: bg }]}
                    onPress={() => !choiceResult && handleChoice(choice)}
                    disabled={!!choiceResult}
                  >
                    <Text style={styles.choiceText}>{choice}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {exerciseType === 'assembly' && (
          <View style={styles.assemblyArea}>
            <Text style={styles.assemblyHint}>Соберите слово:</Text>
            <View style={styles.assemblyTranslation}>
              <Text style={styles.assemblyTransText}>{current.word.translation}</Text>
              <Pressable style={styles.speakBtn} onPress={() => speak(current.word.word)}>
                <Text style={styles.speakBtnText}>🔊</Text>
              </Pressable>
            </View>
            <View style={styles.assembledBox}>
              <Text style={[styles.assembledText, assemblyResult === 'correct' && styles.assembledCorrect, assemblyResult === 'wrong' && styles.assembledWrong]}>
                {assembled || ' '}
              </Text>
            </View>
            <View style={styles.lettersBox}>
              {letters.map((letter, i) => (
                <Pressable key={i} style={styles.letterBtn} onPress={() => handleLetterPress(letter, i)}>
                  <Text style={styles.letterText}>{letter}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.backspaceBtn} onPress={handleBackspace}>
              <Text style={styles.backspaceText}>← стереть</Text>
            </Pressable>
          </View>
        )}

        {exerciseType === 'input' && (
          <View style={styles.inputArea}>
            <Text style={styles.inputWord}>{current.word.word}</Text>
            <Pressable style={styles.speakBtn} onPress={() => speak(current.word.word)}>
              <Text style={styles.speakBtnText}>🔊</Text>
            </Pressable>
            <Text style={styles.inputHint}>Введите перевод:</Text>
            <TextInput
              style={[styles.textInput, inputResult === 'correct' && styles.inputCorrect, inputResult === 'wrong' && styles.inputWrong]}
              value={userInput}
              onChangeText={setUserInput}
              onSubmitEditing={handleInputSubmit}
              placeholder="напишите перевод..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.inputBtns}>
              <Pressable
                style={styles.inputSubmitBtn}
                onPress={handleInputSubmit}
                disabled={userInput.trim().length === 0}
              >
                <Text style={styles.inputSubmitText}>Проверить</Text>
              </Pressable>
            </View>
            {inputResult === 'correct' && <Text style={styles.resultCorrect}>✓ Правильно!</Text>}
            {inputResult === 'wrong' && <Text style={styles.resultWrong}>✗ Правильный ответ: {current.word.translation}</Text>}
          </View>
        )}

        {showAnswer && exerciseType === 'flashcard' && (
          <View style={styles.rateArea}>
            <Text style={styles.rateTitle}>Как вспомнили?</Text>
            <View style={styles.rateButtons}>
              <Pressable style={styles.rateBtn} onPress={() => handleRate(1)}>
                <Text style={styles.rateBtnText}>Снова</Text>
                <Text style={styles.rateBtnSub}>10 мин</Text>
              </Pressable>
              <Pressable style={styles.rateBtn} onPress={() => handleRate(2)}>
                <Text style={styles.rateBtnText}>Трудно</Text>
                <Text style={styles.rateBtnSub}>~1 дн</Text>
              </Pressable>
              <Pressable style={styles.rateBtn} onPress={() => handleRate(3)}>
                <Text style={styles.rateBtnText}>Хорошо</Text>
                <Text style={styles.rateBtnSub}>~4 дн</Text>
              </Pressable>
              <Pressable style={styles.rateBtn} onPress={() => handleRate(4)}>
                <Text style={styles.rateBtnText}>Легко</Text>
                <Text style={styles.rateBtnSub}>10 дн</Text>
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
  loadingText: { fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: '300' },

  // Stats card
  statsCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '300',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  statsRow: { flexDirection: 'row', marginBottom: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '200', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: '300', letterSpacing: 1, marginTop: 4 },
  dueRow: { paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  dueText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '300', textAlign: 'center' },

  // Streak
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
  },
  streakIcon: { fontSize: 24, marginRight: 8 },
  streakText: { fontSize: 16, color: '#fff', fontWeight: '300' },

  // Start button
  startBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  startBtnText: { fontSize: 16, fontWeight: '400', color: '#fff' },

  // Info row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  infoText: { fontSize: 12, color: 'rgba(255,255,255,0.25)', fontWeight: '300' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10 },
  closeText: { fontSize: 20, color: 'rgba(255,255,255,0.3)', fontWeight: '300' },
  progressText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: '300' },
  cardArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  flashcard: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: 40, alignItems: 'center', minHeight: 280, justifyContent: 'center' },
  speakBtn: { position: 'absolute', top: 16, right: 16, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  speakBtnText: { fontSize: 20 },
  wordText: { fontSize: 36, fontWeight: '200', color: '#fff', textAlign: 'center', letterSpacing: -1 },
  phoneticText: { fontSize: 16, color: 'rgba(255,255,255,0.3)', fontWeight: '300', marginTop: 12 },
  divider: { fontSize: 24, color: 'rgba(255,255,255,0.15)', marginVertical: 16 },
  translationText: { fontSize: 28, fontWeight: '300', color: '#fff', textAlign: 'center' },
  posText: { fontSize: 13, color: 'rgba(255,255,255,0.25)', fontWeight: '300', marginTop: 16, fontStyle: 'italic' },
  exampleText: { fontSize: 14, color: 'rgba(255,255,255,0.25)', fontWeight: '300', marginTop: 16, textAlign: 'center', fontStyle: 'italic' },
  tapHint: { fontSize: 12, color: 'rgba(255,255,255,0.15)', fontWeight: '300', marginTop: 24, letterSpacing: 1 },
  rateArea: { paddingHorizontal: 20, paddingBottom: 40 },
  rateTitle: { fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: '300', textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 },
  rateButtons: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  rateBtn: { width: '48%', marginBottom: 8, paddingVertical: 16, borderRadius: 4, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rateBtnText: { fontSize: 14, fontWeight: '400', color: '#fff' },
  rateBtnSub: { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '300', marginTop: 4 },
  // 4 choices
  choicesArea: { flex: 1, paddingHorizontal: 20, paddingTop: 40 },
  choicesTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  choicesWord: { fontSize: 32, fontWeight: '200', color: '#fff', marginRight: 12 },
  choicesHint: { fontSize: 13, color: 'rgba(255,255,255,0.25)', fontWeight: '300', marginBottom: 20, textAlign: 'center' },
  choicesGrid: {},
  choiceBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: 20, marginBottom: 10, alignItems: 'center' },
  choiceText: { fontSize: 17, fontWeight: '400', color: '#fff' },
  // assembly
  assemblyArea: { flex: 1, paddingHorizontal: 20, paddingTop: 40 },
  assemblyHint: { fontSize: 13, color: 'rgba(255,255,255,0.25)', fontWeight: '300', textAlign: 'center', marginBottom: 12 },
  assemblyTranslation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  assemblyTransText: { fontSize: 20, fontWeight: '300', color: '#fff', marginRight: 12 },
  assembledBox: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 4, padding: 20, alignItems: 'center', marginBottom: 32, minHeight: 60, justifyContent: 'center' },
  assembledText: { fontSize: 28, fontWeight: '200', color: '#fff', letterSpacing: 4 },
  assembledCorrect: { color: '#10b981' },
  assembledWrong: { color: '#ef4444' },
  lettersBox: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 },
  letterBtn: { width: 44, height: 44, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 4, alignItems: 'center', justifyContent: 'center', margin: 4 },
  letterText: { fontSize: 20, fontWeight: '500', color: '#fff' },
  backspaceBtn: { alignItems: 'center', padding: 16 },
  backspaceText: { fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: '300' },
  // input
  inputArea: { flex: 1, paddingHorizontal: 20, paddingTop: 60, alignItems: 'center' },
  inputWord: { fontSize: 32, fontWeight: '200', color: '#fff', marginBottom: 8 },
  inputHint: { fontSize: 13, color: 'rgba(255,255,255,0.25)', fontWeight: '300', marginBottom: 24 },
  textInput: { width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 4, padding: 16, fontSize: 18, color: '#fff', textAlign: 'center', marginBottom: 20 },
  inputCorrect: { borderColor: '#10b981' },
  inputWrong: { borderColor: '#ef4444' },
  inputBtns: { width: '100%' },
  inputSubmitBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: 18, alignItems: 'center' },
  inputSubmitText: { fontSize: 16, fontWeight: '400', color: '#fff' },
  resultCorrect: { fontSize: 16, color: '#10b981', fontWeight: '400', marginTop: 16 },
  resultWrong: { fontSize: 14, color: '#ef4444', fontWeight: '300', marginTop: 16, textAlign: 'center' },
});