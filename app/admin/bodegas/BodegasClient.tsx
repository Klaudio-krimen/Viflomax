'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EliminarButton } from '@/components/ui/EliminarButton'
import type { BodegaConResumen } from './page'

function BodegaModal({
  modo,
  bodega,
  onClose,
  onSaved,
}: {
  modo: 'crear' | 'editar'
  bodega?: BodegaConResumen
  onClose: () => void
  onSaved: () => void
}) {
  const [nombre, setNombre] = useState(bodega?.nombre ?? '')
  const [patente, setPatente] = useState(bodega?.patente ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    setLoading(true)
    setError(null)
    try {
      const url = modo === 'crear' ? '/api/bodegas' : `/api/bodegas/${bodega!.id}`
      const method = modo === 'crear' ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          patente: patente.trim() || null,
          ...(modo === 'crear' ? { tipo: 'movil' } : {}),
        }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Error al guardar')
      onSaved()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={modo === 'crear' ? 'Nueva Camioneta' : `Editar — ${bodega?.nombre}`} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2 text-sm font-outfit">
            {error}
          </div>
        )}
        <Input label="Nombre *" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="ej: Camioneta Juan" required />
        <Input label="Patente" value={patente} onChange={(e) => setPatente(e.target.value)} placeholder="ej: ABCD-12" />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            {modo === 'crear' ? 'Crear Camioneta' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function BodegasClient({ bodegas }: { bodegas: BodegaConResumen[] }) {
  const router = useRouter()
  const [crear, setCrear] = useState(false)
  const [editar, setEditar] = useState<BodegaConResumen | null>(null)

  const central = bodegas.filter((b) => b.tipo === 'central')
  const moviles = bodegas.filter((b) => b.tipo === 'movil')

  function refresh() {
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Bodegas</h2>
          <p className="text-sm font-outfit text-gray-500 mt-0.5">
            Bodega central + camionetas (bodegas móviles)
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setCrear(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Camioneta
        </Button>
      </div>

      {/* Bodega Central */}
      {central.map((b) => (
        <div key={b.id} className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-viflomax-azul/10 flex items-center justify-center text-viflomax-azul-oscuro">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5" /></svg>
            </div>
            <div>
              <p className="font-nunito font-semibold text-gray-900">{b.nombre}</p>
              <p className="text-xs font-outfit text-gray-500">
                {b.productos_con_stock} productos · {b.unidades_totales} unidades
              </p>
            </div>
          </div>
          <Badge variant="info" size="sm">Central</Badge>
        </div>
      ))}

      {/* Camionetas */}
      <div>
        <h3 className="font-nunito font-semibold text-gray-700 text-sm uppercase tracking-wider mb-2">Camionetas</h3>
        {moviles.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-8 text-center text-gray-500 font-outfit text-sm">
            No hay camionetas. Crea la primera con el botón de arriba.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {moviles.map((b) => (
              <div key={b.id} className={`bg-white rounded-xl border shadow-sm px-5 py-4 ${b.activo ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-nunito font-semibold text-gray-900">{b.nombre}</p>
                    {b.patente && <p className="text-xs font-outfit text-gray-500 mt-0.5">Patente: {b.patente}</p>}
                    <p className="text-xs font-outfit text-gray-500 mt-1">
                      {b.productos_con_stock} productos · {b.unidades_totales} unidades
                    </p>
                  </div>
                  {b.activo ? <Badge variant="success" size="sm">Activa</Badge> : <Badge variant="default" size="sm">Inactiva</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setEditar(b)}
                    className="px-2.5 py-1 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium font-outfit border border-gray-200"
                  >
                    Editar
                  </button>
                  <EliminarButton
                    url={`/api/bodegas/${b.id}`}
                    confirmar={`¿Eliminar "${b.nombre}"? Si tiene historial de turnos se desactivará en lugar de borrarse.`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {crear && <BodegaModal modo="crear" onClose={() => setCrear(false)} onSaved={refresh} />}
      {editar && <BodegaModal modo="editar" bodega={editar} onClose={() => setEditar(null)} onSaved={refresh} />}
    </>
  )
}
