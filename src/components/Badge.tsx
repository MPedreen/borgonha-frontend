import type { ReactNode } from 'react';

interface BadgeProps {
  variante: 'success' | 'warning' | 'danger';
  children: ReactNode;
}

export function Badge({ variante, children }: BadgeProps) {
  return <span className={`badge badge-${variante}`}>{children}</span>;
}
