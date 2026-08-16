export type CategoriaId = 'agua' | 'dispensadores' | 'extras'

export type Producto = {
  nombre: string
  precio: number
  categoria: CategoriaId
  descripcion: string
  /** Ruta en /public/productos/. Si falta, se muestra un placeholder de marca. */
  imagen?: string
  destacado?: boolean
  badge?: string
}

export const CATEGORIAS: { id: CategoriaId; label: string }[] = [
  { id: 'agua', label: 'Agua y recargas' },
  { id: 'dispensadores', label: 'Dispensadores' },
  { id: 'extras', label: 'Extras' },
]

export const PRODUCTOS: Producto[] = [
  {
    nombre: 'Recarga 20 Litros',
    precio: 2500,
    categoria: 'agua',
    descripcion: 'Rellenamos tu bidón. La opción más económica si ya tienes envase.',
    destacado: true,
    badge: 'El más pedido',
    imagen: '/productos/recarga-20l.jpg',
  },
  {
    nombre: 'Envase 20 Litros',
    precio: 5500,
    categoria: 'agua',
    descripcion: 'Bidón nuevo con agua purificada. Incluye el envase.',
    imagen: '/productos/envase-20l.jpg',
  },
  {
    nombre: 'Envase 10 Litros',
    precio: 3500,
    categoria: 'agua',
    descripcion: 'Formato más liviano, ideal para espacios chicos.',
    imagen: '/productos/envase-10l.jpg',
  },
  {
    nombre: 'Recarga 10 Litros',
    precio: 1800,
    categoria: 'agua',
    descripcion: 'Rellenado de tu bidón de 10 litros.',
    imagen: '/productos/recarga-10l.jpg',
  },
  {
    nombre: 'Dispensador Bomba USB',
    precio: 25000,
    categoria: 'dispensadores',
    descripcion: 'Bomba eléctrica recargable por USB. Se monta sobre el bidón.',
    badge: 'Sin esfuerzo',
    imagen: '/productos/dispensador-bomba-usb.jpg',
  },
  {
    nombre: 'Dispensador Eléctrico Sobremesa',
    precio: 20000,
    categoria: 'dispensadores',
    descripcion: 'Base de sobremesa con bomba eléctrica integrada.',
    imagen: '/productos/dispensador-electrico-sobremesa.jpg',
  },
  {
    nombre: 'Dispensador Básico Sobremesa',
    precio: 15000,
    categoria: 'dispensadores',
    descripcion: 'Dispensador manual de sobremesa. Simple y resistente.',
    imagen: '/productos/dispensador-basico.jpg',
  },
  {
    nombre: 'Hielo Purificado',
    precio: 2000,
    categoria: 'extras',
    descripcion: 'Bolsa de hielo hecho con la misma agua purificada.',
    imagen: '/productos/hielo.jpg',
  },
  {
    nombre: 'Manilla Transportadora',
    precio: 1500,
    categoria: 'extras',
    descripcion: 'Agarre ergonómico para cargar el bidón sin lastimarte las manos.',
    imagen: '/productos/manilla.jpg',
  },
]

export const formatCLP = (precio: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(precio)

/**
 * Filtra el catálogo por categoría sin mutar `productos`. Con `'todos'`
 * devuelve todos los productos en su orden original.
 */
export function filtrarPorCategoria(
  productos: Producto[],
  filtro: 'todos' | CategoriaId
): Producto[] {
  if (filtro === 'todos') return [...productos]
  return productos.filter((producto) => producto.categoria === filtro)
}
