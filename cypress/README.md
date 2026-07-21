# Cypress E2E — Test Results & Guide

**Project:** internetLesson  
**Last verified:** 2026-07-21  
**Cypress:** 15.18.1  
**Base URL:** `http://localhost:5173`

## Latest results

### Lesson smoke sample (`lesson-smoke.cy.js`)

| Metric | Value |
|--------|--------|
| Status | **PASS** |
| Tests | **28 / 28** |
| Duration | ~13 seconds |
| Mode | Headless Electron |

Each smoke test opens a sample lesson in self-study mode and checks:

- `.lesson-root` is visible
- LiveGate is skipped (`Darsga qo'shilish` not present)
- Progress shell is present (`.progress-track`, `.progress-bar`)

Smoke does **not** walk gated screens or solve quizzes.

### Smoke sample matrix

| Module | Kod | PM | Proyekt |
|--------|-----|----|---------|
| m1 | m1-03 | m1-02 | m1-08 |
| m2 | m2-01 | m2-02 | m2-08 |
| m3 | m3-01 | m3-02 | m3-07 |
| m4 | m4-01 | m4-02 | m4-08 |
| m4a | m4a-01 | m4a-02 | m4a-04 |
| m4b | m4b-01 | m4b-02 | — |
| m4c | m4c-01 | m4c-02 | m4c-04 |
| m5 | m5-01 | m5-02 | m5-05 |
| m6 | m6-01 | m6-02 | m6-08 |
| m7 | — | m7-01 | m7-09 |

Skipped in smoke (already covered deeply elsewhere): `m1-01`, `m7-07`.  
Skipped: Demo / Rezerv cards and lessons without a `comp`.

## Test strategy

We do **not** e2e-test every lesson in the catalog (~100 keys). Coverage is layered:

| Layer | Spec files | What it covers |
|-------|------------|----------------|
| Shared flows | `catalog`, `live-gate`, `self-study`, `quiz`, `lesson-navigation`, `errors` | Catalog UI, join gate, self-study, nav, quiz pattern, error edges |
| Smoke sample | `lesson-smoke` | Load + shell for Kod / PM / Proyekt across modules |
| Deep path | `lesson-navigation`, `quiz` | Full gated flow on critical lesson `m1-01` |
| Secondary | `performance`, `ui-overlap` | Perf / overlap checks on selected lessons |

Lesson keys and `lessonId`s used by helpers live in [`support/commands.js`](support/commands.js).

## Specs overview

| Spec | Focus |
|------|--------|
| `catalog.cy.js` | Catalog load, search, type filters, open lesson, home |
| `live-gate.cy.js` | Join form, mentor entry, PIN/nickname validation |
| `self-study.cy.js` | Mustaqil mode / bypass |
| `lesson-navigation.cy.js` | Progress, back/forward, gated unlock on `m1-01` |
| `quiz.cy.js` | MC select, correct/wrong, Next enable on `m1-01` |
| `lesson-smoke.cy.js` | Sample open across modules |
| `errors.cy.js` | Invalid route, refresh self-study, empty search |
| `performance.cy.js` | Load timing on selected lessons |
| `ui-overlap.cy.js` | Overlap checks |

## How to run

Terminal 1 — app:

```bash
npm run dev
```

Terminal 2 — tests:

```bash
# All e2e specs
npm run cy:run

# Smoke only
npx cypress run --spec cypress/e2e/lesson-smoke.cy.js

# Interactive runner
npm run cy:open
```

## Coverage note

Passing smoke means sampled lessons **load in self-study with a working shell**. It does not prove every interactive screen in every module works. Deep regressions for Internet lesson flows are covered by `lesson-navigation` + `quiz` on `m1-01`.
