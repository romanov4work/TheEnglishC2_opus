# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**English** — мобильное приложение для изучения английского языка до уровня C1. Системный подход, замена репетитору, коммерческий продукт для web, Android и iOS.

## Tech Stack

- React Native с Expo (SDK 54)
- TypeScript
- 7 модулей: Слова, Грамматика, Произношение, Читаем, Слушаем, Пишем, Говорим

## Commands

```bash
npm start          # запуск dev-сервера
npm run android    # Android
npm run ios        # iOS
npm run web        # web
npx expo --help    # Expo CLI
```

## Git Workflow

- **develop** — основная ветка разработки
- **master** — production (мерж после каждого деплоя)
- Commit и push в develop после каждой задачи
- Проверять консоль на ошибки самостоятельно (с запущенным проектом)

## Development Process

1. Предложить план задачи
2. После одобрения — реализация без доп. разрешений
3. Самостоятельная проверка консоли
4. Commit + push → предлагать следующую задачу

## Architecture

- Простая структура, минимум папок
- Все компоненты в одном файле или рядом
- App.tsx — точка входа, главный экран с 7 модулями-плитками

## Design

Premium aesthetic: front-end design plugin, distinctive fonts, bold colors, animations. Не использовать generic AI-стиль.

## API

Используется custom Claude API endpoint (см. settings.json в parent dir).
