'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { frescuraSenal } from '@/lib/ubicaciones'

export type PosicionFlota = {
  turno_id: string
  latitud: number
  longitud: number
  registrado_en: string
  chofer_nombre: string
  bodega_patente: string | null
}

const COLOR_POR_FRESCURA: Record<'fresca' | 'vieja' | 'sin_senal', string> = {
  fresca: '#10b981',
  vieja: '#f59e0b',
  sin_senal: '#ef4444',
}

const ETIQUETA_FRESCURA: Record<'fresca' | 'vieja' | 'sin_senal', string> = {
  fresca: 'Fresca',
  vieja: 'Vieja',
  sin_senal: 'Sin señal',
}

function crearIcono(color: string) {
  return L.divIcon({
    className: '',
    html: `<span class="marcador-flota-pulso" style="background:${color}" aria-hidden="true"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

const CENTRO_DEFECTO: [number, number] = [-33.4489, -70.6693] // Santiago

export default function MapaFlota({ posiciones }: { posiciones: PosicionFlota[] }) {
  const centro: [number, number] =
    posiciones.length > 0 ? [posiciones[0].latitud, posiciones[0].longitud] : CENTRO_DEFECTO

  return (
    <>
      <style>{`
        .marcador-flota-pulso {
          display: block;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          border: 2px solid white;
          box-shadow: 0 0 0 rgba(0, 0, 0, 0.3);
          animation: marcador-flota-pulso-anim 2s infinite;
        }
        @keyframes marcador-flota-pulso-anim {
          0% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.25); }
          70% { box-shadow: 0 0 0 10px rgba(0, 0, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marcador-flota-pulso {
            animation: none;
          }
        }
      `}</style>
      <MapContainer center={centro} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {posiciones.map((p) => {
          const frescura = frescuraSenal(p.registrado_en)
          return (
            <Marker
              key={p.turno_id}
              position={[p.latitud, p.longitud]}
              icon={crearIcono(COLOR_POR_FRESCURA[frescura])}
            >
              <Popup>
                <div>
                  <p className="font-semibold">{p.chofer_nombre}</p>
                  {p.bodega_patente && <p>{p.bodega_patente}</p>}
                  <p>
                    Señal {ETIQUETA_FRESCURA[frescura]} · {new Date(p.registrado_en).toLocaleTimeString('es-CL')}
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </>
  )
}
