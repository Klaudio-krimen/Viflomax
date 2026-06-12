import React from 'react'
import { db } from '@/lib/db'
import type { Bodega } from '@/lib/types'
import { BodegasClient } from './BodegasClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Bodegas — Viflomax Admin' }

export type BodegaConResumen = Bodega & {
  productos_con_stock: number
  unidades_totales: number
}

export default async function BodegasPage() {
  const bodegas = await db.bodega.findMany({
    orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
    include: {
      inventario: { select: { stock_bodega: true } },
    },
  })

  const bodegasList: BodegaConResumen[] = bodegas.map((b) => ({
    id: b.id,
    nombre: b.nombre,
    tipo: b.tipo as 'central' | 'movil',
    patente: b.patente,
    activo: b.activo,
    created_at: b.created_at.toISOString(),
    productos_con_stock: b.inventario.filter((i) => i.stock_bodega > 0).length,
    unidades_totales: b.inventario.reduce((acc, i) => acc + i.stock_bodega, 0),
  }))

  return (
    <div className="p-6 space-y-5">
      <BodegasClient bodegas={bodegasList} />
    </div>
  )
}
