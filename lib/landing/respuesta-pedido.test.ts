import { interpretarRespuestaPedido } from './respuesta-pedido'

describe('interpretarRespuestaPedido', () => {
  it('con 201 y data devuelve ok true con numeroPedido', () => {
    const resultado = interpretarRespuestaPedido(201, {
      data: { pedido_id: 'p1', numero_pedido: 'VF-1001' },
      error: null,
    })

    expect(resultado).toEqual({ ok: true, numeroPedido: 'VF-1001' })
  })

  it('con 400 devuelve ok false con el mensaje exacto del error, sin abrir WhatsApp', () => {
    const resultado = interpretarRespuestaPedido(400, {
      data: null,
      error: 'Los campos nombre, teléfono, dirección y comuna son obligatorios',
    })

    expect(resultado).toEqual({
      ok: false,
      mensaje: 'Los campos nombre, teléfono, dirección y comuna son obligatorios',
    })
  })

  it('con 500 y error devuelve ok false con ese mensaje', () => {
    const resultado = interpretarRespuestaPedido(500, {
      data: null,
      error: 'Error al crear el pedido',
    })

    expect(resultado).toEqual({ ok: false, mensaje: 'Error al crear el pedido' })
  })

  it('con status no-201 y error nulo o vacío cae al mensaje genérico', () => {
    const conNull = interpretarRespuestaPedido(500, { data: null, error: null })
    expect(conNull.ok).toBe(false)
    expect((conNull as { ok: false; mensaje: string }).mensaje).toBeTruthy()

    const conVacio = interpretarRespuestaPedido(400, { data: null, error: '  ' })
    expect(conVacio.ok).toBe(false)
    expect((conVacio as { ok: false; mensaje: string }).mensaje).toBeTruthy()
  })
})
