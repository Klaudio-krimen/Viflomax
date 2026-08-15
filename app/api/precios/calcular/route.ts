import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { calcularPrecioItem } from '@/lib/precios/calcular'
import type { ApiResponse, ResultadoPrecio, InputCalculoPrecio } from '@/lib/types'

/**
 * POST /api/precios/calcular
 * Calcular el precio para un item dado el tipo de cliente y contexto.
 *
 * Body (InputCalculoPrecio):
 * {
 *   productoId: uuid,
 *   cantidad: number,
 *   clienteTipo?: 'mayorista' | 'detalle',  // se deduce si viene clienteId
 *   empresaId?: uuid,
 *   sector?: string,
 *   clienteId?: uuid
 * }
 */
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.json(
      { data: null, error: 'No autenticado' } as ApiResponse<never>,
      { status: 401 }
    )
  }

  let body: InputCalculoPrecio
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { data: null, error: 'Cuerpo de solicitud inválido' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  // Validar campos obligatorios
  if (!body.productoId) {
    return NextResponse.json(
      { data: null, error: 'El productoId es obligatorio' } as ApiResponse<ResultadoPrecio>,
      { status: 400 }
    )
  }

  if (!body.cantidad || body.cantidad <= 0) {
    return NextResponse.json(
      { data: null, error: 'La cantidad debe ser mayor a 0' } as ApiResponse<ResultadoPrecio>,
      { status: 400 }
    )
  }

  // Si viene un clienteId, el contexto (tipo, sector, empresa) se deduce del
  // cliente: quien llama no tiene por qué conocerlo. Solo se exige clienteTipo
  // explícito cuando no hay cliente del cual deducirlo.
  if (body.clienteId) {
    const cliente = await db.cliente.findUnique({
      where: { id: body.clienteId },
      select: { tipo_cliente: true, sector: true, empresa_id: true },
    })
    if (!cliente) {
      return NextResponse.json(
        { data: null, error: 'Cliente no encontrado' } as ApiResponse<ResultadoPrecio>,
        { status: 404 }
      )
    }
    body.clienteTipo = cliente.tipo_cliente === 'mayorista' ? 'mayorista' : 'detalle'
    body.sector = body.sector ?? cliente.sector ?? undefined
    body.empresaId = body.empresaId ?? cliente.empresa_id ?? undefined
  } else if (body.clienteTipo !== 'mayorista' && body.clienteTipo !== 'detalle') {
    return NextResponse.json(
      { data: null, error: 'El clienteTipo debe ser "mayorista" o "detalle"' } as ApiResponse<ResultadoPrecio>,
      { status: 400 }
    )
  }

  try {
    const resultado = await calcularPrecioItem(body)
    return NextResponse.json(
      { data: resultado, error: null } as ApiResponse<ResultadoPrecio>
    )
  } catch {
    return NextResponse.json(
      { data: null, error: 'Error al calcular el precio' } as ApiResponse<ResultadoPrecio>,
      { status: 500 }
    )
  }
}
