import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-6 w-6 rounded-full border-2 border-border border-t-primary animate-spin',
        className,
      )}
      role="status"
      aria-label="Carregando"
    />
  )
}
