'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export type CamionetaOpcion = { id: string; nombre: string; patente: string | null }

export type StockItem = { producto_id: string; nombre: string; stock_bodega: number }

export type TurnoActivo = {
  id: string
  bodega_nombre: string
  fecha_inicio: string
} | null

export function TurnoBanner({
  turno,
  camionetas,
  stock,
}: {
  turno: TurnoActivo
  camionetas: CamionetaOpcion[]
  stock: StockItem[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Iniciar turno
  const [bodegaId, setBodegaId] = useState(camionetas[0]?.id ?? '')

  async function iniciar() {
    if (!bodegaId) { setError('Selecciona una camioneta'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodega_id: bodegaId }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Error al iniciar turno')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  // Cerrar turno
  const [cierreOpen, setCierreOpen] = useState(false)
  const [efectivo, setEfectivo] = useState('')
  const [notas, setNotas] = useState('')
  const [conteos, setConteos] = useState<Record<string, string>>({})

  function abrirCierre() {
    const init: Record<string, string> = {}
    for (const s of stock) init[s.producto_id] = String(s.stock_bodega)
    setConteos(init)
    setEfectivo('')
    setNotas('')
    setError(null)
    setCierreOpen(true)
  }

  async function cerrar() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/turnos/${turno!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          efectivo_rendido: efectivo ? Number(efectivo) : null,
          notas_cierre: notas.trim() || null,
          conteos: stock.map((s) => ({ producto_id: s.producto_id, fisico: Number(conteos[s.producto_id] ?? 0) })),
        }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Error al cerrar turno')
      setCierreOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  // ── Sin turno: invitar a iniciar ──
  if (!turno) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          <p className="font-nunito font-bold text-gray-900">Sin turno activo</p>
        </div>
        <p className="font-outfit text-sm text-gray-500">
          Inicia tu turno eligiendo la camioneta con la que sales hoy. El stock se descontará de ella.
        </p>
        {error && <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2 text-sm font-outfit">{error}</div>}
        {camionetas.length === 0 ? (
          <p className="text-sm font-outfit text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            No hay camionetas disponibles. Pide al administrador que cree una.
          </p>
        ) : (
          <div className="flex gap-2">
            <select
              value={bodegaId}
              onChange={(e) => setBodegaId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-xl px-3 py-3 text-base font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
            >
              {camionetas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}{c.patente ? ` — ${c.patente}` : ''}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={iniciar}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-viflomax-verde text-white font-outfit font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '…' : 'Iniciar'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Con turno activo ──
  return (
    <div className="bg-white rounded-2xl border border-viflomax-verde/40 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-viflomax-verde animate-pulse" />
          <div>
            <p className="font-nunito font-bold text-gray-900 leading-tight">Turno activo</p>
            <p className="font-outfit text-sm text-gray-500">{turno.bodega_nombre}</p>
          </div>
        </div>
        <Link
          href="/chofer/inventario"
          className="text-sm font-outfit font-semibold text-viflomax-azul-oscuro bg-sky-50 hover:bg-sky-100 px-3 py-2 rounded-xl transition-colors"
        >
          Mi stock
        </Link>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2 text-sm font-outfit">{error}</div>}

      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/chofer/venta"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-viflomax-azul text-white font-outfit font-semibold hover:opacity-90 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Venta en terreno
        </Link>
        <button
          type="button"
          onClick={abrirCierre}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-700 font-outfit font-semibold hover:bg-gray-50 transition-colors"
        >
          Cerrar turno
        </button>
      </div>

      {/* Modal de cierre / rendición */}
      {cierreOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => !loading && setCierreOpen(false)}>
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-nunito font-extrabold text-lg text-gray-900">Cerrar turno — Rendición</h3>
            <p className="font-outfit text-sm text-gray-500">
              Confirma el conteo físico que queda en la camioneta. Vuelve a la bodega central.
            </p>

            {stock.length === 0 ? (
              <p className="text-sm font-outfit text-gray-400">No hay stock en la camioneta.</p>
            ) : (
              <div className="space-y-2">
                {stock.map((s) => (
                  <div key={s.producto_id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-outfit text-sm text-gray-800 truncate">{s.nombre}</p>
                      <p className="font-outfit text-xs text-gray-400">Sistema: {s.stock_bodega}</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={conteos[s.producto_id] ?? ''}
                      onChange={(e) => setConteos((prev) => ({ ...prev, [s.producto_id]: e.target.value }))}
                      className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-base font-outfit text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-medium text-sm text-gray-700 font-outfit">Efectivo a rendir (CLP)</label>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={efectivo}
                onChange={(e) => setEfectivo(e.target.value)}
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
                placeholder="Diferencias, observaciones…"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCierreOpen(false)}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-outfit font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={cerrar}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl bg-viflomax-verde text-white font-outfit font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Cerrando…' : 'Confirmar cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
