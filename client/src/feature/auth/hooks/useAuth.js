import { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { login as loginRequest, logout as logoutRequest } from '../services/authService'
import { clearCredentials, setCredentials, setStatus, setError } from '../slices/authSlice'

export function useLogin() {
  const dispatch = useDispatch()
  const { status, error } = useSelector((state) => state.auth)

  const login = useCallback(
    async (credentials) => {
      dispatch(setStatus('loading'))
      try {
        const data = await loginRequest(credentials)
        dispatch(setCredentials(data))
        return data
      } catch (err) {
        dispatch(setError(err.response?.data?.message ?? err.message))
        throw err
      }
    },
    [dispatch],
  )

  return { login, status, error, isLoading: status === 'loading' }
}

export function useLogout() {
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await logoutRequest()
    } finally {
      dispatch(clearCredentials())
      setIsLoading(false)
    }
  }, [dispatch])

  return { logout, isLoading }
}