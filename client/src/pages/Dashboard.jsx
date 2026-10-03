import { useSelector } from 'react-redux'

export default function Dashboard() {
  const user = useSelector((state) => state.auth.user)

  return (
    <section>
      <h1>Dashboard</h1>
      <p>{user ? `Signed in as ${user.name ?? user.email}` : 'Not signed in'}</p>
    </section>
  )
}