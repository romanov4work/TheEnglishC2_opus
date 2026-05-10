import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Stats } from '../../src/types/words';
import Filters from './Filters';

interface WordsMenuProps {
  loading: boolean;
  stats: Stats;
  streak: number;
  longestStreak: number;
  studyHistory: string[];
  totalWords: number;
  selectedLevel: string | null;
  selectedTag: string | null;
  availableLevels: string[];
  availableTags: string[];
  onLevelSelect: (level: string | null) => void;
  onTagSelect: (tag: string | null) => void;
  onStart: () => void;
}

export default function WordsMenu({
  loading,
  stats,
  streak,
  longestStreak,
  studyHistory,
  totalWords,
  selectedLevel,
  selectedTag,
  availableLevels,
  availableTags,
  onLevelSelect,
  onTagSelect,
  onStart,
}: WordsMenuProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Filters
        selectedLevel={selectedLevel}
        selectedTag={selectedTag}
        availableLevels={availableLevels}
        availableTags={availableTags}
        onLevelSelect={onLevelSelect}
        onTagSelect={onTagSelect}
      />

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
          <Text style={styles.streakText}>
            {streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'} подряд
          </Text>
        </View>
      )}

      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarTitle}>История занятий</Text>
          <Text style={styles.calendarSubtitle}>
            Рекорд: {longestStreak} {longestStreak === 1 ? 'день' : longestStreak < 5 ? 'дня' : 'дней'}
          </Text>
        </View>
        <View style={styles.calendarGrid}>
          {Array.from({ length: 30 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            const dateStr = date.toDateString();
            const hasStudy = studyHistory.includes(dateStr);
            const isToday = i === 29;

            return (
              <View
                key={i}
                style={[
                  styles.calendarDay,
                  hasStudy && styles.calendarDayActive,
                  isToday && styles.calendarDayToday,
                ]}
              />
            );
          })}
        </View>
      </View>

      <Pressable style={styles.startBtn} onPress={onStart}>
        <Text style={styles.startBtnText}>Начать тренировку</Text>
      </Pressable>

      <View style={styles.infoRow}>
        <Text style={styles.infoText}>Точность: {stats.retentionRate}%</Text>
        <Text style={styles.infoText}>Всего: {totalWords}</Text>
      </View>

      <View style={styles.linksRow}>
        <Link href="/stats" asChild>
          <Pressable style={styles.link}>
            <Text style={styles.linkText}>📊 Статистика</Text>
          </Pressable>
        </Link>
        <Link href="/settings" asChild>
          <Pressable style={styles.link}>
            <Text style={styles.linkText}>⚙ Настройки</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  loadingText: { fontSize: 16, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40 },
  statsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 20,
    marginBottom: 16,
  },
  statsTitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 32, fontWeight: '300', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  dueRow: { paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  dueText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251,146,60,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.3)',
    padding: 16,
    marginBottom: 16,
  },
  streakIcon: { fontSize: 24, marginRight: 8 },
  streakText: { fontSize: 16, fontWeight: '400', color: '#fb923c' },
  calendarCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 20,
    marginBottom: 20,
  },
  calendarHeader: { marginBottom: 16 },
  calendarTitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  calendarSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  calendarDay: {
    width: 12,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
  },
  calendarDayActive: { backgroundColor: 'rgba(34,197,94,0.6)' },
  calendarDayToday: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  startBtn: {
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  startBtnText: { fontSize: 18, fontWeight: '400', color: '#fff', textAlign: 'center' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  infoText: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  linksRow: { flexDirection: 'row', gap: 12 },
  link: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  linkText: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
});
