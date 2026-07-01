import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Pause, Play, X } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { SegmentedControl } from '../../components/ios/SegmentedControl';
import { useCountdown } from '../../hooks/useCountdown';
import { countdownCue, finishCue, tickCue, unlockAudio } from '../../lib/audioCue';
import { formatClock } from '../../lib/format';
import {
  buildPhases,
  totalSeconds,
  INTERVAL_PRESETS,
  type IntervalConfig,
  type IntervalMode,
  type IntervalPhase,
} from '../../engine/interval';

const PHASE_COLOR: Record<IntervalPhase['kind'], string> = {
  prepare: '#F4A93C',
  work: '#1FD0B0',
  rest: '#FF6F61',
};

export function IntervalTimerScreen() {
  const navigate = useNavigate();
  const [cfg, setCfg] = useState<IntervalConfig>(INTERVAL_PRESETS.circuit);
  const [phaseIdx, setPhaseIdx] = useState(-1);
  const [finished, setFinished] = useState(false);
  const phasesRef = useRef<IntervalPhase[]>([]);
  const idxRef = useRef(0);

  const timer = useCountdown({
    onDone: handlePhaseDone,
    onTick: (secs) => {
      if (secs <= 3) countdownCue(); // 3-2-1 lead-in before each phase change
    },
  });

  function handlePhaseDone() {
    const phases = phasesRef.current;
    const next = idxRef.current + 1;
    if (next >= phases.length) {
      setFinished(true);
      finishCue();
      return;
    }
    idxRef.current = next;
    setPhaseIdx(next);
    const phase = phases[next];
    tickCue(phase.kind === 'work' ? 940 : 700);
    timer.start(phase.seconds * 1000);
  }

  function startAll() {
    unlockAudio();
    const phases = buildPhases(cfg);
    if (phases.length === 0) return;
    phasesRef.current = phases;
    idxRef.current = 0;
    setFinished(false);
    setPhaseIdx(0);
    tickCue();
    timer.start(phases[0].seconds * 1000);
  }

  function stop() {
    timer.reset();
    phasesRef.current = [];
    idxRef.current = 0;
    setPhaseIdx(-1);
    setFinished(false);
  }

  const phases = phasesRef.current;
  const current = phaseIdx >= 0 ? phases[phaseIdx] : null;
  const idle = phaseIdx < 0;

  if (!idle && current) {
    const secs = Math.ceil(timer.remainingMs / 1000);
    const frac = timer.totalMs > 0 ? timer.remainingMs / timer.totalMs : 0;
    const color = finished ? '#27C281' : PHASE_COLOR[current.kind];
    return (
      <div className="flex min-h-full flex-col">
        <PageHeader title="Interval Timer" onBack={stop} />
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
          <p
            className="text-[22px] font-extrabold uppercase tracking-widest"
            style={{ color }}
          >
            {finished ? 'Done 🎉' : current.label}
          </p>
          <ProgressRing value={finished ? 1 : frac} size={260} stroke={18} color={color}>
            <div className="text-center">
              <p className="text-[64px] font-extrabold leading-none tabular-nums">
                {finished ? '0:00' : formatClock(secs)}
              </p>
              {!finished && current.kind !== 'prepare' && (
                <p className="mt-2 text-[15px] font-semibold text-neutral-500">
                  Round {current.round} / {current.totalRounds}
                </p>
              )}
            </div>
          </ProgressRing>

          <div className="flex items-center gap-4">
            {finished ? (
              <button
                onClick={startAll}
                className="press rounded-full bg-mint px-8 py-4 text-[17px] font-bold text-ink"
              >
                Again
              </button>
            ) : (
              <button
                onClick={() => (timer.paused ? timer.resume() : timer.pause())}
                className="press flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white dark:bg-white dark:text-ink"
              >
                {timer.paused ? <Play className="h-7 w-7" /> : <Pause className="h-7 w-7" />}
              </button>
            )}
            <button
              onClick={stop}
              className="press flex h-16 w-16 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
            >
              <X className="h-7 w-7" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Config view
  const est = totalSeconds(cfg);
  return (
    <div className="min-h-full pb-28">
      <PageHeader title="Interval Timer" onBack={() => navigate(-1)} />
      <div className="space-y-6 px-4 pt-3">
        <div>
          <p className="mb-1.5 px-1 text-[13px] font-medium text-neutral-500">Mode</p>
          <SegmentedControl<IntervalMode>
            value={cfg.mode}
            onChange={(mode) => setCfg(INTERVAL_PRESETS[mode])}
            options={[
              { value: 'tabata', label: 'Tabata' },
              { value: 'emom', label: 'EMOM' },
              { value: 'circuit', label: 'Circuit' },
            ]}
          />
        </div>

        <div className="card divide-y divide-black/5 dark:divide-white/10">
          <StepRow
            label="Work"
            value={cfg.workSec}
            suffix="s"
            step={5}
            min={5}
            onChange={(workSec) => setCfg((c) => ({ ...c, workSec }))}
          />
          <StepRow
            label="Rest"
            value={cfg.restSec}
            suffix="s"
            step={5}
            min={0}
            onChange={(restSec) => setCfg((c) => ({ ...c, restSec }))}
          />
          <StepRow
            label="Rounds"
            value={cfg.rounds}
            step={1}
            min={1}
            onChange={(rounds) => setCfg((c) => ({ ...c, rounds }))}
          />
          <StepRow
            label="Prepare"
            value={cfg.prepareSec}
            suffix="s"
            step={5}
            min={0}
            onChange={(prepareSec) => setCfg((c) => ({ ...c, prepareSec }))}
          />
        </div>

        <p className="text-center text-[14px] text-neutral-500">
          Total ≈ {formatClock(est)}
        </p>

        <button
          onClick={startAll}
          className="press w-full rounded-2xl bg-coral py-4 text-[17px] font-bold text-white shadow-card"
        >
          Start
        </button>
      </div>
    </div>
  );
}

function StepRow({
  label,
  value,
  onChange,
  step,
  min,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[16px] font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="press flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-[3.5rem] text-center text-[17px] font-bold tabular-nums">
          {value}
          {suffix ?? ''}
        </span>
        <button
          onClick={() => onChange(value + step)}
          className="press flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
