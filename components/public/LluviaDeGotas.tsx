import type { GotaEstilo } from '@/lib/landing/gotas'

interface LluviaDeGotasProps {
  gotas: GotaEstilo[]
}

/**
 * Renderer puro: pinta el array de gotas ya calculado a nivel de módulo por
 * quien lo use. Sin estado, sin efectos, sin aleatoriedad en el render —
 * renderiza idéntico en el servidor y al hidratar.
 */
export function LluviaDeGotas({ gotas }: LluviaDeGotasProps) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {gotas.map((gota, i) => (
        <span
          key={i}
          className="water-drop"
          style={
            {
              left: `${gota.left}%`,
              animationDuration: `${gota.duracion}s`,
              animationDelay: `${gota.retraso}s`,
              background: gota.color,
              '--drop-op': gota.opacidad,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
