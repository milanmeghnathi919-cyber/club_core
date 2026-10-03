import { createSlice } from '@reduxjs/toolkit'

const loadCartFromStorage = () => {
  try {
    const raw = localStorage.getItem('cc_cart')
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return { items: [], fulfilment: 'pickup', deliveryAddress: '' }
}

const saveCartToStorage = (state) => {
  try {
    localStorage.setItem(
      'cc_cart',
      JSON.stringify({
        items: state.items,
        fulfilment: state.fulfilment,
        deliveryAddress: state.deliveryAddress,
      }),
    )
  } catch {
    // ignore
  }
}

const initialState = {
  ...loadCartFromStorage(),
  quote: null,
  isDrawerOpen: false,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action) {
      const { product, qty = 1 } = action.payload
      const stock = product.stock_qty !== undefined
        ? Number(product.stock_qty)
        : product.stockQty !== undefined
        ? Number(product.stockQty)
        : product.stock !== undefined
        ? Number(product.stock)
        : 999

      const existing = state.items.find((i) => i.productId === product.id)
      if (existing) {
        existing.stockQty = stock
        if (stock <= 0) {
          // Out of stock
          existing.qty = 0
        } else {
          existing.qty = Math.min(existing.qty + qty, stock)
        }
      } else {
        const initialQty = stock <= 0 ? 0 : Math.min(qty, stock)
        state.items.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.price),
          imageUrl: product.imageUrl || product.image_url,
          stockQty: stock,
          qty: initialQty,
        })
      }
      state.isDrawerOpen = true
      saveCartToStorage(state)
    },

    removeFromCart(state, action) {
      const productId = action.payload
      state.items = state.items.filter((i) => i.productId !== productId)
      saveCartToStorage(state)
    },

    updateQuantity(state, action) {
      const { productId, qty } = action.payload
      const item = state.items.find((i) => i.productId === productId)
      if (item) {
        if (qty <= 0) {
          state.items = state.items.filter((i) => i.productId !== productId)
        } else {
          const maxStock = item.stockQty !== undefined && item.stockQty !== null ? Number(item.stockQty) : null
          if (maxStock !== null && maxStock >= 0 && qty > maxStock) {
            item.qty = maxStock
          } else {
            item.qty = qty
          }
        }
      }
      saveCartToStorage(state)
    },

    syncItemStock(state, action) {
      const lines = action.payload || []
      lines.forEach((l) => {
        const item = state.items.find((i) => i.productId === (l.productId || l.id))
        const incomingStock = l.stockQty !== undefined ? l.stockQty : (l.stock_qty !== undefined ? l.stock_qty : l.stock)
        if (item && incomingStock !== undefined && incomingStock !== null) {
          item.stockQty = Number(incomingStock)
        }
      })
      saveCartToStorage(state)
    },

    capItemToStock(state, action) {
      const productId = action.payload
      const item = state.items.find((i) => i.productId === productId)
      if (item && item.stockQty !== undefined) {
        if (item.stockQty <= 0) {
          state.items = state.items.filter((i) => i.productId !== productId)
        } else {
          item.qty = item.stockQty
        }
      }
      saveCartToStorage(state)
    },

    setFulfilment(state, action) {
      state.fulfilment = action.payload
      saveCartToStorage(state)
    },

    setDeliveryAddress(state, action) {
      state.deliveryAddress = action.payload
      saveCartToStorage(state)
    },

    setQuote(state, action) {
      state.quote = action.payload
    },

    clearCart(state) {
      state.items = []
      state.quote = null
      saveCartToStorage(state)
    },

    toggleCartDrawer(state, action) {
      state.isDrawerOpen = action.payload !== undefined ? action.payload : !state.isDrawerOpen
    },
  },
})

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  syncItemStock,
  capItemToStock,
  setFulfilment,
  setDeliveryAddress,
  setQuote,
  clearCart,
  toggleCartDrawer,
} = cartSlice.actions

export default cartSlice.reducer
