import { useEffect, useState, useCallback } from 'react';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, Alert, TextInput } from 'react-native';
import { getDueCards, seedWords, rateCard, getStats, getStreak, parseExamples, Word, UserProgress } from '../src/db/database';
import { SEED_WORDS } from '../src/data/seedWords';

type Phase = 'menu' | 'sorting' | 'learning';
type ExerciseType = 'flashcard' | 'choices' | 'assembly' | 'input';
type ChoiceResult = 'correct' | 'wrong' | null;

interface LearningSession {
  unknownWords: Word[];
  currentExerciseType: 0 | 1 | 2 | 3; // 0=flashcard, 1=choices, 2=assembly, 3=input
  currentWordIndex: number;
}

function getExerciseTypeByIndex(index: 0 | 1 | 2 | 3): ExerciseType {
  const types: ExerciseType[] = ['flashcard', 'choices', 'assembly', 'input'];
  return types[index];
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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ new: 0, learning: 0, review: 0, dueToday: 0, retentionRate: 0 });
  const [streak, setStreak] = useState(0);

  // Learning session
  const [learningSession, setLearningSession] = useState<LearningSession | null>(null);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('flashcard');

  // Exercise state
  const [showAnswer, setShowAnswer] = useState(false);
  const [choices, setChoices] = useState<string[]>([]);
  const [choiceResult, setChoiceResult] = useState<ChoiceResult>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [letters, setLetters] = useState<string[]>([]);
  const [assembled, setAssembled] = useState<string>('');
  const [assemblyResult, setAssemblyResult] = useState<ChoiceResult>(null);
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

  const startSorting = () => {
    if (cards.length === 0) {
      Alert.alert('Нет карточек', 'Все слова изучены на сегодня!');
      return;
    }

    // Check if we have review cards (words that need repetition)
    const reviewCards = cards.filter(c => c.progress && c.progress.state !== 'new');

    if (reviewCards.length > 0) {
      // Start review session instead of sorting
      startReviewSession(reviewCards);
    } else {
      // Start sorting for new words
      setPhase('sorting');
      setCurrentIndex(0);
      setShowAnswer(false);
    }
  };

  const startReviewSession = (reviewCards: CardState[]) => {
    // For review, show ONE word at a time with appropriate exercise
    const firstCard = reviewCards[0];
    const step = firstCard.progress?.learningStep || 1;

    // Map learningStep to exercise type: 1→flashcard, 2→choices, 3→assembly, 4→input
    const exerciseIndex = Math.min(step, 3) as 0 | 1 | 2 | 3;

    const session: LearningSession = {
      unknownWords: [firstCard.word],
      currentExerciseType: exerciseIndex,
      currentWordIndex: 0,
    };
    startLearning(session);
  };

  const handleKnow = async (know: boolean) => {
    const current = cards[currentIndex];
    if (!current) return;

    if (!know) {
      // Add to unknown words for learning session
      const session = learningSession || { unknownWords: [], currentExerciseType: 0 as 0, currentWordIndex: 0 };
      session.unknownWords.push(current.word);
      setLearningSession(session);

      // If we have 10 unknown words, start learning
      if (session.unknownWords.length >= 10) {
        startLearning(session);
        return;
      }
    } else {
      // Mark as known (skip learning)
      await rateCard(current.word.id, 4, current.progress); // Easy = skip to review
    }

    // Move to next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // No more cards, start learning with what we have
      if (learningSession && learningSession.unknownWords.length > 0) {
        startLearning(learningSession);
      } else {
        setPhase('menu');
        loadCards();
      }
    }
  };

  const startLearning = (session: LearningSession) => {
    setPhase('learning');
    setLearningSession(session);
    const type = getExerciseTypeByIndex(session.currentExerciseType);
    setExerciseType(type);
    setupExercise(session.unknownWords[session.currentWordIndex], type);
  };

  const setupExercise = (word: Word, type: ExerciseType) => {
    setShowAnswer(false);
    setChoiceResult(null);
    setSelectedChoice(null);
    setAssembled('');
    setAssemblyResult(null);
    setUserInput('');
    setInputResult(null);

    if (type === 'choices') {
      setChoices(getChoices(word, SEED_WORDS as Word[]));
    }
    if (type === 'assembly') {
      setLetters(getLetters(word.word));
    }
  };

  const moveToNextExercise = async () => {
    if (!learningSession) return;

    const { unknownWords, currentExerciseType, currentWordIndex } = learningSession;

    // Move to next word in current exercise
    if (currentWordIndex < unknownWords.length - 1) {
      const newSession = {
        ...learningSession,
        currentWordIndex: currentWordIndex + 1,
      };
      setLearningSession(newSession);
      setupExercise(unknownWords[currentWordIndex + 1], getExerciseTypeByIndex(currentExerciseType));
    } else if (currentExerciseType < 3) {
      // Move to next exercise type, reset word index
      const newSession = {
        ...learningSession,
        currentExerciseType: (currentExerciseType + 1) as 0 | 1 | 2 | 3,
        currentWordIndex: 0,
      };
      setLearningSession(newSession);
      const newType = getExerciseTypeByIndex(newSession.currentExerciseType);
      setExerciseType(newType);
      setupExercise(unknownWords[0], newType);
    } else {
      // Finished all exercises
      finishLearningSession();
    }
  };

  const finishLearningSession = async () => {
    if (!learningSession) return;

    // Check if this is a review session (word has progress)
    const firstWord = learningSession.unknownWords[0];
    const cardState = cards.find(c => c.word.id === firstWord.id);

    if (cardState?.progress) {
      // Review session - advance learningStep for this one word
      await rateCard(firstWord.id, 3, cardState.progress);
      Alert.alert('Отлично!', 'Слово повторено. Оно вернется позже.');
    } else {
      // New words session - set all to learning step 1
      for (const word of learningSession.unknownWords) {
        await rateCard(word.id, 3, null); // Sets to learning step 1
      }
      Alert.alert('Отлично!', `Вы изучили ${learningSession.unknownWords.length} слов. Они вернутся через 10 минут для повторения.`);
    }

    setLearningSession(null);
    setPhase('menu');
    loadCards();
  };

  const handleChoice = (choice: string) => {
    if (!learningSession) return;
    const current = learningSession.unknownWords[learningSession.currentWordIndex];
    setSelectedChoice(choice);
    const correct = choice === current.translation;
    setChoiceResult(correct ? 'correct' : 'wrong');
    setTimeout(() => moveToNextExercise(), 1000);
  };

  const handleLetterPress = (letter: string, idx: number) => {
    if (!learningSession) return;
    const current = learningSession.unknownWords[learningSession.currentWordIndex];
    const newAssembled = assembled + letter;
    const newLetters = [...letters];
    newLetters.splice(idx, 1);
    setAssembled(newAssembled);
    setLetters(newLetters);

    if (newAssembled.length === current.word.length) {
      const correct = newAssembled === current.word;
      setAssemblyResult(correct ? 'correct' : 'wrong');
      setTimeout(() => moveToNextExercise(), 1000);
    }
  };

  const handleInputSubmit = () => {
    if (!learningSession) return;
    const current = learningSession.unknownWords[learningSession.currentWordIndex];
    const correct = userInput.toLowerCase().trim() === current.translation.toLowerCase().trim();
    setInputResult(correct ? 'correct' : 'wrong');
    setTimeout(() => moveToNextExercise(), 1000);
  };

  const handleBackspace = () => {
    if (assembled.length === 0) return;
    const lastLetter = assembled[assembled.length - 1];
    setAssembled(assembled.slice(0, -1));
    setLetters([...letters, lastLetter]);
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

              <Pressable style={styles.startBtn} onPress={startSorting}>
                <Text style={styles.startBtnText}>Начать тренировку</Text>
              </Pressable>

              <View style={styles.infoRow}>
                <Text style={styles.infoText}>Точность: {stats.retentionRate}%</Text>
                <Text style={styles.infoText}>Всего: {SEED_WORDS.length}</Text>
              </View>

              <Link href="/settings" asChild>
                <Pressable style={styles.settingsLink}>
                  <Text style={styles.settingsLinkText}>⚙ Настройки</Text>
                </Pressable>
              </Link>
            </>
          )}
        </View>
      </View>
    );
  }

  // === SORTING (Know/Don't Know) ===
  if (phase === 'sorting') {
    const current = cards[currentIndex];
    if (!current) return null;

    const unknownCount = learningSession?.unknownWords.length || 0;

    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.cardHeader}>
          <Pressable onPress={() => setPhase('menu')}><Text style={styles.closeText}>✕</Text></Pressable>
          <Text style={styles.progressText}>{currentIndex + 1} / {cards.length} • Незнакомых: {unknownCount}/10</Text>
        </View>
        <View style={styles.cardArea}>
          <View style={styles.flashcard}>
            <Pressable style={styles.speakBtn} onPress={() => speak(current.word.word)}>
              <Text style={styles.speakBtnText}>🔊</Text>
            </Pressable>
            <Text style={styles.wordText}>{current.word.word}</Text>
            {current.word.phonetic && <Text style={styles.phoneticText}>{current.word.phonetic}</Text>}
            <Text style={styles.divider}>—</Text>
            <Text style={styles.translationText}>{current.word.translation}</Text>
            {current.word.partOfSpeech && <Text style={styles.posText}>{current.word.partOfSpeech}</Text>}
          </View>
        </View>
        <View style={styles.sortingButtons}>
          <Pressable style={[styles.sortBtn, styles.sortBtnKnow]} onPress={() => handleKnow(true)}>
            <Text style={styles.sortBtnText}>Знаю</Text>
          </Pressable>
          <Pressable style={[styles.sortBtn, styles.sortBtnDontKnow]} onPress={() => handleKnow(false)}>
            <Text style={styles.sortBtnText}>Не знаю</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // === LEARNING (4 exercises) ===
  if (phase === 'learning') {
    if (!learningSession) return null;
    const current = learningSession.unknownWords[learningSession.currentWordIndex];
    const exerciseNames = ['Карточка', '4 варианта', 'Сборка', 'Ввод'];
    const progress = `${learningSession.currentWordIndex + 1}/${learningSession.unknownWords.length} • ${exerciseNames[learningSession.currentExerciseType]}`;

    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.cardHeader}>
          <Pressable onPress={() => setPhase('menu')}><Text style={styles.closeText}>✕</Text></Pressable>
          <Text style={styles.progressText}>{progress}</Text>
        </View>

        {exerciseType === 'flashcard' && (
          <View style={styles.cardArea}>
            {!showAnswer ? (
              <Pressable style={styles.flashcard} onPress={() => setShowAnswer(true)}>
                <Pressable style={styles.speakBtn} onPress={() => speak(current.word)}>
                  <Text style={styles.speakBtnText}>🔊</Text>
                </Pressable>
                <Text style={styles.wordText}>{current.word}</Text>
                {current.phonetic && <Text style={styles.phoneticText}>{current.phonetic}</Text>}
                <Text style={styles.tapHint}>нажмите, чтобы увидеть перевод</Text>
              </Pressable>
            ) : (
              <View style={styles.flashcard}>
                <Pressable style={styles.speakBtn} onPress={() => speak(current.word)}>
                  <Text style={styles.speakBtnText}>🔊</Text>
                </Pressable>
                <Text style={styles.wordText}>{current.word}</Text>
                {current.phonetic && <Text style={styles.phoneticText}>{current.phonetic}</Text>}
                <Text style={styles.divider}>—</Text>
                <Text style={styles.translationText}>{current.translation}</Text>
                {current.partOfSpeech && <Text style={styles.posText}>{current.partOfSpeech}</Text>}
                {current.examples && parseExamples(current.examples).length > 0 && (
                  <Text style={styles.exampleText}>"{parseExamples(current.examples)[0]}"</Text>
                )}
                <Pressable style={styles.continueBtn} onPress={moveToNextExercise}>
                  <Text style={styles.continueBtnText}>Продолжить</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {exerciseType === 'choices' && (
          <View style={styles.choicesArea}>
            <View style={styles.choicesTop}>
              <Text style={styles.choicesWord}>{current.word}</Text>
              <Pressable style={styles.speakBtn} onPress={() => speak(current.word)}>
                <Text style={styles.speakBtnText}>🔊</Text>
              </Pressable>
            </View>
            <Text style={styles.choicesHint}>Выберите перевод:</Text>
            <View style={styles.choicesGrid}>
              {choices.map((choice, i) => {
                let bg = 'rgba(255,255,255,0.05)';
                if (choiceResult === 'correct' && choice === current.translation) bg = 'rgba(16,185,129,0.2)';
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
            {choiceResult && (
              <Text style={[styles.resultText, choiceResult === 'correct' ? styles.resultCorrect : styles.resultWrong]}>
                {choiceResult === 'correct' ? '✓ Правильно!' : `✗ Правильный ответ: ${current.translation}`}
              </Text>
            )}
          </View>
        )}

        {exerciseType === 'assembly' && (
          <View style={styles.assemblyArea}>
            <Text style={styles.assemblyHint}>Соберите слово:</Text>
            <View style={styles.assemblyTranslation}>
              <Text style={styles.assemblyTransText}>{current.translation}</Text>
              <Pressable style={styles.speakBtn} onPress={() => speak(current.word)}>
                <Text style={styles.speakBtnText}>🔊</Text>
              </Pressable>
            </View>
            <View style={styles.assembledBox}>
              <Text style={[styles.assembledText, assemblyResult === 'correct' && styles.assembledCorrect, assemblyResult === 'wrong' && styles.assembledWrong]}>
                {assembled || ' '}
              </Text>
            </View>
            {!assemblyResult && (
              <>
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
              </>
            )}
            {assemblyResult && (
              <Text style={[styles.resultText, assemblyResult === 'correct' ? styles.resultCorrect : styles.resultWrong]}>
                {assemblyResult === 'correct' ? '✓ Правильно!' : `✗ Правильный ответ: ${current.word}`}
              </Text>
            )}
          </View>
        )}

        {exerciseType === 'input' && (
          <View style={styles.inputArea}>
            <Text style={styles.inputWord}>{current.word}</Text>
            <Pressable style={styles.speakBtn} onPress={() => speak(current.word)}>
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
              editable={!inputResult}
            />
            {!inputResult && (
              <View style={styles.inputBtns}>
                <Pressable
                  style={styles.inputSubmitBtn}
                  onPress={handleInputSubmit}
                  disabled={userInput.trim().length === 0}
                >
                  <Text style={styles.inputSubmitText}>Проверить</Text>
                </Pressable>
              </View>
            )}
            {inputResult && (
              <Text style={[styles.resultText, inputResult === 'correct' ? styles.resultCorrect : styles.resultWrong]}>
                {inputResult === 'correct' ? '✓ Правильно!' : `✗ Правильный ответ: ${current.translation}`}
              </Text>
            )}
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

  settingsLink: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center',
  },
  settingsLinkText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '300',
  },

  // Sorting buttons
  sortingButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  sortBtn: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
  },
  sortBtnKnow: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  sortBtnDontKnow: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  sortBtnText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#fff',
  },

  // Continue button
  continueBtn: {
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#fff',
  },
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
  resultText: { fontSize: 14, fontWeight: '300', marginTop: 16, textAlign: 'center' },
  resultCorrect: { fontSize: 16, color: '#10b981', fontWeight: '400', marginTop: 16 },
  resultWrong: { fontSize: 14, color: '#ef4444', fontWeight: '300', marginTop: 16, textAlign: 'center' },
});