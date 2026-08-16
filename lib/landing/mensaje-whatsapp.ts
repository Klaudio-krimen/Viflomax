export interface DatosMensajeWhatsApp {
  producto: string
  cantidad: number
  nombre: string
  telefono: string
  direccion: string
  comuna: string
  notas?: string
}

/**
 * Arma el mensaje que se envía por WhatsApp al confirmar un pedido.
 * La línea de notas solo aparece si `notas` tiene contenido tras `trim()`.
 */
export function construirMensajeWhatsApp(datos: DatosMensajeWhatsApp): string {
  const lineas = [
    'Hola! Quiero hacer un pedido de Agua Viflomax:',
    `Producto: ${datos.producto} x${datos.cantidad}`,
    `Nombre: ${datos.nombre}`,
    `Teléfono: ${datos.telefono}`,
    `Dirección: ${datos.direccion}, ${datos.comuna}`,
  ]

  const notas = datos.notas?.trim()
  if (notas) {
    lineas.push(`Notas: ${notas}`)
  }

  return lineas.join('\n')
}
