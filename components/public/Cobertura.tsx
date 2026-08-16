import { ZONA } from '@/lib/contacto'
import { generarGotas } from '@/lib/landing/gotas'
import { LluviaDeGotas } from './LluviaDeGotas'

// Nivel de módulo, semilla propia (distinta de la del catálogo) para que las
// dos lluvias no queden espejadas. azul-400 (#6dc2e3), el que se lee sobre azul-100.
const GOTAS_COBERTURA = generarGotas(23, 20, '#6dc2e3')

export function Cobertura() {
  return (
    <section className="relative py-16 bg-viflomax-azul-100 overflow-hidden">
      <LluviaDeGotas gotas={GOTAS_COBERTURA} />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-nunito text-3xl md:text-4xl font-bold text-viflomax-azul-800 mb-4">
          Zona de cobertura
        </h2>
        <p className="text-gray-700 text-lg mb-8">
          Entregamos en {ZONA}. ¿Tu dirección no está en el listado? Escríbenos y lo confirmamos.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <span className="bg-white text-viflomax-azul-800 font-semibold text-sm px-5 py-2 rounded-full shadow-sm border border-viflomax-azul-300">
            Maipú
          </span>
          <span className="bg-white text-viflomax-azul-800 font-semibold text-sm px-5 py-2 rounded-full shadow-sm border border-viflomax-azul-300">
            Padre Hurtado
          </span>
        </div>
      </div>
    </section>
  )
}
