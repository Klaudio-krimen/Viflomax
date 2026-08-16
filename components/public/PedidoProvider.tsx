'use client'

import { createContext, useContext, useState } from 'react'

interface PedidoContextValue {
  productoSeleccionado: string | null
  setProductoSeleccionado: (producto: string) => void
}

const PedidoContext = createContext<PedidoContextValue | undefined>(undefined)

export function PedidoProvider({ children }: { children: React.ReactNode }) {
  const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null)

  return (
    <PedidoContext.Provider value={{ productoSeleccionado, setProductoSeleccionado }}>
      {children}
    </PedidoContext.Provider>
  )
}

export function usePedido(): PedidoContextValue {
  const context = useContext(PedidoContext)
  if (!context) {
    throw new Error('usePedido debe usarse dentro de PedidoProvider')
  }
  return context
}
