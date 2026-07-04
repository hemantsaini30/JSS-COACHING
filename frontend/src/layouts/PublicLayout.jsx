import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PublicLayout = ({ children }) => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const getDashboardPath = () => {
    if (!user) return '/login'
    return `/${user.role}/dashboard`
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-blue-800">
            Inst<span className="text-emerald-600">ora</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#about" className="hover:text-gray-900 transition-colors">About</a>
            <a href="#teachers" className="hover:text-gray-900 transition-colors">Faculty</a>
            <a href="#inquiry" className="hover:text-gray-900 transition-colors">Enquire</a>
          </nav>
          {isAuthenticated ? (
            <button
              onClick={() => navigate(getDashboardPath())}
              className="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Go to Dashboard
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-gray-900 text-gray-400 text-sm text-center py-6">
        © {new Date().getFullYear()} Instora. Built for coaching institutes.
      </footer>
    </div>
  )
}

export default PublicLayout