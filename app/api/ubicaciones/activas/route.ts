import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import type { ApiListResponse } from '@/lib/types'

export type UbicacionActiva = {
  turno_id: string
  latitud: number
  longitud: number
  precision_m: number | null
  registrado_en: string
  chofer_nombre: string
  bodega_patente: string | null
}

/**
 * GET /api/ubicaciones/activas
 * Última posición de cada turno activo (solo admin).
 */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.json(
      { data: null, total: 0, error: 'No autenticado' } as ApiListResponse<UbicacionActiva>,
      { status: 401 }
    )
  }

  if (token.role !== 'admin') {
    return NextResponse.json(
      { data: null, total: 0, error: 'Sin permisos' } as ApiListResponse<UbicacionActiva>,
      { status: 403 }
    )
  }

  const ubicaciones = await db.ubicacion.findMany({
    where: { turno: { estado: 'activo' } },
    distinct: ['turno_id'],
    orderBy: [{ turno_id: 'asc' }, { registrado_en: 'desc' }],
    include: {
      turno: {
        select: {
          chofer: { select: { nombre: true } },
          bodega: { select: { patente: true } },
        },
      },
    },
  })

  const data: UbicacionActiva[] = ubicaciones.map((u) => ({
    turno_id: u.turno_id,
    latitud: Number(u.latitud),
    longitud: Number(u.longitud),
    precision_m: u.precision_m ?? null,
    registrado_en: u.registrado_en.toISOString(),
    chofer_nombre: u.turno.chofer.nombre,
    bodega_patente: u.turno.bodega.patente,
  }))

  return NextResponse.json({ data, total: data.length, error: null } as ApiListResponse<UbicacionActiva>)
}
