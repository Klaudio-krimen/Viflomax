import Link from 'next/link'
import { TELEFONO_LEGIBLE, TELEFONO_HREF, TIENE_WHATSAPP, HORARIO } from '@/lib/contacto'

export function SiteHeader() {
  return (
    <header>
      {/* Barra de contacto */}
      {TIENE_WHATSAPP && (
        <div className="bg-viflomax-azul-800 text-white text-xs sm:text-sm">
          <div className="max-w-6xl mx-auto px-6 py-2 flex flex-wrap items-center justify-center sm:justify-between gap-4">
            <span className="hidden sm:inline text-white/85">{HORARIO}</span>
            <a
              href={TELEFONO_HREF}
              className="font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-white rounded"
            >
              📞 {TELEFONO_LEGIBLE}
            </a>
          </div>
        </div>
      )}

      {/* Navbar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 rounded"
          >
            <span className="font-nunito font-extrabold text-xl text-viflomax-azul-800">
              Agua <span className="text-viflomax-verde-700">Viflomax</span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <a
              href="#productos"
              className="font-medium text-gray-700 hover:text-viflomax-azul-800 transition-colors focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 rounded"
            >
              Productos
            </a>
            <Link
              href="/contacto"
              className="font-medium text-gray-700 hover:text-viflomax-azul-800 transition-colors focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 rounded"
            >
              Contacto
            </Link>
            <a
              href="#pedido"
              className="bg-viflomax-verde-700 hover:bg-viflomax-verde-800 text-white font-bold text-sm px-5 py-2 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700"
            >
              Pedir ahora
            </a>
          </div>
        </nav>
      </div>
    </header>
  )
}
