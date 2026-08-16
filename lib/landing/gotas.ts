export interface GotaEstilo {
  left: number
  duracion: number
  retraso: number
  opacidad: number
  color: string
}

/**
 * Generador determinista de gotas para la lluvia decorativa de la landing.
 *
 * La home es estática y se hidrata: usar `Math.random()` produciría un valor
 * distinto en servidor y cliente y React reportaría un hydration mismatch.
 * Por eso se usa un LCG clásico sembrado, siempre el mismo array para la
 * misma semilla.
 */
export function generarGotas(semilla: number, cantidad: number, colorVar: string): GotaEstilo[] {
  let s = semilla

  const next = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }

  const gotas: GotaEstilo[] = []

  for (let i = 0; i < cantidad; i++) {
    const left = Math.round(next() * 100 * 100) / 100
    const duracion = 4 + next() * (9 - 4)
    const retraso = -9 + next() * 9
    const opacidad = 0.15 + next() * (0.4 - 0.15)

    gotas.push({ left, duracion, retraso, opacidad, color: colorVar })
  }

  return gotas
}
