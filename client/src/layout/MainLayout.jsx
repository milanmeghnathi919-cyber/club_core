import { Outlet, Link } from 'react-router-dom'

export default function MainLayout() {
  return (
    <div className="app-shell">
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}