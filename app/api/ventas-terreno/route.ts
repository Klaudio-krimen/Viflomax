import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * POST /api/ventas-terreno
 * El chofer registra una venta hecha en terreno. Requiere turno activo.
 * Crea un Pedido (origen='terreno', estado='entregado'), su Entrega, y
 * descuenta el stock de la camioneta del turno.
 *
 * Body: {
 *   cliente_id?: string,            // cliente existente (opcional)
 *   cliente_nombre?: string,        // nombre libre si no está registrado
 *   metodo_pago?: 'efectivo' | 'transferencia' | 'pendiente',
 *   notas?: string,
 *   bidones_vacios_recibidos?: number,
 *   items: { producto_id: string; cantidad: number; precio_unitario: number }[]
 * }
 */
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const role = token.role as string
  if (role !== 'chofer' && role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  let body: {
    cliente_id?: string
    cliente_nombre?: string
    metodo_pago?: 'efectivo' | 'transferencia' | 'pendiente'
    notas?: string
    bidones_vacios_recibidos?: number
    items?: { producto_id: string; cantidad: number; precio_unitario: number }[]
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const items = (body.items ?? []).filter((i) => i.producto_id && i.cantidad > 0)
  if (items.length === 0) {
    return NextResponse.json({ error: 'Agrega al menos un producto con cantidad' }, { status: 400 })
  }

  // Resolver chofer
  const chofer = await db.chofer.findUnique({
    where: { user_id: token.id as string },
    select: { id: true },
  })
  if (!chofer) return NextResponse.json({ error: 'Chofer no configurado' }, { status: 403 })

  // Turno activo (de ahí sale la bodega para descontar)
  const turno = await db.turno.findFirst({
    where: { chofer_id: chofer.id, estado: 'activo' },
    orderBy: { fecha_inicio: 'desc' },
    select: { id: true, bodega_id: true },
  })
  if (!turno) {
    return NextResponse.json({ error: 'Debes tener un turno activo para vender en terreno' }, { status: 400 })
  }

  const montoTotal = items.reduce((sum, i) => sum + (Number(i.precio_unitario) || 0) * i.cantidad, 0)
  const nombreLibre = body.cliente_nombre?.trim() || null

  try {
    const pedido = await db.$transaction(async (tx) => {
      const año = new Date().getFullYear()
      const count = await tx.pedido.count()
      const numeroPedido = `PED-${año}-${String(count + 1).padStart(4, '0')}`

      const nuevo = await tx.pedido.create({
        data: {
          numero_pedido: numeroPedido,
          cliente_id: body.cliente_id ?? null,
          cliente_nombre: body.cliente_id ? null : nombreLibre,
          chofer_id: chofer.id,
          turno_id: turno.id,
          bodega_id: turno.bodega_id,
          estado: 'entregado',
          origen: 'terreno',
          monto_total: montoTotal,
          stock_descontado: true,
          notas: body.notas?.trim() || null,
          items: {
            create: items.map((i) => ({
              producto_id: i.producto_id,
              cantidad: i.cantidad,
              precio_unitario: Number(i.precio_unitario) || 0,
              precio_origen: 'manual',
              subtotal: (Number(i.precio_unitario) || 0) * i.cantidad,
            })),
          },
        },
      })

      // Registrar la entrega (para que el cobro aparezca en la rendición)
      await tx.entrega.create({
        data: {
          pedido_id: nuevo.id,
          chofer_id: chofer.id,
          bidones_vacios_recibidos: body.bidones_vacios_recibidos ?? 0,
          monto_cobrado: montoTotal,
          metodo_pago: body.metodo_pago ?? 'efectivo',
        },
      })

      // Descontar stock de la camioneta + sumar vacíos recibidos
      for (const i of items) {
        const inv = await tx.inventario.findUnique({
          where: { producto_id_bodega_id: { producto_id: i.producto_id, bodega_id: turno.bodega_id } },
          select: { id: true, stock_bodega: true },
        })
        if (inv) {
          await tx.inventario.update({
            where: { id: inv.id },
            data: { stock_bodega: Math.max(0, inv.stock_bodega - i.cantidad) },
          })
        }
      }

      if ((body.bidones_vacios_recibidos ?? 0) > 0) {
        const invAlguno = await tx.inventario.findFirst({
          where: { bodega_id: turno.bodega_id },
          select: { id: true, stock_vacios_bodega: true },
          orderBy: { updated_at: 'asc' },
        })
        if (invAlguno) {
          await tx.inventario.update({
            where: { id: invAlguno.id },
            data: { stock_vacios_bodega: invAlguno.stock_vacios_bodega + (body.bidones_vacios_recibidos ?? 0) },
          })
        }
      }

      return nuevo
    })

    return NextResponse.json({ data: pedido, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al registrar la venta' }, { status: 500 })
  }
}
