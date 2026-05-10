# Words Module: Anki-Style Spaced Repetition System

**Date:** 2026-05-10  
**Status:** Approved  
**Goal:** Transform Words module into full Anki-style system with learning progression

## Overview

Replace current "choose training type" model with automatic progression through difficulty stages. Each word advances from simple recognition (flashcard) to active recall (typing), following proven Anki methodology.

## Current State

- 88 words (A1-C2)
- 4 training types: flashcards, 4-choice, assembly, input
- User manually selects training type
- Basic SM-2 algorithm
- 3 rating buttons (Again/Hard/Easy)

## Target State

- Automatic progression: flashcard → 4-choice → assembly → input
- Learning stages with time intervals (10m, 1d, 4d, 10d)
- 4 rating buttons (Again/Hard/Good/Easy)
- Daily limits for new words
- Streak calendar
- Enhanced statistics (forecast, retention rate)

## Architecture

### Data Model Changes

**Enhanced UserProgress:**
```typescript
interface UserProgress {
  id: number;
  wordId: number;
  
  // Card state
  state: 'new' | 'learning' | 'review' | 'relearning';
  learningStep: 0 | 1 | 2 | 3 | 4;
  
  // SM-2 parameters
  easeFactor: number;
  interval: number;
  repetitions: number;
  
  // Timestamps
  nextReview: number;
  lastReview: number;
  
  // Statistics
  totalReviews: number;
  correctReviews: number;
  lapses: number; // times clicked Again
}
```

**Learning Steps Mapping:**
- **Step 0:** New (never seen)
- **Step 1:** Flashcard (recognition) → 10 minutes
- **Step 2:** 4-choice (passive recall) → 1 day
- **Step 3:** Assembly (active recall) → 4 days
- **Step 4:** Input (full recall) → 10 days
- **Review:** Graduated (intervals grow: 10d → 1mo → 3mo)

**Settings:**
```typescript
interface Settings {
  dailyNewLimit: number; // default 20
  dailyReviewLimit: number; // default 200
  learningIntervals: number[]; // [10min, 1d, 4d, 10d] in ms
  graduatingInterval: number; // 10 days
  easyBonus: number; // 1.3x multiplier
}
```

### Progression Logic

**Rating Actions:**

**Again (1)** — Forgot:
- Reset to learningStep = 1
- state = 'relearning'
- nextReview = now + 10 minutes
- lapses += 1
- easeFactor -= 0.2 (min 1.3)

**Hard (2)** — Difficult:
- Stay on current step
- nextReview = now + (interval * 0.5)
- easeFactor -= 0.15

**Good (3)** — Normal:
- learningStep += 1
- Apply step interval
- If step > 4: state = 'review', interval = 10 days
- easeFactor unchanged

**Easy (4)** — Too easy:
- Skip all steps → state = 'review'
- interval = 4 days * easyBonus (1.3)
- easeFactor += 0.15

**Why:** This matches Anki's proven algorithm. Again resets progress (harsh but effective). Hard keeps you practicing. Good advances naturally. Easy fast-tracks mastered words.

**How to apply:** Implement in `calculateNextReview()` function with new state machine logic.

### UI Components

**1. Home Screen (Menu)**

Remove training type selection. Show:
- Daily card counts (New / Learning / Review)
- Streak counter with fire icon
- Single "Start Training" button
- Statistics link
- Settings link

**2. Training Screen**

Automatically render exercise type based on learningStep:
- Step 1 → Flashcard component
- Step 2 → 4-choice component
- Step 3 → Assembly component
- Step 4 → Input component
- Review → Random mix or user preference

**3. Rating Buttons**

Replace 3 buttons with 4:
```
[Again]  [Hard]
  1m      10m

[Good]   [Easy]
 10m      4d
```

Show next interval under each button (dynamic based on current state).

**4. Statistics Screen (New)**

- Cards by state (pie chart: New/Learning/Review)
- Daily review count (bar chart, last 30 days)
- Retention rate (% Good+Easy)
- Forecast (cards due tomorrow/next 7 days)
- Streak calendar (heatmap)

