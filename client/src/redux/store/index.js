import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/feature/auth/slices/authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  devTools: import.meta.env.MODE !== 'production',
})