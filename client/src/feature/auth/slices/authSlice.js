import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  token: null,
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user
      state.token = action.payload.token
      state.error = null
      state.status = 'succeeded'
    },
    clearCredentials(state) {
      state.user = null
      state.token = null
      state.error = null
      state.status = 'idle'
    },
    setStatus(state, action) {
      state.status = action.payload
    },
    setError(state, action) {
      state.error = action.payload
      state.status = 'failed'
    },
  },
})

export const { setCredentials, clearCredentials, setStatus, setError } = authSlice.actions

export default authSlice.reducer