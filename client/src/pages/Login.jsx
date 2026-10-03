import { useState } from 'react'
import { useLogin } from '@/feature/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, error, isLoading } = useLogin()

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      await login({ email, password })
    } catch {
      // error is already surfaced from the slice
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Login</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  )
}