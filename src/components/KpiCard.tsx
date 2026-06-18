import { cn } from '@/lib/utils'

interface KpiCardProps {
  titulo: string
  valor: string
  variante?: 'padrao' | 'destaque' | 'success' | 'danger'
}

const varianteClasses: Record<
  NonNullable<KpiCardProps['variante']>,
  { borda: string; valor: string }
> = {
  padrao:   { borda: 'border-l-transparent', valor: 'text-foreground' },
  destaque: { borda: 'border-l-primary',     valor: 'text-primary' },
  success:  { borda: 'border-l-success',     valor: 'text-success' },
  danger:   { borda: 'border-l-destructive', valor: 'text-destructive' },
}

export function KpiCard({ titulo, valor, variante = 'padrao' }: KpiCardProps) {
  const classes = varianteClasses[variante]
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 shadow-sm min-w-[160px] border-l-4',
        classes.borda,
      )}
    >
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
        {titulo}
      </div>
      <div className={cn('text-2xl font-bold', classes.valor)}>
        {valor}
      </div>
    </div>
  )
}
