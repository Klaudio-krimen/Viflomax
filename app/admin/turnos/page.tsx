import React from 'react'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/Badge'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Turnos — Viflomax Admin' }

function formatCLP(n: number | null): string {
  if (n === null) return '—'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
}

function formatDateTime(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default async function TurnosPage() {
  const turnos = await db.turno.findMany({
    orderBy: { fecha_inicio: 'desc' },
    take: 100,
    include: {
      chofer: { select: { nombre: true } },
      bodega: { select: { nombre: true } },
      pedidos: { select: { monto_total: true, origen: true } },
    },
  })

  const turnosList = turnos.map((t) => {
    const ventas = t.pedidos.length
    const totalVendido = t.pedidos.reduce((acc, p) => acc + (p.monto_total ? Number(p.monto_total) : 0), 0)
    return {
      id: t.id,
      chofer: t.chofer?.nombre ?? '—',
      camioneta: t.bodega?.nombre ?? '—',
      estado: t.estado as 'activo' | 'cerrado',
      inicio: t.fecha_inicio,
      fin: t.fecha_fin,
      efectivo: t.efectivo_rendido != null ? Number(t.efectivo_rendido) : null,
      notas: t.notas_cierre,
      ventas,
      totalVendido,
    }
  })

  const activos = turnosList.filter((t) => t.estado === 'activo')
  const cerrados = turnosList.filter((t) => t.estado === 'cerrado')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Turnos y Rendiciones</h2>
        <p className="text-sm font-outfit text-gray-500 mt-0.5">Camionetas en ruta y cierres de turno</p>
      </div>

      {/* Turnos activos */}
      <section className="space-y-3">
        <h3 className="font-nunito font-semibold text-gray-700 text-sm uppercase tracking-wider">
          Activos ({activos.length})
        </h3>
        {activos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-6 text-center text-gray-500 font-outfit text-sm">
            No hay turnos activos en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activos.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-viflomax-verde/40 shadow-sm p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-nunito font-semibold text-gray-900">{t.chofer}</p>
                  <Badge variant="success" size="sm">En ruta</Badge>
                </div>
                <p className="text-sm font-outfit text-gray-500">{t.camioneta}</p>
                <div className="flex items-center justify-between text-sm font-outfit pt-1 border-t border-gray-100">
                  <span className="text-gray-500">Desde {formatDateTime(t.inicio)}</span>
                  <span className="text-gray-900 font-semibold">{t.ventas} ventas · {formatCLP(t.totalVendido)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Turnos cerrados */}
      <section className="space-y-3">
        <h3 className="font-nunito font-semibold text-gray-700 text-sm uppercase tracking-wider">
          Cerrados ({cerrados.length})
        </h3>
        {cerrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-6 text-center text-gray-500 font-outfit text-sm">
            Aún no hay turnos cerrados.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-outfit">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Chofer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Camioneta</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cierre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ventas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Vendido</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Efectivo rendido</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cerrados.map((t) => {
                    const descuadre = t.efectivo != null ? t.efectivo - t.totalVendido : null
                    return (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{t.chofer}</td>
                        <td className="px-4 py-3 text-gray-500">{t.camioneta}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDateTime(t.fin)}</td>
                        <td className="px-4 py-3 text-gray-700">{t.ventas}</td>
                        <td className="px-4 py-3 text-gray-700">{formatCLP(t.totalVendido)}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">{formatCLP(t.efectivo)}</span>
                          {descuadre != null && descuadre !== 0 && (
                            <span className={`ml-2 text-xs ${descuadre < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              ({descuadre > 0 ? '+' : ''}{formatCLP(descuadre)})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{t.notas ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
