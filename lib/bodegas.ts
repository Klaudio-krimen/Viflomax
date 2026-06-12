import { db } from '@/lib/db'

/**
 * Devuelve el id de la Bodega Central (la primera creada con tipo 'central').
 * Lanza si no existe — el sistema siempre debe tener una bodega central.
 */
export async function getBodegaCentralId(): Promise<string> {
  const central = await db.bodega.findFirst({
    where: { tipo: 'central' },
    orderBy: { created_at: 'asc' },
    select: { id: true },
  })
  if (!central) {
    throw new Error('No existe una Bodega Central configurada')
  }
  return central.id
}

/**
 * Devuelve el turno activo de un chofer (o null si no tiene turno abierto).
 */
export async function getTurnoActivo(choferId: string) {
  return db.turno.findFirst({
    where: { chofer_id: choferId, estado: 'activo' },
    orderBy: { fecha_inicio: 'desc' },
  })
}
