import { useState, useEffect } from 'react';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSettings, saveSettings, Settings } from '../src/db/database';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await getSettings();
      setSettings(s);
      setLoading(false);
    } catch (e) {
      Alert.alert('Error', String(e));
      setLoading(false);
    }
  };

  const updateDailyNewLimit = (delta: number) => {
    if (!settings) return;
    const newLimit = Math.max(5, Math.min(50, settings.dailyNewLimit + delta));
    const updated = { ...settings, dailyNewLimit: newLimit };
    setSettings(updated);
    saveSettings(updated);
  };

  const updateDailyReviewLimit = (delta: number) => {
    if (!settings) return;
    const newLimit = Math.max(50, Math.min(500, settings.dailyReviewLimit + delta));
    const updated = { ...settings, dailyReviewLimit: newLimit };
    setSettings(updated);
    saveSettings(updated);
  };

  const resetProgress = () => {
    Alert.alert(
      'Сбросить прогресс?',
      'Все изученные слова будут удалены. Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('user_progress');
              Alert.alert('Готово', 'Прогресс сброшен');
            } catch (e) {
              Alert.alert('Error', String(e));
            }
          },
        },
      ]
    );
  };

  if (loading || !settings) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Link href="/" asChild>
          <Pressable style={styles.back}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
        </Link>
        <Text style={styles.title}>Настройки</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Лимиты</Text>

          <View style={styles.setting}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Новых слов в день</Text>
              <Text style={styles.settingDesc}>Сколько новых слов показывать ежедневно</Text>
            </View>
            <View style={styles.counter}>
              <Pressable style={styles.counterBtn} onPress={() => updateDailyNewLimit(-5)}>
                <Text style={styles.counterBtnText}>−</Text>
              </Pressable>
              <Text style={styles.counterValue}>{settings.dailyNewLimit}</Text>
              <Pressable style={styles.counterBtn} onPress={() => updateDailyNewLimit(5)}>
                <Text style={styles.counterBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.setting}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Повторений в день</Text>
              <Text style={styles.settingDesc}>Максимум карточек на повторение</Text>
            </View>
            <View style={styles.counter}>
              <Pressable style={styles.counterBtn} onPress={() => updateDailyReviewLimit(-50)}>
                <Text style={styles.counterBtnText}>−</Text>
              </Pressable>
              <Text style={styles.counterValue}>{settings.dailyReviewLimit}</Text>
              <Pressable style={styles.counterBtn} onPress={() => updateDailyReviewLimit(50)}>
                <Text style={styles.counterBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Опасная зона</Text>
          <Pressable style={styles.dangerBtn} onPress={resetProgress}>
            <Text style={styles.dangerBtnText}>Сбросить весь прогресс</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 24, color: '#fff', fontWeight: '300' },
  title: { fontSize: 28, fontWeight: '200', color: '#fff', letterSpacing: -1, marginLeft: 12 },
  loadingText: { fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: '300', textAlign: 'center', marginTop: 100 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  section: { marginBottom: 40 },
  sectionTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '300',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },

  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  settingInfo: { flex: 1, marginRight: 16 },
  settingLabel: { fontSize: 16, fontWeight: '400', color: '#fff', marginBottom: 4 },
  settingDesc: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '300' },

  counter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: { fontSize: 20, color: '#fff', fontWeight: '300' },
  counterValue: { fontSize: 18, fontWeight: '400', color: '#fff', minWidth: 40, textAlign: 'center' },

  dangerBtn: {
    padding: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
  },
  dangerBtnText: { fontSize: 15, fontWeight: '400', color: '#ef4444' },
});
