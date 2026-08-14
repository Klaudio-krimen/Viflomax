import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { validarCoordenadas } from '@/lib/ubicaciones'
import type { ApiResponse } from '@/lib/types'

type PingInput = {
  latitud?: unknown
  longitud?: unknown
  precision_m?: unknown
}

/**
 * POST /api/ubicaciones
 * Registra uno o varios pings de ubicación del chofer en turno (o un admin
 * con turno activo). Body: un ping único o un array (vaciado de cola offline).
 */
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.json({ data: null, error: 'No autenticado' } as ApiResponse<never>, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Cuerpo de solicitud inválido' } as ApiResponse<never>, { status: 400 })
  }

  const pings: PingInput[] = Array.isArray(body) ? body : [body as PingInput]

  if (
    pings.length === 0 ||
    pings.some((p) => typeof p !== 'object' || p === null || !validarCoordenadas(p.latitud, p.longitud))
  ) {
    return NextResponse.json({ data: null, error: 'Coordenadas inválidas' } as ApiResponse<never>, { status: 400 })
  }

  // El rol esperado es 'chofer', pero un admin con turno activo también puede pingear.
  const chofer = await db.chofer.findUnique({
    where: { user_id: token.id as string },
    select: { id: true },
  })

  const turno = chofer
    ? await db.turno.findFirst({
        where: { chofer_id: chofer.id, estado: 'activo' },
        select: { id: true },
      })
    : null

  if (!turno) {
    return NextResponse.json({ success: false, error: 'Sin turno activo' }, { status: 409 })
  }

  try {
    const resultado = await db.ubicacion.createMany({
      data: pings.map((p) => ({
        turno_id: turno.id,
        latitud: Number(p.latitud),
        longitud: Number(p.longitud),
        precision_m: typeof p.precision_m === 'number' && Number.isFinite(p.precision_m) ? p.precision_m : null,
      })),
    })

    return NextResponse.json(
      { data: { count: resultado.count }, error: null } as ApiResponse<{ count: number }>,
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ data: null, error: 'Error al registrar ubicación' } as ApiResponse<never>, { status: 500 })
  }
}
