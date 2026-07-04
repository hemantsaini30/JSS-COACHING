import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from '../components/NotificationBell'

const TeacherLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { label: 'Dashboard',     path: '/teacher/dashboard',     icon: '⊞' },
    { label: 'Tests',         path: '/teacher/tests',         icon: '📝' },
    { label: 'Doubts',        path: '/teacher/doubts',        icon: '💬' },
    { label: 'Announcements', path: '/teacher/announcements', icon: '📢' },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-purple-900 flex items-center justify-between">
        <span className="text-lg font-bold text-white">Inst<span className="text-emerald-400">ora</span></span>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-purple-300 hover:text-white text-xl">✕</button>
      </div>
      <div className="px-4 py-3 border-b border-purple-900">
        <p className="text-xs text-purple-400">Signed in as</p>
        <p className="text-sm text-white font-medium">{user?.username}</p>
        <span className="text-xs bg-purple-800 text-purple-200 px-2 py-0.5 rounded-full">Teacher</span>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-purple-900 text-white border-l-2 border-emerald-400'
                  : 'text-purple-200 hover:bg-purple-900 hover:text-white'
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-purple-900">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-purple-400">{user?.username}</span>
          <NotificationBell theme="dark" />
        </div>
        <button onClick={() => { logout(); navigate('/login') }}
          className="w-full text-xs text-purple-300 hover:text-white py-1 transition-colors text-left">
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
      <aside className={`fixed top-0 left-0 h-full w-56 bg-purple-950 z-30 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <SidebarContent />
      </aside>
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 text-xl p-1">☰</button>
          <span className="text-base font-bold text-blue-800">Inst<span className="text-emerald-600">ora</span></span>
          <div className="flex items-center gap-2">
            <NotificationBell theme="light" />
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>
    </div>
  )
}

export default TeacherLayout