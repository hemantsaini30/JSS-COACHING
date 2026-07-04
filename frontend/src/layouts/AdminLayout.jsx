import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from '../components/NotificationBell'

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const navItems = [
    { label: 'Dashboard',      path: '/admin/dashboard',      icon: '⊞' },
    { label: 'Students',       path: '/admin/students',       icon: '👤' },
    { label: 'Teachers',       path: '/admin/teachers',       icon: '🎓' },
    { label: 'Batches',        path: '/admin/batches',        icon: '📚' },
    { label: 'Attendance',     path: '/admin/attendance',     icon: '✅' },
    { label: 'Fees',           path: '/admin/fees',           icon: '₹' },
    { label: 'Inquiries',      path: '/admin/inquiries',      icon: '📋' },
    { label: 'Test Analytics', path: '/admin/tests',          icon: '📊' },
    { label: 'Announcements',  path: '/admin/announcements',  icon: '📢' },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-blue-900 flex items-center justify-between">
        <span className="text-lg font-bold text-white">Inst<span className="text-emerald-400">ora</span></span>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-blue-300 hover:text-white text-xl">✕</button>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-900 text-white border-l-2 border-emerald-400'
                  : 'text-blue-200 hover:bg-blue-900 hover:text-white'
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-blue-900">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-blue-400">{user?.username}</p>
          <NotificationBell theme="dark" />
        </div>
        <button onClick={handleLogout} className="w-full text-xs text-blue-300 hover:text-white py-1 transition-colors text-left">
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed top-0 left-0 h-full w-56 bg-blue-950 z-30 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <SidebarContent />
      </aside>
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900 text-xl p-1">☰</button>
          <span className="text-base font-bold text-blue-800">Inst<span className="text-emerald-600">ora</span></span>
          <div className="flex items-center gap-2">
            <NotificationBell theme="light" />
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout