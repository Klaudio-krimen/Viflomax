import { construirMensajeWhatsApp } from './mensaje-whatsapp'

const fixture = {
  producto: 'Recarga 20 Litros',
  cantidad: 2,
  nombre: 'Ana Pérez',
  telefono: '+56 9 1234 5678',
  direccion: 'Av. Ejemplo 123',
  comuna: 'Maipú',
}

describe('construirMensajeWhatsApp', () => {
  it('incluye la línea de notas cuando notas trae contenido', () => {
    const mensaje = construirMensajeWhatsApp({ ...fixture, notas: 'Dejar en conserjería' })

    expect(mensaje).toBe(
      [
        'Hola! Quiero hacer un pedido de Agua Viflomax:',
        'Producto: Recarga 20 Litros x2',
        'Nombre: Ana Pérez',
        'Teléfono: +56 9 1234 5678',
        'Dirección: Av. Ejemplo 123, Maipú',
        'Notas: Dejar en conserjería',
      ].join('\n')
    )
  })

  it('omite la línea de notas cuando notas está ausente o en blanco', () => {
    const sinNotas = construirMensajeWhatsApp(fixture)
    expect(sinNotas.split('\n')).toHaveLength(5)
    expect(sinNotas).not.toContain('Notas:')

    const notasEnBlanco = construirMensajeWhatsApp({ ...fixture, notas: '   ' })
    expect(notasEnBlanco.split('\n')).toHaveLength(5)
    expect(notasEnBlanco).not.toContain('Notas:')
  })
})
