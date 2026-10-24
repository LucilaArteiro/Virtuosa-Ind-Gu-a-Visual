import type { Producto } from './productos'

const CLAVE_PRODUCTOS = 'virtuosa-ind-productos'

export function obtenerProductos (): Producto[] {
  if (typeof window === 'undefined') return []

  try {
    const datos = localStorage.getItem(CLAVE_PRODUCTOS)

    if (!datos) return []

    const productos: unknown = JSON.parse(datos)

    return Array.isArray(productos) ? (productos as Producto[]) : []
  } catch {
    return []
  }
}

export function guardarProductos (productos: Producto[]): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(productos))
    return true
  } catch {
    return false
  }
}
