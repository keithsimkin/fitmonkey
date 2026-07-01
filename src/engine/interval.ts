export type IntervalMode = 'tabata' | 'emom' | 'circuit';

export interface IntervalConfig {
  mode: IntervalMode;
  workSec: number;
  restSec: number;
  rounds: number;
  prepareSec: number;
}

export interface IntervalPhase {
  kind: 'prepare' | 'work' | 'rest';
  seconds: number;
  round: number; // 1-based; 0 for the prepare phase
  totalRounds: number;
  label: string;
}

/** Sensible defaults per mode, used to seed the config UI. */
export const INTERVAL_PRESETS: Record<IntervalMode, IntervalConfig> = {
  tabata: { mode: 'tabata', workSec: 20, restSec: 10, rounds: 8, prepareSec: 10 },
  emom: { mode: 'emom', workSec: 60, restSec: 0, rounds: 10, prepareSec: 10 },
  circuit: { mode: 'circuit', workSec: 45, restSec: 15, rounds: 6, prepareSec: 10 },
};

/**
 * Expand an interval config into an ordered list of phases. Pure & testable.
 * There is no trailing rest after the final round.
 */
export function buildPhases(cfg: IntervalConfig): IntervalPhase[] {
  const phases: IntervalPhase[] = [];
  if (cfg.prepareSec > 0) {
    phases.push({
      kind: 'prepare',
      seconds: cfg.prepareSec,
      round: 0,
      totalRounds: cfg.rounds,
      label: 'Get Ready',
    });
  }
  for (let r = 1; r <= cfg.rounds; r++) {
    phases.push({
      kind: 'work',
      seconds: cfg.workSec,
      round: r,
      totalRounds: cfg.rounds,
      label: 'Work',
    });
    if (cfg.restSec > 0 && r < cfg.rounds) {
      phases.push({
        kind: 'rest',
        seconds: cfg.restSec,
        round: r,
        totalRounds: cfg.rounds,
        label: 'Rest',
      });
    }
  }
  return phases;
}

export function totalSeconds(cfg: IntervalConfig): number {
  return buildPhases(cfg).reduce((sum, p) => sum + p.seconds, 0);
}
