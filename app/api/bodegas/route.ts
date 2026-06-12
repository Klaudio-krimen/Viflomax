import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * GET /api/bodegas
 * Lista las bodegas. Admin y chofer (para elegir camioneta al iniciar turno).
 */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token) return NextResponse.json({ data: null, error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo') // 'central' | 'movil' | null (todas)

  try {
    const bodegas = await db.bodega.findMany({
      where: {
        activo: true,
        ...(tipo ? { tipo } : {}),
      },
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
    })
    return NextResponse.json({ data: bodegas, total: bodegas.length, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Error al obtener bodegas' }, { status: 500 })
  }
}

/**
 * POST /api/bodegas
 * Crea una bodega (camioneta o central). Solo admin.
 * Body: { nombre, tipo: 'central'|'movil', patente? }
 */
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  let body: { nombre?: string; tipo?: string; patente?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  if (!body.nombre?.trim()) {
    return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
  }
  const tipo = body.tipo === 'central' ? 'central' : 'movil'

  try {
    const bodega = await db.bodega.create({
      data: {
        nombre: body.nombre.trim(),
        tipo,
        patente: body.patente?.trim() || null,
        activo: true,
      },
    })
    return NextResponse.json({ data: bodega, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al crear la bodega' }, { status: 500 })
  }
}
