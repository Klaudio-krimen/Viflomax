'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProductoVenta } from './page'

type Linea = { producto_id: string; cantidad: string; precio: string }

const METODOS: { value: 'efectivo' | 'transferencia' | 'pendiente'; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'pendiente', label: 'Pendiente' },
]

function formatCLP(n: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
}

export function VentaTerrenoForm({ productos }: { productos: ProductoVenta[] }) {
  const router = useRouter()
  const [clienteNombre, setClienteNombre] = useState('')
  const [metodo, setMetodo] = useState<'efectivo' | 'transferencia' | 'pendiente'>('efectivo')
  const [bidones, setBidones] = useState('')
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const primer = productos[0]
  const [lineas, setLineas] = useState<Linea[]>([
    { producto_id: primer?.producto_id ?? '', cantidad: '1', precio: primer?.precio_sugerido != null ? String(primer.precio_sugerido) : '' },
  ])

  function setLinea(i: number, patch: Partial<Linea>) {
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }
  function onProductoChange(i: number, producto_id: string) {
    const prod = productos.find((p) => p.producto_id === producto_id)
    setLinea(i, { producto_id, precio: prod?.precio_sugerido != null ? String(prod.precio_sugerido) : '' })
  }
  function addLinea() {
    const p = productos[0]
    setLineas((prev) => [...prev, { producto_id: p?.producto_id ?? '', cantidad: '1', precio: p?.precio_sugerido != null ? String(p.precio_sugerido) : '' }])
  }
  function removeLinea(i: number) {
    setLineas((prev) => prev.filter((_, idx) => idx !== i))
  }

  const total = lineas.reduce((sum, l) => sum + (Number(l.precio) || 0) * (Number(l.cantidad) || 0), 0)

  async function guardar() {
    const items = lineas
      .filter((l) => l.producto_id && Number(l.cantidad) > 0)
      .map((l) => ({ producto_id: l.producto_id, cantidad: Number(l.cantidad), precio_unitario: Number(l.precio) || 0 }))
    if (items.length === 0) { setError('Agrega al menos un producto'); return }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ventas-terreno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_nombre: clienteNombre.trim() || null,
          metodo_pago: metodo,
          bidones_vacios_recibidos: bidones ? Number(bidones) : 0,
          notas: notas.trim() || null,
          items,
        }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Error al registrar la venta')
      router.push('/chofer')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setLoading(false)
    }
  }

  if (productos.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-6 text-center">
        <p className="font-outfit text-amber-800 text-sm">Tu camioneta no tiene stock para vender.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-3 py-2 text-sm font-outfit">{error}</div>}

      {/* Cliente */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-1.5">
        <label className="font-medium text-sm text-gray-700 font-outfit">Cliente</label>
        <input
          value={clienteNombre}
          onChange={(e) => setClienteNombre(e.target.value)}
          placeholder="Nombre del cliente (opcional)"
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
        />
      </div>

      {/* Productos */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
        <label className="font-medium text-sm text-gray-700 font-outfit">Productos</label>
        {lineas.map((l, i) => {
          const prod = productos.find((p) => p.producto_id === l.producto_id)
          return (
            <div key={i} className="space-y-2 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <select
                  value={l.producto_id}
                  onChange={(e) => onProductoChange(i, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-base font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
                >
                  {productos.map((p) => (
                    <option key={p.producto_id} value={p.producto_id}>{p.nombre} (stock {p.stock})</option>
                  ))}
                </select>
                {lineas.length > 1 && (
                  <button type="button" onClick={() => removeLinea(i)} className="text-gray-400 hover:text-red-500 px-2 text-lg" aria-label="Quitar">✕</button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs font-outfit text-gray-400">Cantidad</label>
                  <input
                    type="number" min="1" inputMode="numeric"
                    value={l.cantidad}
                    onChange={(e) => setLinea(i, { cantidad: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-outfit text-gray-400">Precio unitario</label>
                  <input
                    type="number" min="0" inputMode="numeric"
                    value={l.precio}
                    onChange={(e) => setLinea(i, { precio: e.target.value })}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
                  />
                </div>
              </div>
              {prod && Number(l.cantidad) > prod.stock && (
                <p className="text-xs font-outfit text-amber-600">⚠ Vendes más de lo que hay en stock ({prod.stock}).</p>
              )}
            </div>
          )
        })}
        <button type="button" onClick={addLinea} className="text-sm font-outfit font-semibold text-viflomax-azul-oscuro">
          + Agregar producto
        </button>
      </div>

      {/* Pago */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
        <label className="font-medium text-sm text-gray-700 font-outfit">Método de pago</label>
        <div className="grid grid-cols-3 gap-2">
          {METODOS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMetodo(m.value)}
              className={`py-2.5 px-2 rounded-xl border text-sm font-outfit font-medium transition-colors ${
                metodo === m.value ? 'bg-viflomax-azul text-white border-viflomax-azul' : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="font-medium text-sm text-gray-700 font-outfit">Bidones vacíos recibidos</label>
          <input
            type="number" min="0" inputMode="numeric"
            value={bidones}
            onChange={(e) => setBidones(e.target.value)}
            placeholder="0"
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-medium text-sm text-gray-700 font-outfit">Notas (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
          />
        </div>
      </div>

      {/* Total + confirmar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-outfit text-gray-500">Total</span>
          <span className="font-nunito font-extrabold text-2xl text-gray-900">{formatCLP(total)}</span>
        </div>
        <button
          type="button"
          onClick={guardar}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-viflomax-verde text-white font-outfit font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Registrando…' : 'Registrar venta'}
        </button>
      </div>
    </div>
  )
}
