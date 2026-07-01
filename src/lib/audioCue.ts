// Audio + haptic cues for workout interactions. iOS Safari requires an
// AudioContext to be created/resumed inside a user gesture before it will play,
// so `unlockAudio` is called from the first tap (start workout / start timer /
// mark set done) to keep it warm. All cues are gated by the user's "Sounds"
// setting via `setFeedbackEnabled`, kept in module state so the many non-React
// call sites (timer callbacks, etc.) don't each need the store.

let ctx: AudioContext | null = null;
let enabled = true;

/** Mirror the user's Sounds setting here so every cue can cheaply honour it. */
export function setFeedbackEnabled(on: boolean): void {
  enabled = on;
}

export function unlockAudio(): void {
  if (typeof window === 'undefined') return;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

/** Schedule a single shaped tone `at` seconds from now. */
function tone(
  freq: number,
  at: number,
  duration: number,
  peak = 0.3,
  type: OscillatorType = 'sine',
): void {
  if (!ctx) return;
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Short tone(s). Safe to call without a prior gesture (it just no-ops). */
export function beep(times = 1, freq = 880): void {
  if (!enabled) return;
  unlockAudio();
  for (let i = 0; i < times; i++) tone(freq, i * 0.18, 0.16);
}

export function vibrate(pattern: number | number[]): void {
  if (!enabled) return;
  if (typeof navigator !== 'undefined') navigator.vibrate?.(pattern);
}

/** Workout / session is starting: a confident rising perfect-fifth. */
export function startCue(): void {
  if (!enabled) return;
  unlockAudio();
  tone(660, 0, 0.13, 0.28);
  tone(990, 0.1, 0.2, 0.3);
  vibrate(35);
}

/** A set was just marked done — a crisp confirmation pop. */
export function setDoneCue(): void {
  if (!enabled) return;
  unlockAudio();
  tone(1046, 0, 0.11, 0.26, 'triangle');
  vibrate(20);
}

/** One short tick for the final 3-2-1 seconds of a running timer. */
export function countdownCue(): void {
  if (!enabled) return;
  unlockAudio();
  tone(720, 0, 0.09, 0.22);
}

/** A rest/timer countdown finished: two prominent beeps + a short buzz. */
export function alertCue(): void {
  beep(2, 920);
  vibrate([120, 60, 120]);
}

/** A lighter cue for phase transitions in the interval timer. */
export function tickCue(freq = 760): void {
  beep(1, freq);
  vibrate(60);
}

/** The whole workout / interval session is complete: a celebratory arpeggio. */
export function finishCue(): void {
  if (!enabled) return;
  unlockAudio();
  // Ascending C-major arpeggio, landing on a longer top note.
  [523, 659, 784].forEach((f, i) => tone(f, i * 0.12, 0.16, 0.28));
  tone(1046, 0.36, 0.4, 0.32);
  vibrate([50, 40, 50, 40, 140]);
}
