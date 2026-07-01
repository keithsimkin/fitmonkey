interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

/** iOS segmented control. */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: Props<T>) {
  return (
    <div className="flex rounded-lg bg-black/5 p-0.5 dark:bg-white/10">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
              active
                ? 'bg-white text-black dark:bg-neutral-600 dark:text-white'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
