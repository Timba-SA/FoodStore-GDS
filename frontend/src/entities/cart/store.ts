/**
 * useCartStore — Zustand store for the client-side shopping cart.
 *
 * Business rules implemented:
 * - RN-CR01: Cart is client-side only (no backend calls here).
 * - RN-CR02: Persists via localStorage (zustand/middleware persist).
 * - RN-CR03: Adding an existing product+personalizacion combination increments qty.
 * - RN-CR04: personalizacion IDs are validated against the product's ingredients.
 * - RN-CR05: personalizacion stored as number[] (INTEGER[]).
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Producto } from '@/entities/producto/types'
import type { CartItem, CartState } from './types'

/**
 * Generates a stable composite ID for a cart item.
 * Same producto + same exclusions → same ID (quantities are merged).
 * Same producto + different exclusions → different ID (separate lines).
 */
function makeItemId(productoId: number, personalizacion: number[]): string {
  const sorted = [...personalizacion].sort((a, b) => a - b)
  return `${productoId}-${sorted.join(',')}`
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      // ------------------------------------------------------------------
      // addItem
      // Validates personalizacion against the product's ingredient list,
      // then either merges with an existing cart line or pushes a new one.
      // ------------------------------------------------------------------
      addItem: (producto: Producto, cantidad: number, personalizacion: number[]) => {
        // RN-CR04: filter out any exclusion IDs that don't belong to this product
        const validIngredienteIds = new Set(producto.ingredientes.map((i) => i.id))
        const validPersonalizacion = personalizacion.filter((id) => validIngredienteIds.has(id))

        const id = makeItemId(producto.id, validPersonalizacion)

        set((state) => {
          const existing = state.items.find((item) => item.id === id)
          if (existing) {
            // RN-CR03: same line → increment quantity
            return {
              items: state.items.map((item) =>
                item.id === id ? { ...item, cantidad: item.cantidad + cantidad } : item
              ),
            }
          }
          // New cart line
          const newItem: CartItem = {
            id,
            productoId: producto.id,
            producto, // snapshot
            cantidad,
            personalizacion: validPersonalizacion,
          }
          return { items: [...state.items, newItem] }
        })
      },

      // ------------------------------------------------------------------
      // removeItem
      // ------------------------------------------------------------------
      removeItem: (id: string) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
      },

      // ------------------------------------------------------------------
      // updateQuantity  — enforces minimum of 1
      // ------------------------------------------------------------------
      updateQuantity: (id: string, cantidad: number) => {
        const safeCantidad = Math.max(1, cantidad)
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, cantidad: safeCantidad } : item
          ),
        }))
      },

      // ------------------------------------------------------------------
      // clearCart
      // ------------------------------------------------------------------
      clearCart: () => set({ items: [] }),

      // ------------------------------------------------------------------
      // Derived selectors
      // ------------------------------------------------------------------
      getTotalItems: () => get().items.reduce((acc, item) => acc + item.cantidad, 0),

      getSubtotal: () =>
        get().items.reduce(
          (acc, item) => acc + parseFloat(item.producto.precio) * item.cantidad,
          0
        ),
    }),
    {
      name: 'foodstore-cart', // localStorage key
      // Only persist the items array — actions are always rehydrated from code
      partialize: (state) => ({ items: state.items }),
    }
  )
)
