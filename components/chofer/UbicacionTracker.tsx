'use client'

import { useEffect, useState } from 'react'
import { useUbicacionPing } from '@/lib/useUbicacionPing'

const CONSENTIMIENTO_KEY = 'viflomax_rastreo_ubicacion_aceptado'
const INTERVALO_CHEQUEO_TURNO_MS = 60000

/**
 * Pide consentimiento antes del primer prompt nativo del navegador, activa
 * useUbicacionPing sólo mientras hay turno activo y consentimiento dado, y
 * muestra un indicador permanente mientras comparte ubicación. Sin props:
 * se monta directo en app/chofer/layout.tsx (componente de servidor).
 */
export default function UbicacionTracker() {
  const [turnoActivo, setTurnoActivo] = useState(false)
  const [consentimiento, setConsentimiento] = useState(false)

  useEffect(() => {
    setConsentimiento(localStorage.getItem(CONSENTIMIENTO_KEY) === '1')
  }, [])

  useEffect(() => {
    let cancelado = false

    async function verificarTurno() {
      try {
        const res = await fetch('/api/turnos')
        const json = (await res.json()) as { data: unknown }
        if (!cancelado) setTurnoActivo(Boolean(json?.data))
      } catch {
        if (!cancelado) setTurnoActivo(false)
      }
    }

    verificarTurno()
    const intervalo = setInterval(verificarTurno, INTERVALO_CHEQUEO_TURNO_MS)
    return () => {
      cancelado = true
      clearInterval(intervalo)
    }
  }, [])

  const { compartiendo } = useUbicacionPing({ activo: turnoActivo && consentimiento })

  function aceptar() {
    localStorage.setItem(CONSENTIMIENTO_KEY, '1')
    setConsentimiento(true)
  }

  const mostrarTarjeta = turnoActivo && !consentimiento

  if (mostrarTarjeta) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 max-w-md mx-auto space-y-3">
          <p className="font-nunito font-bold text-gray-900">Compartir ubicación durante tu turno</p>
          <p className="font-outfit text-sm text-gray-600">
            Para que el administrador vea tu posición en el mapa de flota, Viflomax necesita acceso a
            tu ubicación. El rastreo <strong>sólo ocurre durante un turno activo</strong> y{' '}
            <strong>se detiene cuando cierras la aplicación</strong>.
          </p>
          <button
            type="button"
            onClick={aceptar}
            className="w-full px-4 py-3 rounded-xl bg-viflomax-verde text-white font-outfit font-semibold hover:opacity-90 transition-opacity"
          >
            Aceptar y compartir ubicación
          </button>
        </div>
      </div>
    )
  }

  if (!turnoActivo || !compartiendo) return null

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-white rounded-xl shadow-sm border border-gray-200 px-3 py-2">
      <span className="w-2.5 h-2.5 rounded-full bg-viflomax-verde animate-pulse" />
      <span className="font-outfit text-sm text-gray-700">Compartiendo ubicación</span>
    </div>
  )
}
