'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { PRODUCTOS, formatCLP } from '@/lib/productos'
import { TIENE_WHATSAPP, linkWhatsApp } from '@/lib/contacto'
import { construirPayloadPedido } from '@/lib/landing/payload-pedido'
import { construirMensajeWhatsApp } from '@/lib/landing/mensaje-whatsapp'
import { interpretarRespuestaPedido, type ResultadoPedido } from '@/lib/landing/respuesta-pedido'
import { usePedido } from './PedidoProvider'

const COMUNAS = ['Maipú', 'Padre Hurtado', 'Otra comuna'] as const

export function PedidoForm() {
  const { productoSeleccionado } = usePedido()

  const [producto, setProducto] = useState(productoSeleccionado ?? PRODUCTOS[0].nombre)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [comuna, setComuna] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [notas, setNotas] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoPedido | null>(null)

  // Re-sincroniza el producto seleccionado cuando cambia desde el catálogo.
  useEffect(() => {
    if (productoSeleccionado) {
      setProducto(productoSeleccionado)
    }
  }, [productoSeleccionado])

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setEnviando(true)
    setResultado(null)

    const datos = { producto, cantidad, nombre, telefono, direccion, comuna, notas, email }
    const payload = construirPayloadPedido(datos)

    try {
      const respuesta = await fetch('/api/pedidos/publico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const cuerpo = await respuesta.json()
      const interpretado = interpretarRespuestaPedido(respuesta.status, cuerpo)
      setResultado(interpretado)

      if (interpretado.ok && TIENE_WHATSAPP) {
        const mensaje = construirMensajeWhatsApp(datos)
        window.open(linkWhatsApp(mensaje), '_blank', 'noopener,noreferrer')
      }
    } catch {
      setResultado({ ok: false, mensaje: 'No pudimos conectar con el servidor. Intenta nuevamente.' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6">
      <div className="text-center mb-8">
        <h2 className="font-nunito text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Haz tu pedido
        </h2>
        <p className="text-gray-600 text-lg">Completa el formulario y te contactamos para confirmar.</p>
      </div>

      <form onSubmit={manejarEnvio} className="space-y-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div>
          <label htmlFor="pedido-nombre" className="block text-sm font-semibold text-gray-700 mb-1">
            Nombre
          </label>
          <input
            id="pedido-nombre"
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="pedido-telefono" className="block text-sm font-semibold text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            id="pedido-telefono"
            type="tel"
            required
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="pedido-email" className="block text-sm font-semibold text-gray-700 mb-1">
            Email <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            id="pedido-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="pedido-direccion" className="block text-sm font-semibold text-gray-700 mb-1">
            Dirección
          </label>
          <input
            id="pedido-direccion"
            type="text"
            required
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="pedido-comuna" className="block text-sm font-semibold text-gray-700 mb-1">
            Comuna
          </label>
          <select
            id="pedido-comuna"
            required
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 focus:outline-none"
          >
            <option value="" disabled>
              Selecciona tu comuna
            </option>
            {COMUNAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="pedido-producto" className="block text-sm font-semibold text-gray-700 mb-1">
            Producto
          </label>
          <select
            id="pedido-producto"
            required
            value={producto}
            onChange={(e) => setProducto(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 focus:outline-none"
          >
            {PRODUCTOS.map((p) => (
              <option key={p.nombre} value={p.nombre}>
                {p.nombre} — {formatCLP(p.precio)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="pedido-cantidad" className="block text-sm font-semibold text-gray-700 mb-1">
            Cantidad
          </label>
          <input
            id="pedido-cantidad"
            type="number"
            min={1}
            required
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="pedido-notas" className="block text-sm font-semibold text-gray-700 mb-1">
            Notas <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            id="pedido-notas"
            rows={3}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full inline-flex items-center justify-center bg-viflomax-verde-700 hover:bg-viflomax-verde-800 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700"
        >
          {enviando ? 'Enviando…' : 'Enviar pedido'}
        </button>

        {resultado && (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-lg p-4 text-sm font-medium ${
              resultado.ok
                ? 'bg-viflomax-verde-100 text-viflomax-verde-800 border border-viflomax-verde-300'
                : 'bg-red-50 text-red-800 border border-red-300'
            }`}
          >
            {resultado.ok
              ? `¡Pedido recibido! Tu número de pedido es ${resultado.numeroPedido}.`
              : resultado.mensaje}
          </div>
        )}
      </form>
    </div>
  )
}
