import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { VentaTerrenoForm } from './VentaTerrenoForm'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Venta en terreno — Viflomax' }

export type ProductoVenta = {
  producto_id: string
  nombre: string
  stock: number
  precio_sugerido: number | null
}

export default async function VentaTerrenoPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const chofer = await db.chofer.findUnique({
    where: { user_id: session.user.id },
    select: { id: true },
  })
  if (!chofer) redirect('/chofer')

  const turno = await db.turno.findFirst({
    where: { chofer_id: chofer.id, estado: 'activo' },
    orderBy: { fecha_inicio: 'desc' },
    include: { bodega: true },
  })

  if (!turno) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="font-outfit text-gray-600 font-medium">No tienes un turno activo</p>
        <p className="font-outfit text-gray-400 text-sm">Inicia tu turno antes de registrar ventas en terreno.</p>
        <Link href="/chofer" className="inline-block text-sm font-outfit font-semibold text-viflomax-azul-oscuro">← Volver</Link>
      </div>
    )
  }

  const inventario = await db.inventario.findMany({
    where: { bodega_id: turno.bodega_id },
    include: { producto: { select: { id: true, nombre: true, precio_base: true } } },
    orderBy: { updated_at: 'desc' },
  })

  const productos: ProductoVenta[] = inventario
    .filter((i) => i.producto)
    .map((i) => ({
      producto_id: i.producto_id,
      nombre: i.producto!.nombre,
      stock: i.stock_bodega,
      precio_sugerido: i.producto!.precio_base != null ? Number(i.producto!.precio_base) : null,
    }))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/chofer"
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Volver"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="font-nunito font-extrabold text-xl text-gray-900">Venta en terreno</h1>
          <p className="font-outfit text-sm text-gray-500">{turno.bodega.nombre}</p>
        </div>
      </div>

      <VentaTerrenoForm productos={productos} />
    </div>
  )
}
