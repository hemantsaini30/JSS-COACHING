import { useState, useRef, useEffect } from 'react'
import { useSocket } from '../context/SocketContext'

const NotificationBell = ({ theme = 'light' }) => {
  const { notifications, unreadCount, markAllRead } = useSocket()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ← only toggles the dropdown, never auto-marks as read
  const handleOpen = () => setOpen(o => !o)

  const timeAgo = (d) => {
    const diff = Date.now() - new Date(d)
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const isDark = theme === 'dark'
  const buttonClass = isDark
    ? 'text-blue-300 hover:text-white transition-colors'
    : 'text-gray-500 hover:text-gray-700 transition-colors'

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className={`relative p-1.5 ${buttonClass}`} title="Notifications">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-1 font-bold leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : notifications.slice(0, 30).map((n, i) => {
              const ann = n.announcementId
              if (!ann) return null
              return (
                <div key={n._id || i}
                  className={`px-4 py-3 transition-colors ${
                    !n.isRead ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50'
                  }`}>
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {ann.senderRole === 'admin' ? '📢' : '👨‍🏫'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${!n.isRead ? 'text-gray-900' : 'text-gray-500'}`}>
                        {ann.title}
                      </p>
                      <p className={`text-xs mt-0.5 line-clamp-2 leading-relaxed ${!n.isRead ? 'text-gray-600' : 'text-gray-400'}`}>
                        {ann.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {ann.senderName || ann.senderRole} · {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell