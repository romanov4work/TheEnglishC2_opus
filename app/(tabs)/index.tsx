import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, ScrollView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2;

const MODULES = [
  { id: 'words', icon: '📚', title: 'Слова', subtitle: '10 000 слов', color: '#6366f1', gradient: '#4f46e5', accent: '#818cf8' },
  { id: 'grammar', icon: '📖', title: 'Грамматика', subtitle: 'C1 — C2', color: '#ec4899', gradient: '#db2777', accent: '#f472b6' },
  { id: 'pronunciation', icon: '🎤', title: 'Произношение', subtitle: 'IPA фонетика', color: '#f59e0b', gradient: '#d97706', accent: '#fbbf24' },
  { id: 'reading', icon: '📖', title: 'Читаем', subtitle: 'Тексты и статьи', color: '#10b981', gradient: '#059669', accent: '#34d399' },
  { id: 'listening', icon: '🎧', title: 'Слушаем', subtitle: 'Аудирование', color: '#06b6d4', gradient: '#0891b2', accent: '#22d3ee' },
  { id: 'writing', icon: '✍️', title: 'Пишем', subtitle: 'Эссе и письма', color: '#8b5cf6', gradient: '#7c3aed', accent: '#a78bfa' },
  { id: 'speaking', icon: '💬', title: 'Говорим', subtitle: 'Speaking', color: '#ef4444', gradient: '#dc2626', accent: '#f87171' },
];

function ModuleCard({ module }: { module: typeof MODULES[0] }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.cardInner, { backgroundColor: module.gradient }]}>
        {/* Декоративные элементы */}
        <View style={[styles.cardOrb1, { backgroundColor: module.accent }]} />
        <View style={[styles.cardOrb2, { backgroundColor: module.accent }]} />

        <View style={styles.cardContent}>
          <Text style={styles.icon}>{module.icon}</Text>
          <Text style={styles.title}>{module.title}</Text>
          <Text style={styles.subtitle}>{module.subtitle}</Text>
        </View>

        <View style={styles.cardArrow}>
          <Text style={styles.arrow}>›</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.logo}>English</Text>
              <Text style={styles.headerSubtitle}>Твой путь к C1</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakNum}>7</Text>
              <Text style={styles.streakLabel}>дней</Text>
            </View>
          </View>
        </View>

        <View style={styles.grid}>
          {MODULES.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: 28 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1.5,
    textShadowColor: 'rgba(99, 102, 241, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
    fontWeight: '400',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  streakBadge: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  streakNum: {
    fontSize: 24,
    fontWeight: '900',
    color: '#6366f1',
  },
  streakLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: 12,
    borderRadius: 20,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },
  cardInner: {
    height: 148,
    borderRadius: 20,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  cardOrb1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.15,
  },
  cardOrb2: {
    position: 'absolute',
    bottom: -20,
    left: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.1,
  },
  cardContent: {
    flex: 1,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
  },
  cardArrow: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  arrow: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '300',
  },
});
