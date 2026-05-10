import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

const STATS = [
  { label: 'Дней подряд', value: '7', icon: '🔥' },
  { label: 'Изучено слов', value: '342', icon: '📚' },
  { label: 'Часов практики', value: '12', icon: '⏱' },
  { label: 'Уровень', value: 'B1', icon: '🎯' },
];

const ACHIEVEMENTS = [
  { label: 'Первое слово', icon: '🌟', done: true },
  { label: '7 дней подряд', icon: '🔥', done: true },
  { label: '100 слов', icon: '💯', done: true },
  { label: '200 слов', icon: '📈', done: false },
  { label: '500 слов', icon: '🏆', done: false },
  { label: 'IELTS практика', icon: '🎓', done: false },
];

export default function ProfileScreen() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>E</Text>
          </View>
          <Text style={styles.name}>English Learner</Text>
          <Text style={styles.level}>Уровень B1 — Intermediate</Text>
          <View style={styles.levelBar}>
            <View style={[styles.levelFill, { width: '35%' }]} />
          </View>
          <Text style={styles.levelProgress}>35% до B2</Text>
        </View>

        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Достижения</Text>
        <View style={styles.achievements}>
          {ACHIEVEMENTS.map((ach) => (
            <View key={ach.label} style={[styles.achCard, !ach.done && styles.achCardLocked]}>
              <Text style={[styles.achIcon, !ach.done && styles.achIconLocked]}>{ach.icon}</Text>
              <Text style={[styles.achLabel, !ach.done && styles.achLabelLocked]}>{ach.label}</Text>
              {ach.done && <Text style={styles.achDone}>✓</Text>}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(99,102,241,0.4)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  level: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
  },
  levelBar: {
    width: '80%',
    height: 6,
    backgroundColor: '#1a1a2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  levelProgress: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#111118',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
  },
  achievements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achCard: {
    width: '31%',
    backgroundColor: '#111118',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
    position: 'relative',
  },
  achCardLocked: {
    borderColor: 'rgba(255,255,255,0.05)',
    opacity: 0.5,
  },
  achIcon: { fontSize: 28, marginBottom: 6 },
  achIconLocked: { opacity: 0.4 },
  achLabel: { fontSize: 10, color: '#fff', textAlign: 'center', fontWeight: '600' },
  achLabelLocked: { color: 'rgba(255,255,255,0.3)' },
  achDone: {
    position: 'absolute',
    top: 6,
    right: 6,
    fontSize: 12,
    color: '#10b981',
    fontWeight: '900',
  },
});
