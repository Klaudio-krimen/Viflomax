import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Inventario, Producto } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Mi Stock — Viflomax Chofer' }

type InventarioConProducto = Inventario & {
  producto: Pick<Producto, 'id' | 'nombre' | 'categoria'> | null
}

function AlertaStock({ stock, minimo }: { stock: number; minimo: number }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-outfit font-semibold text-rose-700 bg-rose-50 rounded-full px-2 py-0.5">
        <span aria-hidden="true">&#9888;</span> Sin stock
      </span>
    )
  }
  if (stock <= minimo) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-outfit font-semibold text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
        <span aria-hidden="true">&#9888;</span> Stock bajo
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-outfit font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
      <span aria-hidden="true">&#10003;</span> OK
    </span>
  )
}

export default async function InventarioChoferPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const chofer = await db.chofer.findUnique({
    where: { user_id: session.user.id },
    select: { id: true },
  })

  // Turno activo → stock de su camioneta
  const turnoActivo = chofer
    ? await db.turno.findFirst({
        where: { chofer_id: chofer.id, estado: 'activo' },
        orderBy: { fecha_inicio: 'desc' },
        include: { bodega: true },
      })
    : null

  const inventario = turnoActivo
    ? await db.inventario.findMany({
        where: { bodega_id: turnoActivo.bodega_id },
        orderBy: { updated_at: 'desc' },
        include: { producto: { select: { id: true, nombre: true, categoria: true } } },
      })
    : []

  const inventarioList = inventario.map((i) => ({
    ...i,
    updated_at: i.updated_at.toISOString(),
  })) as unknown as InventarioConProducto[]

  const nombreCamioneta = turnoActivo?.bodega.nombre ?? null

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Link
          href="/chofer"
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
          aria-label="Volver a mis entregas"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-nunito font-extrabold text-xl text-gray-900">Mi Stock</h1>
          <p className="font-outfit text-sm text-gray-500">
            {nombreCamioneta ? nombreCamioneta : 'Stock de tu camioneta'}
          </p>
        </div>
      </div>

      {!turnoActivo ? (
        <div className="py-12 text-center space-y-2">
          <p className="font-outfit text-gray-600 font-medium">No tienes un turno activo</p>
          <p className="font-outfit text-gray-400 text-sm">Inicia tu turno desde la pantalla principal para ver el stock de tu camioneta.</p>
          <Link href="/chofer" className="inline-block mt-2 text-sm font-outfit font-semibold text-viflomax-azul-oscuro">← Volver</Link>
        </div>
      ) : inventarioList.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-outfit text-gray-500">Tu camioneta no tiene stock cargado.</p>
          <p className="font-outfit text-gray-400 text-sm mt-1">Pide al administrador que cargue productos a tu camioneta.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inventarioList.map((inv) => (
            <div
              key={inv.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-outfit font-semibold text-base text-gray-900 leading-snug">
                    {inv.producto?.nombre ?? 'Producto desconocido'}
                  </p>
                  {inv.producto?.categoria && (
                    <p className="font-outfit text-xs text-gray-400 capitalize mt-0.5">
                      {inv.producto.categoria}
                    </p>
                  )}
                </div>
                <AlertaStock stock={inv.stock_bodega} minimo={inv.stock_minimo_alerta} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="font-nunito font-extrabold text-2xl text-gray-900">
                    {inv.stock_bodega}
                  </p>
                  <p className="font-outfit text-xs text-gray-500 mt-0.5">Bodega</p>
                </div>
                <div className="text-center">
                  <p className="font-nunito font-extrabold text-2xl text-viflomax-azul-oscuro">
                    {inv.stock_en_ruta}
                  </p>
                  <p className="font-outfit text-xs text-gray-500 mt-0.5">En Ruta</p>
                </div>
                <div className="text-center">
                  <p className="font-nunito font-extrabold text-2xl text-gray-400">
                    {inv.stock_vacios_bodega}
                  </p>
                  <p className="font-outfit text-xs text-gray-500 mt-0.5">Vacíos</p>
                </div>
              </div>

              <p className="font-outfit text-xs text-gray-400">
                Alerta cuando stock bodega ≤ {inv.stock_minimo_alerta}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
