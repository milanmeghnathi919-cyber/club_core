import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/feature/auth/slices/authSlice'
import cartReducer from '@/feature/shop/cartSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
  },
  devTools: import.meta.env.MODE !== 'production',
})

export default store