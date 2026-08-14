'use client'

import { useEffect, useRef, useState } from 'react'
import { validarCoordenadas } from '@/lib/ubicaciones'
import { guardarUbicacionOffline, sincronizarUbicaciones } from '@/lib/utils'

const INTERVALO_ENVIO_MS = 2 * 60 * 1000

type OpcionesUbicacionPing = {
  activo: boolean
}

/**
 * Captura la posición del navegador mientras `activo` es true y envía un
 * ping cada 2 minutos como máximo (el throttle vive en el sitio de envío,
 * comparando contra una marca de tiempo en useRef — nunca un temporizador
 * propio). Degrada en silencio: si el envío falla o el permiso está
 * denegado, nunca lanza ni bloquea la UI.
 */
export function useUbicacionPing({ activo }: OpcionesUbicacionPing): { compartiendo: boolean } {
  const [compartiendo, setCompartiendo] = useState(false)
  const ultimoEnvioRef = useRef(0)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!activo || typeof navigator === 'undefined' || !navigator.geolocation) {
      setCompartiendo(false)
      return
    }

    const enviarPing = async (latitud: number, longitud: number, precision_m: number | null) => {
      if (!validarCoordenadas(latitud, longitud)) return
      try {
        const res = await fetch('/api/ubicaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitud, longitud, precision_m: precision_m ?? undefined }),
        })
        if (!res.ok) {
          await guardarUbicacionOffline({ latitud, longitud, precision_m })
        }
      } catch {
        await guardarUbicacionOffline({ latitud, longitud, precision_m })
      }
    }

    const alRecibirPosicion = (posicion: GeolocationPosition) => {
      const ahora = Date.now()
      const esPrimerEnvio = ultimoEnvioRef.current === 0
      if (!esPrimerEnvio && ahora - ultimoEnvioRef.current < INTERVALO_ENVIO_MS) return
      ultimoEnvioRef.current = ahora
      const { latitude, longitude, accuracy } = posicion.coords
      void enviarPing(latitude, longitude, accuracy ?? null)
    }

    const alFallar = () => {
      // Permiso denegado u otro error de geolocalización: degradar en
      // silencio, nunca bloquear la UI del chofer.
    }

    const watchId = navigator.geolocation.watchPosition(alRecibirPosicion, alFallar, {
      enableHighAccuracy: true,
      maximumAge: 60000,
      timeout: 30000,
    })
    watchIdRef.current = watchId
    setCompartiendo(true)

    const alReconectar = () => {
      void sincronizarUbicaciones()
    }
    window.addEventListener('online', alReconectar)

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      window.removeEventListener('online', alReconectar)
      setCompartiendo(false)
    }
  }, [activo])

  return { compartiendo }
}
