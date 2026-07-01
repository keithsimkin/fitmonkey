# Workout — iOS-native home workout PWA

A personal home & gym workout tracker designed to be added to the iOS home screen
and run standalone. Built with Vite + React + TypeScript, styled iOS-native with
Konsta UI + Tailwind, animated with Framer Motion. UI-first — all data persists
client-side (no backend).

## Features

- **Today** — daily streak, Home/Gym toggle (Gym unlocks more equipment → more
  exercise variations), split-day picker, per-day equipment selection.
- **Workout** — exercises filtered by your split's target muscles + available
  equipment, each with an embedded animation, full **sets / reps / weight**
  logging (prefilled from your last session).
- **Calendar** — month grid of workout/rest days, streak + total-workout stats.
- **Splits** — built-in routines (PPL, Upper/Lower, Full Body, Bro) plus a custom
  split editor.
- **Settings** — Auto/Light/Dark appearance, kg/lb, week start, reset.

## Data & animations

Exercise data comes from [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
(~870 exercises), which is released into the public domain (Unlicense) — no API
key, rate limit, or disputed media ownership. `bun run data` fetches it, maps its
taxonomy onto the fields we need, and writes `public/data/exercises.min.json`,
which is seeded into IndexedDB on first launch. Each exercise ships two still
frames (start / end); `ExerciseGif` cross-fades them to imply motion. Frames are
served from jsDelivr
(`https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/{path}`)
and cached by the service worker for offline use.

## Develop

```bash
bun install
bun run data     # generate public/data/exercises.min.json (run once)
bun run icons    # generate placeholder PWA icons (replace with real art)
bun run dev      # http://localhost:5173
bun run build    # production build + service worker
```

## Tech

Vite · React 19 · TypeScript · Konsta UI · Tailwind CSS v3 · Framer Motion ·
React Router · Zustand (persist) · idb (IndexedDB) · date-fns · vite-plugin-pwa.

## Add to iPhone home screen

Open the built/preview site in Safari → Share → **Add to Home Screen**. It
launches standalone with safe-area/notch handling and a translucent status bar.
