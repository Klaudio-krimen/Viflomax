import { PRODUCTOS, filtrarPorCategoria } from './productos'

describe('filtrarPorCategoria', () => {
  it("con 'todos' devuelve los 9 productos en su orden original", () => {
    const resultado = filtrarPorCategoria(PRODUCTOS, 'todos')
    expect(resultado).toHaveLength(9)
    expect(resultado).toEqual(PRODUCTOS)
  })

  it("con 'agua' devuelve exactamente 4 productos, todos de esa categoría", () => {
    const resultado = filtrarPorCategoria(PRODUCTOS, 'agua')
    expect(resultado).toHaveLength(4)
    expect(resultado.every((p) => p.categoria === 'agua')).toBe(true)
  })

  it("con 'dispensadores' devuelve 3 y con 'extras' devuelve 2", () => {
    expect(filtrarPorCategoria(PRODUCTOS, 'dispensadores')).toHaveLength(3)
    expect(filtrarPorCategoria(PRODUCTOS, 'extras')).toHaveLength(2)
  })

  it('devuelve un array nuevo y no muta PRODUCTOS', () => {
    const resultado = filtrarPorCategoria(PRODUCTOS, 'agua')
    expect(resultado).not.toBe(PRODUCTOS)
    expect(PRODUCTOS).toHaveLength(9)
  })
})
