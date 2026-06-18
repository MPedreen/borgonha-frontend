import { Badge as UiBadge } from '@/components/ui/badge'
import type { ReactNode } from 'react'

interface BadgeProps {
  variante: 'success' | 'warning' | 'danger'
  children: ReactNode
}

export function Badge({ variante, children }: BadgeProps) {
  return (
    <UiBadge variant={variante === 'danger' ? 'destructive' : variante}>
      {children}
    </UiBadge>
  )
}
