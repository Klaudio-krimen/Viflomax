export interface DatosPayloadPedido {
  producto: string
  cantidad: number
  nombre: string
  telefono: string
  direccion: string
  comuna: string
  notas?: string
  email?: string
}

export interface PayloadPedidoPublico {
  nombre: string
  telefono: string
  direccion: string
  comuna: string
  items: Array<{ productoId: string; cantidad: number }>
  email?: string
  notas?: string
}

/**
 * Arma el cuerpo exacto que acepta el endpoint congelado
 * `POST /api/pedidos/publico`. `email` y `notas` se omiten (no van como
 * string vacío) cuando vienen vacíos. `productoId` es el nombre del
 * producto tal como aparece en `PRODUCTOS`, sin slug ni encodeURIComponent.
 */
export function construirPayloadPedido(datos: DatosPayloadPedido): PayloadPedidoPublico {
  const payload: PayloadPedidoPublico = {
    nombre: datos.nombre.trim(),
    telefono: datos.telefono.trim(),
    direccion: datos.direccion.trim(),
    comuna: datos.comuna.trim(),
    items: [{ productoId: datos.producto.trim(), cantidad: datos.cantidad }],
  }

  const email = datos.email?.trim()
  if (email) {
    payload.email = email
  }

  const notas = datos.notas?.trim()
  if (notas) {
    payload.notas = notas
  }

  return payload
}