**5. Settings Screen (New)**

- Daily new cards limit (slider 5-50)
- Daily review limit (slider 50-500)
- Learning intervals (advanced)
- Reset progress (danger zone)

### Database Operations

**New Functions:**

```typescript
// Get cards due for training (respects daily limits)
getDueCards(settings: Settings): Promise<CardState[]>

// Save rating and calculate next state
rateCard(
  wordId: number, 
  rating: 1 | 2 | 3 | 4,
  currentState: UserProgress
): Promise<UserProgress>

// Get statistics
getStats(): Promise<{
  new: number;
  learning: number;
  review: number;
  dueToday: number;
  dueTomorrow: number;
  retentionRate: number;
}>

// Streak tracking
getStreak(): Promise<number>
updateStreak(): Promise<void>

// Settings
getSettings(): Promise<Settings>
saveSettings(settings: Settings): Promise<void>
```

**Migration:**

Existing progress data needs migration:
- Add new fields with defaults
- Map current interval to appropriate learningStep
- Preserve easeFactor and repetitions

**Why:** Backward compatibility ensures users don't lose progress.

**How to apply:** Create migration function that runs on app start, checks schema version.

## Word Database

**Current:** 88 words hardcoded in seedWords.ts

**Target:** 1000+ words with external source

**Options:**

1. **OPTED Word List** (Oxford 3000 + 5000)
   - Free, curated by Oxford
   - Includes frequency, CEFR levels
   - Download JSON/CSV

2. **Anki Shared Decks**
   - Export popular deck (e.g., "4000 Essential English Words")
   - Parse .apkg format or use pre-converted JSON

3. **WordNet + CEFR mapping**
   - Combine WordNet definitions with CEFR level lists
   - More work but highest quality

**Recommendation:** Start with OPTED (option 1) — it's free, well-structured, and has CEFR levels built-in.

**Implementation:**
- Fetch/download word list
- Parse into Word[] format
- Seed database on first launch
- Keep existing 88 words as "starter pack"

**Why:** OPTED is maintained by linguists, includes frequency data, and maps to CEFR (A1-C2) which we already use.

**How to apply:** Create script to download OPTED JSON, transform to our schema, save to seedWords.ts or load dynamically.

## Implementation Phases

**Phase 1: Data Layer (2-3 days)**
- Update UserProgress interface
- Implement new state machine logic
- Add Settings storage
- Migration function
- New database operations

**Phase 2: Core Training Flow (2 days)**
- Remove training type menu
- Automatic exercise rendering by step
- 4 rating buttons with intervals
- State transitions

**Phase 3: Statistics & Streak (1-2 days)**
- Streak tracking (AsyncStorage)
- Statistics screen with charts
- Forecast calculations

**Phase 4: Settings & Polish (1 day)**
- Settings screen
- Daily limits enforcement
- UI polish and animations

**Phase 5: Word Database (1 day)**
- Integrate OPTED word list
- Expand to 1000+ words
- Keep existing 88 as core

**Total:** ~7-9 days

## Testing Strategy

**Unit Tests:**
- State machine transitions (all rating × state combinations)
- Interval calculations
- Daily limit logic
- Streak calculations

**Manual Testing:**
- Complete full learning cycle (new → review)
- Test Again button (reset to step 1)
- Verify intervals match Anki behavior
- Check daily limits work
- Confirm streak increments correctly

## Success Criteria

- [ ] Word automatically progresses through 4 exercise types
- [ ] 4 rating buttons work correctly
- [ ] Daily limits enforced (new cards, reviews)
- [ ] Streak tracks consecutive days
- [ ] Statistics show accurate data
- [ ] 1000+ words available
- [ ] No loss of existing user progress
- [ ] Performance: <100ms for card load

## Open Questions

None — design is complete and approved.

## References

- Anki algorithm: https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html
- SM-2 algorithm: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
- OPTED word list: https://www.english-corpora.org/
