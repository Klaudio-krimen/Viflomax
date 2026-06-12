import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { getBodegaCentralId } from '@/lib/bodegas'

/**
 * PATCH /api/turnos/[id]
 * Cierra un turno (rendición). Chofer dueño del turno o admin.
 *
 * Body: {
 *   efectivo_rendido?: number,
 *   notas_cierre?: string,
 *   conteos?: { producto_id: string; fisico: number }[]   // conteo físico al cierre
 * }
 *
 * Al cerrar: el stock físico de la camioneta vuelve a la Bodega Central (devolución),
 * la camioneta queda en 0, y las diferencias vs sistema se registran como 'ajuste'.
 * Los bidones vacíos acumulados también vuelven a la central.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req: request })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const role = token.role as string

  const turno = await db.turno.findUnique({
    where: { id: params.id },
    include: { chofer: { select: { id: true, user_id: true } } },
  })
  if (!turno) return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 })
  if (turno.estado === 'cerrado') {
    return NextResponse.json({ error: 'El turno ya está cerrado' }, { status: 400 })
  }

  // Autorización: admin o el propio chofer
  if (role === 'chofer' && turno.chofer.user_id !== token.id) {
    return NextResponse.json({ error: 'No puedes cerrar un turno que no es tuyo' }, { status: 403 })
  }
  if (role !== 'admin' && role !== 'chofer') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  let body: {
    efectivo_rendido?: number
    notas_cierre?: string
    conteos?: { producto_id: string; fisico: number }[]
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const conteosMap = new Map<string, number>()
  for (const c of body.conteos ?? []) {
    if (c.producto_id) conteosMap.set(c.producto_id, Math.max(0, Number(c.fisico) || 0))
  }

  const bodegaCentralId = await getBodegaCentralId()

  try {
    await db.$transaction(async (tx) => {
      // Stock actual en la camioneta
      const invCamioneta = await tx.inventario.findMany({
        where: { bodega_id: turno.bodega_id },
      })

      for (const inv of invCamioneta) {
        const sistema = inv.stock_bodega
        const fisico = conteosMap.has(inv.producto_id) ? conteosMap.get(inv.producto_id)! : sistema

        // Devolver físico a central
        if (fisico > 0) {
          await tx.inventario.upsert({
            where: { producto_id_bodega_id: { producto_id: inv.producto_id, bodega_id: bodegaCentralId } },
            update: { stock_bodega: { increment: fisico } },
            create: {
              producto_id: inv.producto_id,
              bodega_id: bodegaCentralId,
              stock_bodega: fisico,
              stock_vacios_bodega: 0,
              stock_en_ruta: 0,
              stock_minimo_alerta: 0,
            },
          })
          await tx.transferenciaStock.create({
            data: {
              bodega_origen_id: turno.bodega_id,
              bodega_destino_id: bodegaCentralId,
              producto_id: inv.producto_id,
              cantidad: fisico,
              tipo: 'devolucion',
              turno_id: turno.id,
            },
          })
        }

        // Registrar discrepancia (sistema vs físico) como ajuste, si la hay
        const diff = sistema - fisico
        if (diff !== 0) {
          await tx.transferenciaStock.create({
            data: {
              bodega_origen_id: turno.bodega_id,
              bodega_destino_id: null,
              producto_id: inv.producto_id,
              cantidad: diff, // positivo = faltante (merma), negativo = sobrante
              tipo: 'ajuste',
              turno_id: turno.id,
              notas: diff > 0 ? 'Faltante en conteo de cierre' : 'Sobrante en conteo de cierre',
            },
          })
        }

        // Devolver vacíos a central y dejar la camioneta en cero
        if (inv.stock_vacios_bodega > 0) {
          await tx.inventario.update({
            where: { producto_id_bodega_id: { producto_id: inv.producto_id, bodega_id: bodegaCentralId } },
            data: { stock_vacios_bodega: { increment: inv.stock_vacios_bodega } },
          })
        }
        await tx.inventario.update({
          where: { id: inv.id },
          data: { stock_bodega: 0, stock_vacios_bodega: 0 },
        })
      }

      // Cerrar el turno
      await tx.turno.update({
        where: { id: turno.id },
        data: {
          estado: 'cerrado',
          fecha_fin: new Date(),
          efectivo_rendido: body.efectivo_rendido != null ? body.efectivo_rendido : null,
          notas_cierre: body.notas_cierre?.trim() || null,
        },
      })
    })

    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al cerrar el turno' }, { status: 500 })
  }
}
