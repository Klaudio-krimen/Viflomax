import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * Helper: obtiene el chofer asociado al token (o null).
 */
async function getChoferDeToken(userId: string) {
  return db.chofer.findUnique({ where: { user_id: userId }, select: { id: true } })
}

/**
 * GET /api/turnos
 * - Chofer: su turno activo (o null)
 * - Admin: lista de turnos (más recientes primero)
 */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token) return NextResponse.json({ data: null, error: 'No autenticado' }, { status: 401 })

  const role = token.role as string

  if (role === 'chofer') {
    const chofer = await getChoferDeToken(token.id as string)
    if (!chofer) return NextResponse.json({ data: null, error: 'Chofer no configurado' }, { status: 403 })
    const turno = await db.turno.findFirst({
      where: { chofer_id: chofer.id, estado: 'activo' },
      orderBy: { fecha_inicio: 'desc' },
      include: { bodega: true },
    })
    return NextResponse.json({ data: turno, error: null })
  }

  if (role === 'admin') {
    const turnos = await db.turno.findMany({
      orderBy: { fecha_inicio: 'desc' },
      take: 100,
      include: { bodega: true, chofer: { select: { id: true, nombre: true } } },
    })
    return NextResponse.json({ data: turnos, total: turnos.length, error: null })
  }

  return NextResponse.json({ data: null, error: 'Sin permisos' }, { status: 403 })
}

/**
 * POST /api/turnos
 * Inicia un turno: el chofer sale con una camioneta (bodega móvil).
 * Body: { bodega_id }
 */
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const role = token.role as string
  if (role !== 'chofer' && role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  let body: { bodega_id?: string; chofer_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  if (!body.bodega_id) {
    return NextResponse.json({ error: 'Debes seleccionar una camioneta' }, { status: 400 })
  }

  // Resolver chofer
  let choferId: string
  if (role === 'chofer') {
    const chofer = await getChoferDeToken(token.id as string)
    if (!chofer) return NextResponse.json({ error: 'Chofer no configurado' }, { status: 403 })
    choferId = chofer.id
  } else {
    if (!body.chofer_id) return NextResponse.json({ error: 'Falta chofer_id' }, { status: 400 })
    choferId = body.chofer_id
  }

  // Validar bodega móvil activa
  const bodega = await db.bodega.findUnique({ where: { id: body.bodega_id }, select: { id: true, tipo: true, activo: true } })
  if (!bodega || bodega.tipo !== 'movil' || !bodega.activo) {
    return NextResponse.json({ error: 'Camioneta inválida' }, { status: 400 })
  }

  // No permitir dos turnos activos del mismo chofer
  const turnoChofer = await db.turno.findFirst({ where: { chofer_id: choferId, estado: 'activo' }, select: { id: true } })
  if (turnoChofer) {
    return NextResponse.json({ error: 'Ya tienes un turno activo. Ciérralo antes de iniciar otro.' }, { status: 400 })
  }

  // No permitir que dos choferes usen la misma camioneta a la vez
  const turnoBodega = await db.turno.findFirst({ where: { bodega_id: body.bodega_id, estado: 'activo' }, select: { id: true } })
  if (turnoBodega) {
    return NextResponse.json({ error: 'Esa camioneta ya está en uso por otro turno activo.' }, { status: 400 })
  }

  try {
    const turno = await db.turno.create({
      data: { chofer_id: choferId, bodega_id: body.bodega_id, estado: 'activo' },
    })
    return NextResponse.json({ data: turno, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al iniciar turno' }, { status: 500 })
  }
}
