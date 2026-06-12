import React from 'react'
import { db } from '@/lib/db'
import type { Inventario, Producto } from '@/lib/types'
import { getBodegaCentralId } from '@/lib/bodegas'
import { InventarioTable } from './InventarioTable'
import { CargarStockButton } from './CargarStockButton'
import { StockCamionetas } from './StockCamionetas'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Inventario — Viflomax Admin' }

export type InventarioConProducto = Inventario & {
  producto: Pick<Producto, 'id' | 'nombre' | 'categoria' | 'precio_base'> | null
}

export type CamionetaStock = {
  id: string
  nombre: string
  patente: string | null
  items: {
    producto_id: string
    nombre: string
    stock_bodega: number
    stock_vacios_bodega: number
  }[]
}

export type ProductoOpcion = { id: string; nombre: string }

export default async function InventarioPage() {
  const bodegaCentralId = await getBodegaCentralId()

  const [invCentral, camionetas, productos] = await Promise.all([
    db.inventario.findMany({
      where: { bodega_id: bodegaCentralId },
      orderBy: { updated_at: 'desc' },
      include: { producto: { select: { id: true, nombre: true, categoria: true, precio_base: true } } },
    }),
    db.bodega.findMany({
      where: { tipo: 'movil', activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        inventario: {
          include: { producto: { select: { id: true, nombre: true } } },
          orderBy: { updated_at: 'desc' },
        },
      },
    }),
    db.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    }),
  ])

  const inventarioList = invCentral.map((i) => ({
    ...i,
    updated_at: i.updated_at.toISOString(),
  })) as unknown as InventarioConProducto[]

  const camionetasStock: CamionetaStock[] = camionetas.map((b) => ({
    id: b.id,
    nombre: b.nombre,
    patente: b.patente,
    items: b.inventario.map((i) => ({
      producto_id: i.producto_id,
      nombre: i.producto?.nombre ?? '—',
      stock_bodega: i.stock_bodega,
      stock_vacios_bodega: i.stock_vacios_bodega,
    })),
  }))

  const camionetasOpciones = camionetas.map((b) => ({ id: b.id, nombre: b.nombre }))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Inventario</h2>
          <p className="text-sm font-outfit text-gray-500 mt-0.5">Bodega Central y carga de camionetas</p>
        </div>
        <CargarStockButton camionetas={camionetasOpciones} productos={productos as ProductoOpcion[]} />
      </div>

      <InventarioTable inventario={inventarioList} />

      <StockCamionetas camionetas={camionetasStock} />
    </div>
  )
}
