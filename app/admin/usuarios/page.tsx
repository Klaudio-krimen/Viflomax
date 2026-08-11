import { db } from '@/lib/db'
import { UsuariosClient, type UsuarioVisor } from './UsuariosClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Usuarios — Viflomax Admin' }

export default async function UsuariosPage() {
  const usuarios = await db.user.findMany({
    where: { role: 'visor' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, createdAt: true },
  })

  const usuariosVisor: UsuarioVisor[] = usuarios.map((u) => ({
    id: u.id,
    nombre: u.name ?? '',
    email: u.email ?? '',
    createdAt: u.createdAt.toISOString(),
  }))

  return <UsuariosClient usuarios={usuariosVisor} />
}
