import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

interface FiltersProps {
  selectedLevel: string | null;
  selectedTag: string | null;
  availableLevels: string[];
  availableTags: string[];
  onLevelSelect: (level: string | null) => void;
  onTagSelect: (tag: string | null) => void;
}

export default function Filters({
  selectedLevel,
  selectedTag,
  availableLevels,
  availableTags,
  onLevelSelect,
  onTagSelect,
}: FiltersProps) {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Уровень</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
          <Pressable
            style={[styles.chip, !selectedLevel && styles.chipActive]}
            onPress={() => onLevelSelect(null)}
          >
            <Text style={[styles.chipText, !selectedLevel && styles.chipTextActive]}>Все</Text>
          </Pressable>
          {availableLevels.map((level) => (
            <Pressable
              key={level}
              style={[styles.chip, selectedLevel === level && styles.chipActive]}
              onPress={() => onLevelSelect(level)}
            >
              <Text style={[styles.chipText, selectedLevel === level && styles.chipTextActive]}>
                {level}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Теги</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
          <Pressable
            style={[styles.chip, !selectedTag && styles.chipActive]}
            onPress={() => onTagSelect(null)}
          >
            <Text style={[styles.chipText, !selectedTag && styles.chipTextActive]}>Все</Text>
          </Pressable>
          {availableTags.map((tag) => (
            <Pressable
              key={tag}
              style={[styles.chip, selectedTag === tag && styles.chipActive]}
              onPress={() => onTagSelect(tag)}
            >
              <Text style={[styles.chipText, selectedTag === tag && styles.chipTextActive]}>
                {tag}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    marginBottom: 16,
  },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scroll: { flexDirection: 'row' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  chipText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '400',
  },
  chipTextActive: {
    color: '#fff',
  },
});
