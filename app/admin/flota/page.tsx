import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { frescuraSenal } from '@/lib/ubicaciones'
import FlotaClient from '@/components/admin/FlotaClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Flota — Viflomax Admin' }

const ETIQUETA_FRESCURA: Record<'fresca' | 'vieja' | 'sin_senal', string> = {
  fresca: 'Fresca',
  vieja: 'Vieja',
  sin_senal: 'Sin señal',
}

export default async function FlotaPage() {
  const session = await auth()
  const token = session?.user
  if (!token || token.role !== 'admin') {
    redirect('/login')
  }

  const turnosActivos = await db.turno.findMany({
    where: { estado: 'activo' },
    select: {
      id: true,
      chofer: { select: { nombre: true } },
      bodega: { select: { patente: true } },
      ubicaciones: {
        orderBy: { registrado_en: 'desc' },
        take: 1,
        select: { registrado_en: true },
      },
    },
  })

  const filas = turnosActivos.map((t) => {
    const ultima = t.ubicaciones[0]?.registrado_en ?? null
    return {
      turno_id: t.id,
      chofer_nombre: t.chofer.nombre,
      bodega_patente: t.bodega.patente,
      frescura: ultima ? frescuraSenal(ultima) : ('sin_senal' as const),
      ultima_posicion: ultima,
    }
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Flota en vivo</h2>
        <p className="text-sm font-outfit text-gray-500 mt-0.5">
          Última posición conocida de cada chofer en turno
        </p>
      </div>

      <FlotaClient />

      <section
        aria-label="Choferes en turno"
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-outfit">
            <caption className="sr-only">
              Choferes en turno con la frescura y hora de su última posición conocida
            </caption>
            <thead>
              <tr className="bg-gray-50">
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Chofer
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Patente
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Señal
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Última posición
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    Ningún chofer en turno en este momento.
                  </td>
                </tr>
              ) : (
                filas.map((f) => (
                  <tr key={f.turno_id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{f.chofer_nombre}</td>
                    <td className="px-4 py-3 text-gray-500">{f.bodega_patente ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{ETIQUETA_FRESCURA[f.frescura]}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {f.ultima_posicion
                        ? new Date(f.ultima_posicion).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
