import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const MODULES = [
  { id: 'words', icon: 'Aa', title: 'Слова', subtitle: '10 000 слов', border: '#ffffff' },
  { id: 'grammar', icon: '§', title: 'Грамматика', subtitle: 'C1 — C2', border: '#ffffff' },
  { id: 'pronunciation', icon: '◉', title: 'Произношение', subtitle: 'IPA фонетика', border: '#ffffff' },
  { id: 'reading', icon: '◎', title: 'Читаем', subtitle: 'Тексты и статьи', border: '#ffffff' },
  { id: 'listening', icon: '◈', title: 'Слушаем', subtitle: 'Аудирование', border: '#ffffff' },
  { id: 'writing', icon: '◇', title: 'Пишем', subtitle: 'Эссе и письма', border: '#ffffff' },
  { id: 'speaking', icon: '◐', title: 'Говорим', subtitle: 'Speaking', border: '#ffffff' },
];

export default function HomeScreen() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>English</Text>
          <Text style={styles.subtitle}>Твой путь к C1</Text>
        </View>

        <View style={styles.grid}>
          {MODULES.map((module) => (
            <Link key={module.id} href={`/${module.id}`} asChild style={styles.cardLink}>
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.icon}>{module.icon}</Text>
                </View>
                <View style={styles.cardBottom}>
                  <Text style={styles.title}>{module.title}</Text>
                  <Text style={styles.cardSubtitle}>{module.subtitle}</Text>
                </View>
              </View>
            </Link>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: 40 },
  logo: {
    fontSize: 52,
    fontWeight: '200',
    color: '#fff',
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
    marginTop: 6,
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardLink: {
    width: CARD_WIDTH,
    marginBottom: 12,
  },
  card: {
    height: 160,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 20,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardTop: {},
  icon: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '200',
  },
  cardBottom: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: '400',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '300',
    letterSpacing: 1,
  },
});