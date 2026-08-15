'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CATEGORIAS, PRODUCTOS, formatCLP, type CategoriaId } from '@/lib/productos'
import { ProductoImagen } from './ProductoImagen'

type Filtro = 'todos' | CategoriaId

export function ProductGrid() {
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const visibles = filtro === 'todos'
    ? PRODUCTOS
    : PRODUCTOS.filter((p) => p.categoria === filtro)

  return (
    <section id="productos" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
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
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                filtro === c.id
                  ? 'bg-viflomax-azul-oscuro text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-viflomax-azul'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibles.map((producto) => {
            const slug = encodeURIComponent(producto.nombre)
            return (
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
                    <span className="absolute top-3 left-3 bg-viflomax-verde text-white text-xs font-bold px-3 py-1 rounded-full shadow">
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
                  <p className="text-viflomax-azul-oscuro font-extrabold text-2xl mb-4">
                    {formatCLP(producto.precio)}
                  </p>
                  <Link
                    href={`/pedir?producto=${slug}`}
                    className="w-full inline-flex items-center justify-center bg-viflomax-verde hover:bg-viflomax-verde-claro text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    Pedir este
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
