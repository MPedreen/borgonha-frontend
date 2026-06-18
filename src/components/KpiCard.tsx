interface KpiCardProps {
  titulo: string;
  valor: string;
  variante?: 'padrao' | 'destaque' | 'success' | 'danger';
}

const CORES: Record<NonNullable<KpiCardProps['variante']>, { borda: string; valor: string }> = {
  padrao:   { borda: 'transparent',              valor: 'var(--color-neutral-900)' },
  destaque: { borda: 'var(--color-primary)',      valor: 'var(--color-primary)'     },
  success:  { borda: 'var(--color-success)',      valor: 'var(--color-success)'     },
  danger:   { borda: 'var(--color-danger)',       valor: 'var(--color-danger)'      },
};

export function KpiCard({ titulo, valor, variante = 'padrao' }: KpiCardProps) {
  const cores = CORES[variante];
  return (
    <div
      className="card"
      style={{
        minWidth: 160,
        borderLeft: `4px solid ${cores.borda}`,
      }}
    >
      <div
        style={{
          fontSize: '0.8rem',
          color: 'var(--color-neutral-500)',
          marginBottom: 'var(--space-2)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {titulo}
      </div>
      <div
        style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: cores.valor,
        }}
      >
        {valor}
      </div>
    </div>
  );
}
