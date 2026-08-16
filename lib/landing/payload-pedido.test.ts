import { construirPayloadPedido } from './payload-pedido'

const fixture = {
  producto: 'Recarga 20 Litros',
  cantidad: 2,
  nombre: 'Ana Pérez',
  telefono: '+56 9 1234 5678',
  direccion: 'Av. Ejemplo 123',
  comuna: 'Maipú',
}

describe('construirPayloadPedido', () => {
  it('devuelve exactamente las claves del contrato para un formulario lleno sin email ni notas', () => {
    const payload = construirPayloadPedido(fixture)

    expect(Object.keys(payload).sort()).toEqual(
      ['nombre', 'telefono', 'direccion', 'comuna', 'items'].sort()
    )
    expect(payload.items[0].productoId).toBe('Recarga 20 Litros')
    expect(payload.items[0].cantidad).toBeGreaterThan(0)
  })

  it('omite email y notas cuando vienen vacíos, en vez de mandarlos como string vacío', () => {
    const payload = construirPayloadPedido({ ...fixture, email: '', notas: '   ' })

    expect(payload).not.toHaveProperty('email')
    expect(payload).not.toHaveProperty('notas')
  })

  it('incluye email y notas cuando traen contenido', () => {
    const payload = construirPayloadPedido({
      ...fixture,
      email: 'ana@example.com',
      notas: 'Dejar en conserjería',
    })

    expect(payload.email).toBe('ana@example.com')
    expect(payload.notas).toBe('Dejar en conserjería')
  })

  it('pasa comuna "Otra comuna" verbatim', () => {
    const payload = construirPayloadPedido({ ...fixture, comuna: 'Otra comuna' })
    expect(payload.comuna).toBe('Otra comuna')
  })
})
