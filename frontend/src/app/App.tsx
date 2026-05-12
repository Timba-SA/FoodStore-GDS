/**
 * App.tsx — Root component.
 *
 * Renders MainLayout (Sidebar + Navbar + Outlet) and the global CartDrawer.
 * The CartDrawer is controlled via the Zustand cart store (no prop drilling).
 */

import MainLayout from '@/shared/components/layout/MainLayout'
import CartDrawer from '@/features/cart/CartDrawer'
import { useCartStore } from '@/entities/cart/store'

export default function App() {
  const drawerOpen = useCartStore((s) => s.drawerOpen)
  const closeDrawer = useCartStore((s) => s.closeDrawer)

  return (
    <>
      <MainLayout />
      <CartDrawer isOpen={drawerOpen} onClose={closeDrawer} />
    </>
  )
}
