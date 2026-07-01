interface Props {
  label: string;
  tone?: 'primary' | 'secondary';
}

export function MuscleTag({ label, tone = 'primary' }: Props) {
  const styles =
    tone === 'primary'
      ? 'bg-ios-blue/10 text-ios-blue dark:bg-ios-blue/20'
      : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300';
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${styles}`}
    >
      {label}
    </span>
  );
}
