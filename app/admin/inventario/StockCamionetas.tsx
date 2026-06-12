import React from 'react'
import type { CamionetaStock } from './page'

export function StockCamionetas({ camionetas }: { camionetas: CamionetaStock[] }) {
  if (camionetas.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="font-nunito font-semibold text-gray-700 text-sm uppercase tracking-wider">
        Stock en camionetas
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {camionetas.map((c) => {
          const conStock = c.items.filter((i) => i.stock_bodega > 0 || i.stock_vacios_bodega > 0)
          return (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-nunito font-semibold text-gray-900">{c.nombre}</p>
                {c.patente && <p className="text-xs font-outfit text-gray-500">{c.patente}</p>}
              </div>
              {conStock.length === 0 ? (
                <p className="px-4 py-5 text-sm font-outfit text-gray-400 text-center">Sin stock cargado</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {conStock.map((i) => (
                    <li key={i.producto_id} className="px-4 py-2 flex items-center justify-between text-sm font-outfit">
                      <span className="text-gray-700">{i.nombre}</span>
                      <span className="text-gray-900 font-semibold">
                        {i.stock_bodega}
                        {i.stock_vacios_bodega > 0 && (
                          <span className="ml-2 text-xs text-gray-400 font-normal">({i.stock_vacios_bodega} vacíos)</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
