import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import type { ApiListResponse } from '@/lib/types'

export type PuntoTrayecto = {
  latitud: number
  longitud: number
  registrado_en: string
}

/**
 * GET /api/ubicaciones/turno/[id]
 * Trayecto completo de un turno, ordenado ascendente (para alimentar una Polyline).
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.json(
      { data: null, total: 0, error: 'No autenticado' } as ApiListResponse<PuntoTrayecto>,
      { status: 401 }
    )
  }

  if (token.role !== 'admin') {
    return NextResponse.json(
      { data: null, total: 0, error: 'Sin permisos' } as ApiListResponse<PuntoTrayecto>,
      { status: 403 }
    )
  }

  const turno = await db.turno.findUnique({ where: { id: params.id }, select: { id: true } })
  if (!turno) {
    return NextResponse.json(
      { data: null, total: 0, error: 'Turno no encontrado' } as ApiListResponse<PuntoTrayecto>,
      { status: 404 }
    )
  }

  const ubicaciones = await db.ubicacion.findMany({
    where: { turno_id: turno.id },
    orderBy: { registrado_en: 'asc' },
    select: { latitud: true, longitud: true, registrado_en: true },
  })

  const data: PuntoTrayecto[] = ubicaciones.map((u) => ({
    latitud: Number(u.latitud),
    longitud: Number(u.longitud),
    registrado_en: u.registrado_en.toISOString(),
  }))

  return NextResponse.json({ data, total: data.length, error: null } as ApiListResponse<PuntoTrayecto>)
}
