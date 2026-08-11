import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/admin/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (!['admin', 'visor'].includes(session.user.role)) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col md:flex-row h-screen md:overflow-hidden bg-gray-50">
      <Sidebar userEmail={session.user.email} role={session.user.role} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
