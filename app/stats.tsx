import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { getStats, getStreak, getLongestStreak, getStudyHistory } from '../src/db/database';
import { SEED_WORDS } from '../src/data/seedWords';

export default function StatsPage() {
  const [stats, setStats] = useState({ new: 0, learning: 0, review: 0, dueToday: 0, retentionRate: 0 });
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [studyHistory, setStudyHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
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
      console.error(e);
      setLoading(false);
    }
  };

  const totalStudied = stats.learning + stats.review;
  const progressPercent = Math.round((totalStudied / SEED_WORDS.length) * 100);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Link href="/words" asChild>
          <Pressable style={styles.back}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
        </Link>
        <Text style={styles.title}>Статистика</Text>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Загрузка...</Text>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* Progress */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Общий прогресс</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {totalStudied} из {SEED_WORDS.length} слов ({progressPercent}%)
            </Text>
          </View>

          {/* Streak */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Серия</Text>
            <View style={styles.streakRow}>
              <View style={styles.streakItem}>
                <Text style={styles.streakNum}>{streak}</Text>
                <Text style={styles.streakLabel}>Текущая</Text>
              </View>
              <View style={styles.streakItem}>
                <Text style={styles.streakNum}>{longestStreak}</Text>
                <Text style={styles.streakLabel}>Рекорд</Text>
              </View>
              <View style={styles.streakItem}>
                <Text style={styles.streakNum}>{studyHistory.length}</Text>
                <Text style={styles.streakLabel}>Всего дней</Text>
              </View>
            </View>
          </View>

          {/* Cards breakdown */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Карточки</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxNum}>{stats.new}</Text>
                <Text style={styles.statBoxLabel}>Новые</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxNum}>{stats.learning}</Text>
                <Text style={styles.statBoxLabel}>Учу</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxNum}>{stats.review}</Text>
                <Text style={styles.statBoxLabel}>Повторение</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxNum}>{stats.dueToday}</Text>
                <Text style={styles.statBoxLabel}>К изучению</Text>
              </View>
            </View>
          </View>

          {/* Retention */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Точность</Text>
            <View style={styles.retentionCircle}>
              <Text style={styles.retentionNum}>{stats.retentionRate}%</Text>
              <Text style={styles.retentionLabel}>правильных ответов</Text>
            </View>
          </View>

          {/* Activity heatmap */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Активность (последние 90 дней)</Text>
            <View style={styles.heatmap}>
              {Array.from({ length: 90 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (89 - i));
                const dateStr = date.toDateString();
                const hasStudy = studyHistory.includes(dateStr);
                const isToday = i === 89;

                return (
                  <View
                    key={i}
                    style={[
                      styles.heatmapDay,
                      hasStudy && styles.heatmapDayActive,
                      isToday && styles.heatmapDayToday,
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
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
  loadingText: { fontSize: 16, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  progressText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  streakRow: { flexDirection: 'row', justifyContent: 'space-around' },
  streakItem: { alignItems: 'center' },
  streakNum: { fontSize: 32, fontWeight: '300', color: '#fff', marginBottom: 4 },
  streakLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
  },
  statBoxNum: { fontSize: 28, fontWeight: '300', color: '#fff', marginBottom: 4 },
  statBoxLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  retentionCircle: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  retentionNum: { fontSize: 48, fontWeight: '200', color: '#22c55e', marginBottom: 8 },
  retentionLabel: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  heatmapDay: {
    width: 10,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
  },
  heatmapDayActive: { backgroundColor: 'rgba(34,197,94,0.6)' },
  heatmapDayToday: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
});
