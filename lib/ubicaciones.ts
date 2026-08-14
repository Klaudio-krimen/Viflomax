export function validarCoordenadas(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  if (lat < -90 || lat > 90) return false
  if (lng < -180 || lng > 180) return false
  return true
}

export function minutosDesde(fecha: Date | string, ahora: Date = new Date()): number {
  const fechaMs = typeof fecha === 'string' ? new Date(fecha).getTime() : fecha.getTime()
  return (ahora.getTime() - fechaMs) / 60000
}

export type Frescura = 'fresca' | 'vieja' | 'sin_senal'

export function frescuraSenal(fecha: Date | string, ahora: Date = new Date()): Frescura {
  const minutos = minutosDesde(fecha, ahora)
  if (minutos < 5) return 'fresca'
  if (minutos < 20) return 'vieja'
  return 'sin_senal'
}
