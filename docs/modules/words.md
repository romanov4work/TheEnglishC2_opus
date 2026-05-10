# Модуль "Слова" (Words)

## Описание

Модуль тренировки слов с интервальными повторениями по алгоритму SM-2 (как в Anki).

## Структура данных

### Word
```typescript
{
  id: number;
  word: string;           // английское слово
  translation: string;    // перевод
  phonetic?: string;      // IPA транскрипция, напр. "/həˈloʊ/"
  partOfSpeech?: string;   // часть речи: noun, verb, adjective...
  examples?: string;      // примеры в JSON: '["пример1", "пример2"]'
  level: string;          // уровень: A1, A2, B1, B2, C1, C2
  tags: string;           // теги в JSON: '["greetings","basic"]'
}
```

### UserProgress
```typescript
{
  id: number;
  wordId: number;
  easeFactor: number;     // коэффициент легкости (default 2.5)
  interval: number;       // интервал в днях
  repetitions: number;    // кол-во успешных повторений
  nextReview: number;     // timestamp следующего повторения
  lastReview: number;     // timestamp последнего повторения
}
```

## Алгоритм SM-2

При оценке карточки (quality 0-5):
- **0-2 (не знаю):** сброс повторений, интервал = 1 день
- **3 (трудно):** интервал ~3 дня
- **4-5 (легко):** интервал растёт: 1 → 6 → 14+ дней

Формула: `interval = round(interval * easeFactor)`

## Файлы

- `src/db/database.ts` — хранение и логика SM-2
- `src/data/seedWords.ts` — база слов для старта (60 слов A1-C2)
- `app/words.tsx` — UI модуля

## UI Flow

1. **Меню** — статистика + кнопка "Начать тренировку"
2. **Карточка** — показано слово (tap → reveal)
3. **Оценка** — Снова / Трудно / Легко
4. **Прогресс** — сохраняется в AsyncStorage

## Будущие улучшения

- [ ] Упражнения: выбор из 4 вариантов
- [ ] Сборка слова из букв
- [ ] Ручной ввод слова с проверкой
- [ ] Написание предложения со словом
- [ ] Семьи слов (word families)
- [ ] Tap на слово → показ перевода
- [ ] Добавление своих слов
- [ ] 10 000 слов (сейчас 60)
- [ ] IELTS/TOEFL фильтрация