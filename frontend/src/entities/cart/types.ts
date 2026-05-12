/**
 * CartItem and CartState types for the Zustand cart store.
 * The cart is 100% client-side with localStorage persistence (RN-CR01, RN-CR02).
 */

import type { Producto } from '@/entities/producto/types'

export interface CartItem {
  /** Composite ID: `${productoId}-${sortedPersonalizacionIds}` */
  id: string
  productoId: number
  /** Snapshot of the product at the time it was added */
  producto: Producto
  cantidad: number
  /** IDs of ingredients to EXCLUDE from this item (INTEGER[]) */
  personalizacion: number[]
}

export interface CartState {
  items: CartItem[]
  drawerOpen: boolean
  addItem: (producto: Producto, cantidad: number, personalizacion: number[]) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, cantidad: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getSubtotal: () => number
  openDrawer: () => void
  closeDrawer: () => void
}

