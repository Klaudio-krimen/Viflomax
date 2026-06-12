import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * DELETE /api/pedidos/[id]
 * Elimina un pedido y sus items. Solo admin.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req: request })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  try {
    await db.$transaction(async (tx) => {
      // Eliminar items primero (FK)
      await tx.pedidoItem.deleteMany({ where: { pedido_id: params.id } })
      // Eliminar entregas si existen
      await tx.entrega.deleteMany({ where: { pedido_id: params.id } })
      // Eliminar pedido
      await tx.pedido.delete({ where: { id: params.id } })
    })
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar pedido' }, { status: 500 })
  }
}

/**
 * PATCH /api/pedidos/[id]
 * Actualiza estado de un pedido. Solo admin.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req: request })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  let body: { estado?: string; chofer_id?: string | null; notas?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  try {
    // Estado actual del pedido (para decidir el descuento de stock al asignar chofer)
    const actual = await db.pedido.findUnique({
      where: { id: params.id },
      select: { stock_descontado: true },
    })
    if (!actual) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Si se asigna un chofer con turno activo y el stock aún no se descontó,
    // descontar de la bodega de ese turno (regla: descuento al asignar pedido).
    let turnoData: { turno_id: string; bodega_id: string } | null = null
    if (body.chofer_id && !actual.stock_descontado) {
      const turno = await db.turno.findFirst({
        where: { chofer_id: body.chofer_id, estado: 'activo' },
        orderBy: { fecha_inicio: 'desc' },
        select: { id: true, bodega_id: true },
      })
      if (turno) turnoData = { turno_id: turno.id, bodega_id: turno.bodega_id }
    }

    const pedido = await db.$transaction(async (tx) => {
      const actualizado = await tx.pedido.update({
        where: { id: params.id },
        data: {
          ...(body.estado !== undefined && { estado: body.estado }),
          ...(body.chofer_id !== undefined && { chofer_id: body.chofer_id }),
          ...(body.notas !== undefined && { notas: body.notas || null }),
          ...(turnoData && {
            turno_id: turnoData.turno_id,
            bodega_id: turnoData.bodega_id,
            stock_descontado: true,
          }),
        },
      })

      if (turnoData) {
        const items = await tx.pedidoItem.findMany({
          where: { pedido_id: params.id },
          select: { producto_id: true, cantidad: true },
        })
        for (const item of items) {
          const inv = await tx.inventario.findUnique({
            where: { producto_id_bodega_id: { producto_id: item.producto_id, bodega_id: turnoData.bodega_id } },
            select: { id: true, stock_bodega: true },
          })
          if (inv) {
            await tx.inventario.update({
              where: { id: inv.id },
              data: { stock_bodega: Math.max(0, inv.stock_bodega - item.cantidad) },
            })
          }
        }
      }

      return actualizado
    })

    return NextResponse.json({ data: pedido, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 })
  }
}
