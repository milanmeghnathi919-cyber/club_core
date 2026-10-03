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
      const existing = state.items.find((i) => i.productId === product.id)
      if (existing) {
        existing.qty += qty
      } else {
        state.items.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          imageUrl: product.imageUrl,
          qty,
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
          item.qty = qty
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
  setFulfilment,
  setDeliveryAddress,
  setQuote,
  clearCart,
  toggleCartDrawer,
} = cartSlice.actions

export default cartSlice.reducer
