import { validarCoordenadas, minutosDesde, frescuraSenal } from './ubicaciones'

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('validarCoordenadas', () => {
  it('1. coordenada válida de Maipú retorna true', () => {
    expect(validarCoordenadas(-33.5147, -70.7618)).toBe(true)
  })

  it('2. NaN retorna false', () => {
    expect(validarCoordenadas(NaN, -70.7618)).toBe(false)
    expect(validarCoordenadas(-33.5147, NaN)).toBe(false)
  })

  it('3. null retorna false', () => {
    expect(validarCoordenadas(null, -70.7618)).toBe(false)
    expect(validarCoordenadas(-33.5147, null)).toBe(false)
  })

  it('4. latitud 91 (fuera de rango) retorna false', () => {
    expect(validarCoordenadas(91, -70.7618)).toBe(false)
  })

  it('5. longitud -181 (fuera de rango) retorna false', () => {
    expect(validarCoordenadas(-33.5147, -181)).toBe(false)
  })

  it('6. valores no numéricos (string, undefined) retornan false', () => {
    expect(validarCoordenadas('-33.5', -70.7618)).toBe(false)
    expect(validarCoordenadas(-33.5147, undefined)).toBe(false)
  })

  it('7. Infinity no es finito y retorna false', () => {
    expect(validarCoordenadas(Infinity, -70.7618)).toBe(false)
  })
})

describe('minutosDesde', () => {
  it('calcula la diferencia en minutos contra un `ahora` explícito', () => {
    const ahora = new Date('2026-01-01T12:00:00Z')
    const fecha = new Date('2026-01-01T11:45:00Z')
    expect(minutosDesde(fecha, ahora)).toBe(15)
  })

  it('acepta la fecha como string ISO', () => {
    const ahora = new Date('2026-01-01T12:00:00Z')
    expect(minutosDesde('2026-01-01T11:50:00Z', ahora)).toBe(10)
  })
})

describe('frescuraSenal', () => {
  const ahora = new Date('2026-01-01T12:00:00Z')

  it('1. hace 4 minutos retorna "fresca" (borde bajo 5)', () => {
    const fecha = new Date('2026-01-01T11:56:00Z')
    expect(frescuraSenal(fecha, ahora)).toBe('fresca')
  })

  it('2. hace 19 minutos retorna "vieja" (borde bajo 20)', () => {
    const fecha = new Date('2026-01-01T11:41:00Z')
    expect(frescuraSenal(fecha, ahora)).toBe('vieja')
  })

  it('3. hace 21 minutos retorna "sin_senal" (borde sobre 20)', () => {
    const fecha = new Date('2026-01-01T11:39:00Z')
    expect(frescuraSenal(fecha, ahora)).toBe('sin_senal')
  })
})
