import { ZONA, HORARIO } from './contacto'

describe('lib/contacto ZONA y HORARIO', () => {
  it('ZONA es Maipú y Padre Hurtado', () => {
    expect(ZONA).toBe('Maipú y Padre Hurtado')
  })

  it('HORARIO se mantiene sin cambios', () => {
    expect(HORARIO).toBe('Lun a Sáb · 9:00 – 19:00 hrs')
  })
})
