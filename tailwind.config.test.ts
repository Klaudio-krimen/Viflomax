import config from './tailwind.config'

describe('tailwind.config viflomax colors', () => {
  const colors = config.theme?.extend?.colors as any

  it('define las 9 claves de la escala azul con los valores exactos', () => {
    const azul = colors.viflomax.azul
    expect(Object.keys(azul).sort()).toEqual(
      ['100', '200', '300', '400', '600', '700', '800', '900', 'DEFAULT'].sort()
    )
    expect(azul.DEFAULT).toBe('#2f9fd6')
    expect(azul['800']).toBe('#164a63')
  })

  it('define las 9 claves de la escala verde con los valores exactos', () => {
    const verde = colors.viflomax.verde
    expect(Object.keys(verde).sort()).toEqual(
      ['100', '200', '300', '400', '600', '700', '800', '900', 'DEFAULT'].sort()
    )
    expect(verde.DEFAULT).toBe('#6ab04c')
    expect(verde['400']).toBe('#97cf6c')
    expect(verde['700']).toBe('#3f6f31')
  })

  it('conserva los alias legacy como claves hermanas', () => {
    expect(colors.viflomax['azul-oscuro']).toBe('#164a63')
    expect(colors.viflomax['verde-claro']).toBe('#97cf6c')
  })
})
