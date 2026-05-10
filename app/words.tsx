import { useEffect, useState, useCallback } from 'react';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { getDueCards, seedWords, rateCard, getStats, getStreak, getLongestStreak, getStudyHistory, Word, UserProgress } from '../src/db/database';
import { SEED_WORDS } from '../src/data/seedWords';
import { Phase, ExerciseType, ChoiceResult, CardState, LearningSession as LearningSessionType, Stats } from '../src/types/words';
import { getChoices, getLetters, getExerciseTypeByIndex } from '../src/utils/helpers';
import WordsMenu from './components/WordsMenu';
import SortingPhase from './components/SortingPhase';
import LearningSession from './components/LearningSession';

export default function WordsPage() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [cards, setCards] = useState<CardState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ new: 0, learning: 0, review: 0, dueToday: 0, retentionRate: 0 });
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [studyHistory, setStudyHistory] = useState<string[]>([]);

  const [learningSession, setLearningSession] = useState<LearningSessionType | null>(null);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('flashcard');

  const [showAnswer, setShowAnswer] = useState(false);
  const [choices, setChoices] = useState<string[]>([]);
  const [choiceResult, setChoiceResult] = useState<ChoiceResult>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [letters, setLetters] = useState<string[]>([]);
  const [assembled, setAssembled] = useState<string>('');
  const [assemblyResult, setAssemblyResult] = useState<ChoiceResult>(null);
  const [userInput, setUserInput] = useState('');
  const [inputResult, setInputResult] = useState<ChoiceResult>(null);

  const loadCards = useCallback(async () => {
    try {
      await seedWords(SEED_WORDS);
      const due = await getDueCards();
      setCards(due);
      const s = await getStats(SEED_WORDS.length);
      setStats(s);
      const str = await getStreak();
      setStreak(str);
      const longest = await getLongestStreak();
      setLongestStreak(longest);
      const history = await getStudyHistory();
      setStudyHistory(history);
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

    const reviewCards = cards.filter(c => c.progress && c.progress.state !== 'new');

    if (reviewCards.length > 0) {
      startReviewSession(reviewCards);
    } else {
      setPhase('sorting');
      setCurrentIndex(0);
      setShowAnswer(false);
    }
  };

  const startReviewSession = (reviewCards: CardState[]) => {
    const wordsToReview = reviewCards.slice(0, 3).map(c => c.word);
    const firstStep = reviewCards[0].progress?.learningStep || 1;
    const exerciseIndex = Math.min(firstStep, 3) as 0 | 1 | 2 | 3;

    const session: LearningSessionType = {
      unknownWords: wordsToReview,
      currentExerciseType: exerciseIndex,
      currentWordIndex: 0,
    };
    startLearning(session);
  };

  const handleKnow = async (know: boolean) => {
    const current = cards[currentIndex];
    if (!current) return;

    if (!know) {
      const session = learningSession || { unknownWords: [], currentExerciseType: 0 as 0, currentWordIndex: 0 };
      session.unknownWords.push(current.word);
      setLearningSession(session);

      if (session.unknownWords.length >= 3) {
        startLearning(session);
        return;
      }
    } else {
      await rateCard(current.word.id, 4, current.progress);
    }

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      if (learningSession && learningSession.unknownWords.length > 0) {
        startLearning(learningSession);
      } else {
        setPhase('menu');
        loadCards();
      }
    }
  };

  const startLearning = (session: LearningSessionType) => {
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
    const currentWord = unknownWords[currentWordIndex];
    const cardState = cards.find(c => c.word.id === currentWord.id);
    const isReviewSession = !!cardState?.progress;

    if (isReviewSession) {
      if (currentWordIndex < unknownWords.length - 1) {
        const nextWord = unknownWords[currentWordIndex + 1];
        const nextCardState = cards.find(c => c.word.id === nextWord.id);
        const nextStep = nextCardState?.progress?.learningStep || 1;
        const nextExerciseIndex = Math.min(nextStep, 3) as 0 | 1 | 2 | 3;

        const newSession = {
          ...learningSession,
          currentWordIndex: currentWordIndex + 1,
          currentExerciseType: nextExerciseIndex,
        };
        setLearningSession(newSession);
        setExerciseType(getExerciseTypeByIndex(nextExerciseIndex));
        setupExercise(nextWord, getExerciseTypeByIndex(nextExerciseIndex));
      } else {
        finishLearningSession();
      }
    } else {
      if (currentWordIndex < unknownWords.length - 1) {
        const newSession = {
          ...learningSession,
          currentWordIndex: currentWordIndex + 1,
        };
        setLearningSession(newSession);
        setupExercise(unknownWords[currentWordIndex + 1], getExerciseTypeByIndex(currentExerciseType));
      } else if (currentExerciseType < 3) {
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
        finishLearningSession();
      }
    }
  };

  const finishLearningSession = async () => {
    if (!learningSession) return;

    const firstWord = learningSession.unknownWords[0];
    const cardState = cards.find(c => c.word.id === firstWord.id);

    if (cardState?.progress) {
      for (const word of learningSession.unknownWords) {
        const wordProgress = cards.find(c => c.word.id === word.id)?.progress;
        if (wordProgress) {
          await rateCard(word.id, 3, wordProgress);
        }
      }
      Alert.alert('Отлично!', `Вы повторили ${learningSession.unknownWords.length} слов. Они вернутся позже.`);
    } else {
      for (const word of learningSession.unknownWords) {
        await rateCard(word.id, 3, null);
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

  if (phase === 'menu') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Link href="/" asChild>
            <Pressable style={styles.back}>
              <Text style={styles.backText}>←</Text>
            </Pressable>
          </Link>
          <Text style={styles.title}>Слова</Text>
        </View>
        <WordsMenu
          loading={loading}
          stats={stats}
          streak={streak}
          longestStreak={longestStreak}
          studyHistory={studyHistory}
          totalWords={SEED_WORDS.length}
          onStart={startSorting}
        />
      </View>
    );
  }

  if (phase === 'sorting') {
    const current = cards[currentIndex];
    if (!current) return null;

    const unknownCount = learningSession?.unknownWords.length || 0;

    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SortingPhase
          card={current}
          currentIndex={currentIndex}
          totalCards={cards.length}
          unknownCount={unknownCount}
          onKnow={handleKnow}
          onClose={() => setPhase('menu')}
        />
      </View>
    );
  }

  if (phase === 'learning') {
    if (!learningSession) return null;
    const current = learningSession.unknownWords[learningSession.currentWordIndex];

    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LearningSession
          session={learningSession}
          exerciseType={exerciseType}
          currentWord={current}
          showAnswer={showAnswer}
          onToggleAnswer={() => setShowAnswer(true)}
          choices={choices}
          selectedChoice={selectedChoice}
          choiceResult={choiceResult}
          onChoice={handleChoice}
          letters={letters}
          assembled={assembled}
          assemblyResult={assemblyResult}
          onLetterPress={handleLetterPress}
          onBackspace={handleBackspace}
          userInput={userInput}
          inputResult={inputResult}
          onInputChange={setUserInput}
          onInputSubmit={handleInputSubmit}
          onNext={moveToNextExercise}
          onClose={() => setPhase('menu')}
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    gap: 16,
  },
  back: { padding: 4 },
  backText: { fontSize: 28, color: 'rgba(255,255,255,0.5)' },
  title: { fontSize: 24, fontWeight: '300', color: '#fff' },
});
