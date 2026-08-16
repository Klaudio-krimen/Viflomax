import { generarGotas } from './gotas'

describe('generarGotas', () => {
  it('es determinista: la misma semilla produce el mismo array', () => {
    const a = generarGotas(7, 16, 'x')
    const b = generarGotas(7, 16, 'x')
    expect(a).toEqual(b)
  })

  it('devuelve exactamente `cantidad` items con `left` entre 0 y 100', () => {
    const gotas = generarGotas(7, 16, 'x')
    expect(gotas).toHaveLength(16)
    for (const gota of gotas) {
      expect(gota.left).toBeGreaterThanOrEqual(0)
      expect(gota.left).toBeLessThanOrEqual(100)
    }
  })

  it('mantiene duracion, retraso y opacidad dentro de sus rangos', () => {
    const gotas = generarGotas(7, 16, 'x')
    for (const gota of gotas) {
      expect(gota.duracion).toBeGreaterThanOrEqual(4)
      expect(gota.duracion).toBeLessThanOrEqual(9)
      expect(gota.retraso).toBeGreaterThanOrEqual(-9)
      expect(gota.retraso).toBeLessThanOrEqual(0)
      expect(gota.opacidad).toBeGreaterThanOrEqual(0.15)
      expect(gota.opacidad).toBeLessThanOrEqual(0.4)
    }
  })

  it('produce el valor ancla 49.04 para left[0] con semilla 7', () => {
    const gotas = generarGotas(7, 16, 'x')
    expect(gotas[0].left).toBeCloseTo(49.04, 2)
  })

  it('respeta la semilla: semillas distintas producen arrays distintos', () => {
    const a = generarGotas(7, 16, 'x')
    const b = generarGotas(11, 16, 'x')
    expect(a).not.toEqual(b)
  })
})
