interface KpiCardProps {
  titulo: string;
  valor: string;
  destaque?: boolean;
}

export function KpiCard({ titulo, valor, destaque = false }: KpiCardProps) {
  return (
    <div
      className="card"
      style={{
        minWidth: 160,
        borderLeft: destaque ? '4px solid var(--color-primary)' : undefined,
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
          color: destaque ? 'var(--color-primary)' : 'var(--color-neutral-900)',
        }}
      >
        {valor}
      </div>
    </div>
  );
}
