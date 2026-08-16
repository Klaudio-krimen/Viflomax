'use client'

import { useState } from 'react'
import { CATEGORIAS, PRODUCTOS, formatCLP, filtrarPorCategoria, type CategoriaId } from '@/lib/productos'
import { generarGotas } from '@/lib/landing/gotas'
import { ProductoImagen } from './ProductoImagen'
import { LluviaDeGotas } from './LluviaDeGotas'
import { usePedido } from './PedidoProvider'

type Filtro = 'todos' | CategoriaId

// Nivel de módulo: la misma lluvia en el render del servidor y al hidratar.
// azul-300 (#a3d9f0) sobre el fondo blanco de la sección.
const GOTAS_PRODUCTOS = generarGotas(7, 16, '#a3d9f0')

export function ProductGrid() {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const { setProductoSeleccionado } = usePedido()

  const visibles = filtrarPorCategoria(PRODUCTOS, filtro)

  const irAlFormulario = (nombreProducto: string) => {
    setProductoSeleccionado(nombreProducto)
    window.location.hash = 'pedido'
  }

  return (
    <section id="productos" className="relative py-16 bg-gray-50 overflow-hidden scroll-mt-24">
      <LluviaDeGotas gotas={GOTAS_PRODUCTOS} />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="font-nunito text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Nuestros Productos
          </h2>
          <p className="text-gray-600 text-lg">
            Precio final en Maipú. Para otras comunas se confirma al hacer el pedido.
          </p>
        </div>

        {/* Filtros por categoría */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {([{ id: 'todos', label: 'Todos' }, ...CATEGORIAS] as { id: Filtro; label: string }[]).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFiltro(c.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 ${
                filtro === c.id
                  ? 'bg-viflomax-azul-800 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-viflomax-azul'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {visibles.length === 0 ? (
          <p className="text-center text-gray-600 text-lg py-12">
            No hay productos en esta categoría
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibles.map((producto) => (
              <article
                key={producto.nombre}
                className={`group bg-white rounded-2xl overflow-hidden flex flex-col transition-shadow duration-200 hover:shadow-lg ${
                  producto.destacado
                    ? 'border-2 border-viflomax-verde shadow-md'
                    : 'border border-gray-200 shadow-sm'
                }`}
              >
                {/* Foto */}
                <div className="relative aspect-square bg-white border-b border-gray-100">
                  <ProductoImagen src={producto.imagen} alt={producto.nombre} />
                  {producto.badge && (
                    <span className="absolute top-3 left-3 bg-viflomax-verde-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                      {producto.badge}
                    </span>
                  )}
                </div>

                {/* Contenido */}
                <div className="flex flex-col flex-1 p-5">
                  <h3 className="font-nunito font-bold text-gray-900 text-lg mb-1">
                    {producto.nombre}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
                    {producto.descripcion}
                  </p>
                  <p className="text-viflomax-azul-800 font-extrabold text-2xl mb-4">
                    {formatCLP(producto.precio)}
                  </p>
                  <button
                    type="button"
                    onClick={() => irAlFormulario(producto.nombre)}
                    className="w-full inline-flex items-center justify-center bg-viflomax-verde-700 hover:bg-viflomax-verde-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700"
                  >
                    Pedir este
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
