import Link from 'next/link'
import { WhatsAppFloat } from '@/components/public/WhatsAppFloat'
import {
  TELEFONO_LEGIBLE,
  TELEFONO_HREF,
  TIENE_WHATSAPP,
  HORARIO,
} from '@/lib/contacto'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Barra de contacto */}
      {TIENE_WHATSAPP && (
        <div className="bg-viflomax-azul-oscuro text-white text-xs sm:text-sm">
          <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-center sm:justify-between gap-4">
            <span className="hidden sm:inline text-white/85">{HORARIO}</span>
            <a href={TELEFONO_HREF} className="font-semibold hover:underline">
              📞 {TELEFONO_LEGIBLE}
            </a>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-nunito font-extrabold text-xl text-viflomax-azul-oscuro">
              Agua{' '}
              <span className="text-viflomax-verde">Viflomax</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
            <Link href="/" className="hover:text-viflomax-azul-oscuro transition-colors">
              Inicio
            </Link>
            <Link href="/pedir" className="hover:text-viflomax-azul-oscuro transition-colors">
              Pedir Agua
            </Link>
            <Link href="/contacto" className="hover:text-viflomax-azul-oscuro transition-colors">
              Contacto
            </Link>
          </div>

          {/* CTA button */}
          <Link
            href="/pedir"
            className="bg-viflomax-verde hover:bg-viflomax-verde-claro text-white font-bold text-sm px-5 py-2 rounded-lg transition-colors duration-200"
          >
            Pedir Ahora
          </Link>
        </nav>
      </header>

      {/* Page content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-viflomax-azul-oscuro text-white py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div>
            <p className="font-nunito font-extrabold text-xl mb-1">Agua Viflomax</p>
            <p className="text-white/85 text-sm">Maipú, Región Metropolitana</p>
            {TIENE_WHATSAPP && (
              <a
                href={TELEFONO_HREF}
                className="text-white/85 text-sm mt-1 block hover:text-white hover:underline"
              >
                {TELEFONO_LEGIBLE}
              </a>
            )}
            <p className="text-white/85 text-sm mt-1">{HORARIO}</p>
          </div>
          <div className="text-white/70 text-xs text-center md:text-right">
            <p>© {new Date().getFullYear()} Agua Viflomax. Todos los derechos reservados.</p>
            <Link href="/login" className="text-white/40 hover:text-white/70 transition-colors">
              Acceso Staff
            </Link>
          </div>
        </div>
      </footer>

      {/* WhatsApp floating button */}
      <WhatsAppFloat />
    </>
  )
}
