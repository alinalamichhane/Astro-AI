import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],   // [{ product, quantity }]
      currency: 'NPR',

      addItem: (product, quantity = 1) => {
        const items = get().items
        const existing = items.find(i => i.product.id === product.id)
        if (existing) {
          // Increase quantity, respect stock limit
          const newQty = Math.min(existing.quantity + quantity, product.stock)
          set({ items: items.map(i =>
            i.product.id === product.id ? { ...i, quantity: newQty } : i
          )})
        } else {
          set({ items: [...items, { product, quantity: Math.min(quantity, product.stock) }] })
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter(i => i.product.id !== productId) })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId)
          return
        }
        set({ items: get().items.map(i =>
          i.product.id === productId
            ? { ...i, quantity: Math.min(quantity, i.product.stock) }
            : i
        )})
      },

      clearCart: () => set({ items: [] }),

      setCurrency: (currency) => set({ currency }),

      // Computed
      get totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      get totalAmount() {
        const { items, currency } = get()
        return items.reduce((sum, i) => {
          const price = currency === 'USD' ? i.product.price_usd : i.product.price_npr
          return sum + (parseFloat(price) * i.quantity)
        }, 0)
      },
    }),
    {
      name: 'astroai-cart',
      partialize: (state) => ({ items: state.items, currency: state.currency }),
    }
  )
)

export default useCartStore
