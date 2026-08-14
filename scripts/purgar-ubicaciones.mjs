/**
 * Purga las filas de Ubicacion con más de 90 días de retención.
 * Uso: node --env-file=.env scripts/purgar-ubicaciones.mjs
 */

import { PrismaClient } from '@prisma/client'

const DIAS_RETENCION = 90

const db = new PrismaClient()

try {
  const limite = new Date(Date.now() - DIAS_RETENCION * 24 * 60 * 60 * 1000)
  const resultado = await db.ubicacion.deleteMany({
    where: { registrado_en: { lt: limite } },
  })
  console.log(`✅ ${resultado.count} ubicaciones eliminadas (anteriores a ${limite.toISOString()}).`)
} catch (err) {
  console.error('❌ Error:', err.message)
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
