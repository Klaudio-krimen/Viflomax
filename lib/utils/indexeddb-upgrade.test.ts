import { aplicarUpgradeIndexedDB } from './index'

// ─────────────────────────────────────────────────────────────────────────────
// Fake de IndexedDB — sólo implementa objectStoreNames.contains y
// createObjectStore, que es todo lo que aplicarUpgradeIndexedDB necesita.
// ─────────────────────────────────────────────────────────────────────────────

function crearDbFalsa(storesExistentes: string[]) {
  const stores = new Set(storesExistentes)
  const creados: { nombre: string; opciones?: object }[] = []

  const db = {
    objectStoreNames: {
      contains: (nombre: string) => stores.has(nombre),
    },
    createObjectStore: (nombre: string, opciones?: object) => {
      stores.add(nombre)
      creados.push({ nombre, opciones })
      return {}
    },
  }

  return { db, creados }
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('aplicarUpgradeIndexedDB', () => {
  it('1. oldVersion=1 con entregas_pendientes ya presente crea sólo ubicaciones_pendientes', () => {
    const { db, creados } = crearDbFalsa(['entregas_pendientes'])

    aplicarUpgradeIndexedDB(db, 1)

    expect(creados).toEqual([{ nombre: 'ubicaciones_pendientes', opciones: { autoIncrement: true } }])
    expect(db.objectStoreNames.contains('entregas_pendientes')).toBe(true)
    expect(db.objectStoreNames.contains('ubicaciones_pendientes')).toBe(true)
  })

  it('2. oldVersion=0 sin ningún store crea entregas_pendientes y ubicaciones_pendientes', () => {
    const { db, creados } = crearDbFalsa([])

    aplicarUpgradeIndexedDB(db, 0)

    expect(creados).toEqual([
      { nombre: 'entregas_pendientes', opciones: { keyPath: 'pedido_id' } },
      { nombre: 'ubicaciones_pendientes', opciones: { autoIncrement: true } },
    ])
  })

  it('3. oldVersion=2 (ya migrado) no crea ningún store nuevo', () => {
    const { db, creados } = crearDbFalsa(['entregas_pendientes', 'ubicaciones_pendientes'])

    aplicarUpgradeIndexedDB(db, 2)

    expect(creados).toEqual([])
  })
})
