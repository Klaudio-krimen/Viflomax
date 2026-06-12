import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { getBodegaCentralId } from '@/lib/bodegas'

/**
 * POST /api/transferencias
 * Mueve stock entre bodegas. Solo admin (cargar a camioneta / devolver a central).
 *
 * Body: {
 *   bodega_origen_id?: string   (default: bodega central)
 *   bodega_destino_id: string
 *   tipo?: 'carga' | 'devolucion' | 'ajuste'
 *   turno_id?: string
 *   items: { producto_id: string; cantidad: number }[]
 * }
 *
 * Por cada item: descuenta del origen, suma al destino (upsert), registra TransferenciaStock.
 */
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  let body: {
    bodega_origen_id?: string
    bodega_destino_id?: string
    tipo?: 'carga' | 'devolucion' | 'ajuste'
    turno_id?: string
    items?: { producto_id: string; cantidad: number }[]
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const items = (body.items ?? []).filter((i) => i.producto_id && i.cantidad > 0)
  if (!body.bodega_destino_id) {
    return NextResponse.json({ error: 'Falta la bodega de destino' }, { status: 400 })
  }
  if (items.length === 0) {
    return NextResponse.json({ error: 'Debe transferir al menos un producto con cantidad' }, { status: 400 })
  }

  const bodegaCentralId = await getBodegaCentralId()
  const origenId = body.bodega_origen_id ?? bodegaCentralId
  const destinoId = body.bodega_destino_id
  const tipo = body.tipo ?? 'carga'

  if (origenId === destinoId) {
    return NextResponse.json({ error: 'Origen y destino no pueden ser la misma bodega' }, { status: 400 })
  }

  try {
    await db.$transaction(async (tx) => {
      for (const item of items) {
        // Descontar del origen (no permitir negativo)
        const invOrigen = await tx.inventario.findUnique({
          where: { producto_id_bodega_id: { producto_id: item.producto_id, bodega_id: origenId } },
          select: { id: true, stock_bodega: true },
        })
        const disponible = invOrigen?.stock_bodega ?? 0
        const aMover = Math.min(item.cantidad, disponible)
        if (invOrigen) {
          await tx.inventario.update({
            where: { id: invOrigen.id },
            data: { stock_bodega: disponible - aMover },
          })
        }

        // Sumar al destino (upsert: crea la fila si la camioneta no tenía ese producto)
        await tx.inventario.upsert({
          where: { producto_id_bodega_id: { producto_id: item.producto_id, bodega_id: destinoId } },
          update: { stock_bodega: { increment: aMover } },
          create: {
            producto_id: item.producto_id,
            bodega_id: destinoId,
            stock_bodega: aMover,
            stock_vacios_bodega: 0,
            stock_en_ruta: 0,
            stock_minimo_alerta: 0,
          },
        })

        // Registrar la transferencia
        await tx.transferenciaStock.create({
          data: {
            bodega_origen_id: origenId,
            bodega_destino_id: destinoId,
            producto_id: item.producto_id,
            cantidad: aMover,
            tipo,
            turno_id: body.turno_id ?? null,
          },
        })
      }
    })

    return NextResponse.json({ data: null, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al transferir stock' }, { status: 500 })
  }
}
