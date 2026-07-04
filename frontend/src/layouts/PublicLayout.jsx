import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#features', label: 'What You Get' },
  { href: '#courses', label: 'Courses' },
  { href: '#inquiry', label: 'Enquire' },
]

const PublicLayout = ({ children }) => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const getDashboardPath = () => {
    if (!user) return '/login'
    return `/${user.role}/dashboard`
  }

  const handleNavClick = () => setMenuOpen(false)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={handleNavClick}>
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md tracking-wide">
              JSS
            </span>
            <span className="text-lg font-bold text-blue-900 hidden sm:inline">
              Jai Shree Shyam
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600 font-medium">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-orange-500 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            {isAuthenticated ? (
              <button
                onClick={() => navigate(getDashboardPath())}
                className="bg-blue-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
              >
                Go to Dashboard
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-blue-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Hamburger button (mobile) */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg text-blue-900 hover:bg-blue-50"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-blue-100 bg-white px-6 py-4 flex flex-col gap-3 text-sm">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleNavClick}
                className="text-slate-600 hover:text-orange-500 font-medium py-1"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-blue-50">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleNavClick()
                    navigate(getDashboardPath())
                  }}
                  className="w-full bg-blue-900 text-white text-sm px-4 py-2.5 rounded-lg hover:bg-blue-800 transition-colors"
                >
                  Go to Dashboard
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={handleNavClick}
                  className="block text-center w-full bg-blue-900 text-white text-sm px-4 py-2.5 rounded-lg hover:bg-blue-800 transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-blue-950 text-blue-200 text-sm text-center py-6">
        © {new Date().getFullYear()} JSS &mdash; Jai Shree Shyam Coaching Institute. Powered by Instora.
      </footer>
    </div>
  )
}

export default PublicLayout