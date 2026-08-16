import Image from 'next/image'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-viflomax-azul-900 via-viflomax-azul to-viflomax-verde min-h-[90vh] flex items-center">
      {/* Scrim: sin esta capa ningun texto del hero pasa AA sobre la parada verde del gradiente */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Blobs decorativos */}
      <div
        aria-hidden="true"
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center text-white">
        <div className="logo-float inline-block mb-6">
          <Image
            src="/logo.png"
            alt="Agua Viflomax"
            width={900}
            height={694}
            priority
            className="w-40 sm:w-56 h-auto mx-auto drop-shadow-xl"
          />
        </div>

        <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide">
          Distribución en Maipú y Padre Hurtado
        </span>

        <h1 className="font-nunito text-5xl md:text-7xl font-extrabold leading-tight mb-6 whitespace-pre-line">
          {'Agua Purificada\na Domicilio'}
        </h1>

        <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-xl mx-auto">
          Entrega rápida en Maipú y Padre Hurtado
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#pedido"
            className="inline-flex items-center justify-center bg-viflomax-verde-700 hover:bg-viflomax-verde-800 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white"
          >
            Pedir ahora
          </a>
          <a
            href="#productos"
            className="inline-flex items-center justify-center border-2 border-white text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-white/10 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white"
          >
            Ver productos
          </a>
        </div>
      </div>
    </section>
  )
}
