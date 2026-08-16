export type ResultadoPedido =
  | { ok: true; numeroPedido: string }
  | { ok: false; mensaje: string }

interface CuerpoRespuestaPedido {
  data: { pedido_id: string; numero_pedido: string } | null
  error: string | null
}

const MENSAJE_ERROR_GENERICO = 'Error al enviar el pedido. Intenta nuevamente.'

/**
 * El endpoint congelado responde 201 con { data, error: null } en éxito, y
 * cualquier otro status con { data: null, error: string }. Solo 201 es
 * éxito: esta función es la única fuente de esa regla.
 */
export function interpretarRespuestaPedido(
  status: number,
  cuerpo: CuerpoRespuestaPedido
): ResultadoPedido {
  if (status === 201 && cuerpo.data) {
    return { ok: true, numeroPedido: cuerpo.data.numero_pedido }
  }

  const mensaje = cuerpo.error?.trim() || MENSAJE_ERROR_GENERICO
  return { ok: false, mensaje }
}
