/**
 * Datos de contacto de Agua Viflomax — fuente única de verdad.
 *
 * El número se toma de NEXT_PUBLIC_WHATSAPP_NUMBER. Si no está seteada,
 * cae al valor de FALLBACK (editable acá abajo) para que el sitio nunca
 * quede con links rotos por una env var faltante en el deploy.
 *
 * Formato: 56XXXXXXXXX (sin +, sin espacios).
 */

// ⚠️ EDITAR: número real de WhatsApp de Viflomax
const FALLBACK_WHATSAPP = '56990994633'

const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || FALLBACK_WHATSAPP

/** Número normalizado (solo dígitos). Vacío si no está configurado. */
export const WHATSAPP_NUMERO = raw.replace(/\D/g, '')

/** true si hay un número usable configurado. */
export const TIENE_WHATSAPP = WHATSAPP_NUMERO.length >= 11

/** Formato legible chileno: +56 9 2012 0902 */
export const TELEFONO_LEGIBLE = TIENE_WHATSAPP
  ? `+${WHATSAPP_NUMERO.slice(0, 2)} ${WHATSAPP_NUMERO.slice(2, 3)} ${WHATSAPP_NUMERO.slice(3, 7)} ${WHATSAPP_NUMERO.slice(7)}`
  : ''

/** Link tel: para click-to-call en móvil. */
export const TELEFONO_HREF = TIENE_WHATSAPP ? `tel:+${WHATSAPP_NUMERO}` : ''

/** Construye un link de WhatsApp con mensaje prellenado. */
export function linkWhatsApp(mensaje = 'Hola, quiero hacer un pedido'): string {
  if (!TIENE_WHATSAPP) return ''
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`
}

export const HORARIO = 'Lun a Sáb · 9:00 – 19:00 hrs'
export const ZONA = 'Maipú y Padre Hurtado'
