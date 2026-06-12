'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { ProductoOpcion } from './page'

type Linea = { producto_id: string; cantidad: string }

export function CargarStockButton({
  camionetas,
  productos,
}: {
  camionetas: ProductoOpcion[]
  productos: ProductoOpcion[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [camionetaId, setCamionetaId] = useState('')
  const [lineas, setLineas] = useState<Linea[]>([{ producto_id: '', cantidad: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function abrir() {
    setCamionetaId(camionetas[0]?.id ?? '')
    setLineas([{ producto_id: productos[0]?.id ?? '', cantidad: '' }])
    setError(null)
    setOpen(true)
  }

  function setLinea(i: number, patch: Partial<Linea>) {
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }
  function addLinea() {
    setLineas((prev) => [...prev, { producto_id: productos[0]?.id ?? '', cantidad: '' }])
  }
  function removeLinea(i: number) {
    setLineas((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function guardar() {
    if (!camionetaId) { setError('Selecciona una camioneta'); return }
    const items = lineas
      .filter((l) => l.producto_id && Number(l.cantidad) > 0)
      .map((l) => ({ producto_id: l.producto_id, cantidad: Number(l.cantidad) }))
    if (items.length === 0) { setError('Agrega al menos un producto con cantidad'); return }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/transferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodega_destino_id: camionetaId, tipo: 'carga', items }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Error al cargar stock')
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (camionetas.length === 0) {
    return (
      <p className="text-xs font-outfit text-gray-400">
        Crea una camioneta en <span className="font-medium">Bodegas</span> para poder cargar stock.
      </p>
    )
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={abrir}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
        </svg>
        Cargar a camioneta
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Cargar stock a camioneta" size="md">
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2 text-sm font-outfit">{error}</div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-sm text-gray-700 font-outfit">Camioneta destino</label>
            <select
              value={camionetaId}
              onChange={(e) => setCamionetaId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
            >
              {camionetas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-sm text-gray-700 font-outfit">Productos a cargar</label>
            {lineas.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={l.producto_id}
                  onChange={(e) => setLinea(i, { producto_id: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
                >
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={l.cantidad}
                  onChange={(e) => setLinea(i, { cantidad: e.target.value })}
                  placeholder="Cant."
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
                />
                {lineas.length > 1 && (
                  <button type="button" onClick={() => removeLinea(i)} className="text-gray-400 hover:text-red-500 px-1" aria-label="Quitar">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addLinea} className="text-sm font-outfit text-viflomax-azul-oscuro hover:underline">
              + Agregar producto
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
            <Button variant="primary" size="sm" loading={loading} onClick={guardar}>Cargar Stock</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
