import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/** Base rounded card surface. Becomes a pressable button when `onClick` is set. */
export function Card({ children, className = '', onClick }: Props) {
  if (onClick) {
    return (
      <button onClick={onClick} className={`card press w-full text-left ${className}`}>
        {children}
      </button>
    );
  }
  return <div className={`card ${className}`}>{children}</div>;
}
