import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * PATCH /api/bodegas/[id]
 * Edita nombre/patente/activo de una bodega. Solo admin.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req: request })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  let body: { nombre?: string; patente?: string | null; activo?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  try {
    const bodega = await db.bodega.update({
      where: { id: params.id },
      data: {
        ...(body.nombre !== undefined && { nombre: body.nombre }),
        ...(body.patente !== undefined && { patente: body.patente || null }),
        ...(body.activo !== undefined && { activo: body.activo }),
      },
    })
    return NextResponse.json({ data: bodega, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar la bodega' }, { status: 500 })
  }
}

/**
 * DELETE /api/bodegas/[id]
 * Elimina una bodega móvil. No se puede eliminar la central ni una con turnos activos.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req: request })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const bodega = await db.bodega.findUnique({
    where: { id: params.id },
    select: { id: true, tipo: true },
  })
  if (!bodega) {
    return NextResponse.json({ error: 'Bodega no encontrada' }, { status: 404 })
  }
  if (bodega.tipo === 'central') {
    return NextResponse.json({ error: 'No se puede eliminar la Bodega Central' }, { status: 400 })
  }

  const turnoActivo = await db.turno.findFirst({
    where: { bodega_id: params.id, estado: 'activo' },
    select: { id: true },
  })
  if (turnoActivo) {
    return NextResponse.json(
      { error: 'No se puede eliminar: la camioneta tiene un turno activo. Ciérralo primero.' },
      { status: 400 }
    )
  }

  try {
    // Desactivar en vez de borrar si tiene historial de turnos (preserva trazabilidad)
    const tieneTurnos = await db.turno.count({ where: { bodega_id: params.id } })
    if (tieneTurnos > 0) {
      await db.bodega.update({ where: { id: params.id }, data: { activo: false } })
      return NextResponse.json({ data: null, error: null, desactivada: true })
    }
    // Sin historial: eliminar (el inventario asociado cae por cascade)
    await db.bodega.delete({ where: { id: params.id } })
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar la bodega' }, { status: 500 })
  }
}
