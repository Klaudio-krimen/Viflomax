'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const INTERVALO_MS = 15000

function EsqueletoMapa() {
  return (
    <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
      <span className="font-outfit text-sm text-gray-400">Cargando mapa…</span>
    </div>
  )
}

const MapaFlota = dynamic(() => import('./MapaFlota'), {
  ssr: false,
  loading: () => <EsqueletoMapa />,
})

type PosicionActiva = {
  turno_id: string
  latitud: number
  longitud: number
  precision_m: number | null
  registrado_en: string
  chofer_nombre: string
  bodega_patente: string | null
}

/**
 * Panel en vivo de la flota: mapa Leaflet cargado dinámicamente (sin SSR) +
 * polling de 15 s contra GET /api/ubicaciones/activas. Tres estados
 * explícitos: cargando, vacío, y error (mantiene las últimas posiciones
 * buenas detrás de un banner de reconexión).
 */
export default function FlotaClient() {
  const [posiciones, setPosiciones] = useState<PosicionActiva[] | null>(null)
  const [error, setError] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function consultar() {
      try {
        const res = await fetch('/api/ubicaciones/activas')
        const json = (await res.json()) as { data: PosicionActiva[] | null; error: string | null }
        if (cancelled) return
        if (!res.ok || json.data === null) {
          setError(true)
        } else {
          setPosiciones(json.data)
          setError(false)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setCargando(false)
      }
    }

    consultar()
    const intervalo = setInterval(consultar, INTERVALO_MS)
    return () => {
      cancelled = true
      clearInterval(intervalo)
    }
  }, [])

  if (cargando) {
    return (
      <div className="h-[500px] w-full">
        <EsqueletoMapa />
      </div>
    )
  }

  if (!error && posiciones !== null && posiciones.length === 0) {
    return (
      <div className="h-[500px] w-full bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center">
        <p className="font-outfit text-sm text-gray-500">Ningún chofer en turno en este momento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 text-sm font-outfit">
          Conexión inestable — mostrando las últimas posiciones conocidas. Reintentando…
        </div>
      )}
      <div className="h-[500px] w-full rounded-xl overflow-hidden">
        <MapaFlota posiciones={posiciones ?? []} />
      </div>
    </div>
  )
}
