// Exercise media is NOT stored in the app; it is served from a free CDN.
// Source: yuhonas/free-exercise-db (public domain / Unlicense). Images are two
// still frames per exercise (start / end) — ExerciseGif alternates them to fake
// motion. jsDelivr mirrors the GitHub repo as a proper asset CDN (no key, no
// rate limit). Paths in the dataset are relative, e.g. "3_4_Sit-Up/0.jpg".
const MEDIA_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises';

export function buildImageUrl(path: string): string {
  return `${MEDIA_BASE}/${path}`;
}
