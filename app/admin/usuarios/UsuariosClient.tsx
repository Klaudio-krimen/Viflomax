'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { crearUsuarioVisor, eliminarUsuarioVisor } from './actions'

export type UsuarioVisor = {
  id: string
  nombre: string
  email: string
  createdAt: string
}

// ─── Generador de contraseña temporal (mismo patrón que choferes) ───────────
function generatePassword(): string {
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const all = upper + lower + digits
  const arr = Array.from(
    { length: 10 },
    () => all[Math.floor(Math.random() * all.length)]
  )
  arr[0] = upper[Math.floor(Math.random() * upper.length)]
  arr[1] = digits[Math.floor(Math.random() * digits.length)]
  return arr.sort(() => Math.random() - 0.5).join('')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Modal: Agregar usuario visor ────────────────────────────────────────────
function AgregarUsuarioModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)

  function handleOpen() {
    setPassword(generatePassword())
    setError(null)
    setCopied(false)
    setOpen(true)
  }

  function handleClose() {
    if (pending) return
    setOpen(false)
    setError(null)
  }

  function copyPassword() {
    navigator.clipboard.writeText(password).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('password', password)

    startTransition(async () => {
      const result = await crearUsuarioVisor(formData)
      if (result.error) {
        setError(result.error)
      } else {
        handleClose()
        onSuccess()
      }
    })
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={handleOpen}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Usuario
      </Button>

      <Modal isOpen={open} onClose={handleClose} title="Agregar Usuario (solo ver pedidos)" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm font-outfit">
              {error}
            </div>
          )}

          <Input
            label="Nombre completo"
            name="nombre"
            required
            placeholder="María Soto"
            autoFocus
          />

          <Input
            label="Email (cuenta de acceso al sistema)"
            name="email"
            type="email"
            required
            placeholder="usuario@viflomax.cl"
            helperText="Esta cuenta solo podrá ver el listado y detalle de pedidos"
          />

          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm text-gray-700 font-outfit">
              Contraseña temporal{' '}
              <span className="text-red-500 ml-0.5" aria-hidden="true">
                *
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="flex-1 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 bg-white outline-none ring-1 ring-gray-300 focus:ring-viflomax-azul transition-shadow min-w-0"
                aria-label="Contraseña temporal"
              />
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                title="Generar nueva contraseña"
                className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 shrink-0"
              >
                ↺
              </button>
              <button
                type="button"
                onClick={copyPassword}
                title="Copiar contraseña"
                className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 shrink-0"
              >
                {copied ? '✓' : '⎘'}
              </button>
            </div>
            <p className="text-xs text-gray-500 font-outfit">
              Comunica esta contraseña al usuario. Podrá cambiarla desde su cuenta.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleClose}
              className="flex-1"
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={pending}
              className="flex-1"
            >
              Crear Usuario
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

// ─── Botón: Eliminar usuario visor ───────────────────────────────────────────
function EliminarUsuarioButton({
  usuario,
  onSuccess,
}: {
  usuario: UsuarioVisor
  onSuccess: () => void
}) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!window.confirm(`¿Eliminar la cuenta de ${usuario.nombre || usuario.email}? Esta acción no se puede deshacer.`))
      return
    startTransition(async () => {
      const result = await eliminarUsuarioVisor(usuario.id)
      if (result.error) {
        window.alert(result.error)
      } else {
        onSuccess()
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="px-2.5 py-1 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium font-outfit border border-red-200 disabled:opacity-50"
    >
      {pending ? '…' : 'Eliminar'}
    </button>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function UsuariosClient({ usuarios }: { usuarios: UsuarioVisor[] }) {
  const router = useRouter()

  function onSuccess() {
    router.refresh()
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Usuarios</h2>
          <p className="text-sm font-outfit text-gray-500 mt-0.5">
            Cuentas con acceso de solo lectura a pedidos · {usuarios.length} usuario
            {usuarios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <AgregarUsuarioModal onSuccess={onSuccess} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {usuarios.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-gray-500 font-outfit text-sm mb-1">
              No hay usuarios de solo lectura registrados.
            </p>
            <p className="text-gray-400 font-outfit text-xs">
              Usa el botón &quot;Nuevo Usuario&quot; para crear el primero.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-outfit">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Creado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{usuario.nombre || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{usuario.email}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(usuario.createdAt)}</td>
                    <td className="px-4 py-3">
                      <EliminarUsuarioButton usuario={usuario} onSuccess={onSuccess} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
