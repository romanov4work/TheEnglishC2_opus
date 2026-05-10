# Архитектура English App

## Стек

- **React Native + Expo SDK 54**
- **expo-router** — file-based routing
- **AsyncStorage** — persistence (web + mobile)
- **TypeScript**

## Структура файлов

```
app/                    # expo-router pages
  _layout.tsx          # root layout (Stack)
  index.tsx            # redirect → (tabs)
  (tabs)/
    _layout.tsx        # tab bar (только Home)
    index.tsx          # главная — 7 модулей
  words.tsx            # модуль Слова
  grammar.tsx          # модуль Грамматика
  pronunciation.tsx   # модуль Произношение
  reading.tsx          # модуль Читаем
  listening.tsx        # модуль Слушаем
  writing.tsx          # модуль Пишем
  speaking.tsx         # модуль Говорим

src/
  db/
    database.ts        # storage + SM-2 logic
  data/
    seedWords.ts       # 60 слов для старта

docs/
  modules/             # документация по модулям
    words.md
    grammar.md
    pronunciation.md
    reading.md
    listening.md
    writing.md
    speaking.md
  README.md           # этот файл
```

## Роутинг

- `/` → главная с модулями
- `/:moduleId` → страница модуля (words, grammar, etc.)
- Таб-бар скрыт (только один таб)

## Стиль

- Минималистичный B&W дизайн
- Фон: `#0a0a0a`
- Шрифты: системные (fontWeight 200-400)
- Border: `rgba(255,255,255,0.1-0.15)`
- Letter-spacing для заголовков

## Хранение данных

**AsyncStorage** (простой key-value, работает везде):
- `words` — массив Word
- `user_progress` — массив UserProgress

SQLite можно добавить позже для больших баз.

## API планы

- Claude API — speaking module (AI собеседник)
- Web Speech API — произношение
- TTS — для модуля слов

## Деплой

- **Android:** `expo run:android` → APK / Google Play
- **iOS:** `expo run:ios` → TestFlight / App Store
- **Web:** `npm run web` → хостинг

## Платформы

Target: Play Market, App Store, RuStore, Huawei AppGallery, Galaxy Store, Xiaomi GetApps

## TODO

1. ✅ React Native + Expo
2. ✅ 7 модулей
3. ✅ Минимализм
4. ✅ Words (SM-2, 60 слов)
5. ⬜ Grammar (уроки + упражнения)
6. ⬜ Pronunciation (IPA + audio)
7. ⬜ Reading (статьи)
8. ⬜ Listening (audio + speed control)
9. ⬜ Writing (AI check)
10. ⬜ Speaking (AI dialog)