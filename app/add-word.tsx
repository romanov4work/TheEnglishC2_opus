import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { addCustomWord } from '../src/db/database';

export default function AddWordPage() {
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [example, setExample] = useState('');
  const [level, setLevel] = useState('A1');
  const [tag, setTag] = useState('');

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const handleSave = async () => {
    if (!word.trim() || !translation.trim()) {
      Alert.alert('Ошибка', 'Заполните слово и перевод');
      return;
    }

    try {
      const examples = example.trim() ? [example.trim()] : [];
      const tags = tag.trim() ? [tag.trim()] : ['custom'];

      await addCustomWord({
        word: word.trim(),
        translation: translation.trim(),
        phonetic: phonetic.trim() || undefined,
        partOfSpeech: partOfSpeech.trim() || undefined,
        examples: JSON.stringify(examples),
        level,
        tags: JSON.stringify(tags),
      });

      Alert.alert('Успех', 'Слово добавлено', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('Ошибка', String(e));
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Link href="/words" asChild>
          <Pressable style={styles.back}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
        </Link>
        <Text style={styles.title}>Добавить слово</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>Слово *</Text>
          <TextInput
            style={styles.input}
            value={word}
            onChangeText={setWord}
            placeholder="hello"
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Перевод *</Text>
          <TextInput
            style={styles.input}
            value={translation}
            onChangeText={setTranslation}
            placeholder="привет"
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Фонетика</Text>
          <TextInput
            style={styles.input}
            value={phonetic}
            onChangeText={setPhonetic}
            placeholder="/həˈloʊ/"
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Часть речи</Text>
          <TextInput
            style={styles.input}
            value={partOfSpeech}
            onChangeText={setPartOfSpeech}
            placeholder="noun, verb, adjective..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Пример использования</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={example}
            onChangeText={setExample}
            placeholder="Hello, how are you?"
            placeholderTextColor="rgba(255,255,255,0.3)"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Уровень</Text>
          <View style={styles.levelGrid}>
            {levels.map((l) => (
              <Pressable
                key={l}
                style={[styles.levelBtn, level === l && styles.levelBtnActive]}
                onPress={() => setLevel(l)}
              >
                <Text style={[styles.levelText, level === l && styles.levelTextActive]}>{l}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Тег</Text>
          <TextInput
            style={styles.input}
            value={tag}
            onChangeText={setTag}
            placeholder="basic, food, travel..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="none"
          />
        </View>

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Сохранить</Text>
        </Pressable>
      </ScrollView>
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
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  field: { marginBottom: 20 },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    fontSize: 16,
    color: '#fff',
  },
  inputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  levelBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  levelText: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '400' },
  levelTextActive: { color: '#fff' },
  saveBtn: {
    padding: 18,
    backgroundColor: 'rgba(34,197,94,0.2)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.4)',
    marginTop: 20,
  },
  saveBtnText: { fontSize: 16, fontWeight: '400', color: '#22c55e', textAlign: 'center' },
});
