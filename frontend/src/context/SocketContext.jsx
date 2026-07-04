import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { getMyNotifications, markAllAsRead as apiMarkAllRead } from '../services/announcementApi'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const socketRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    try {
      const res = await getMyNotifications()
      setNotifications(res.data.data.notifications)
      setUnreadCount(res.data.data.unreadCount)
    } catch {}
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null }
      setNotifications([]); setUnreadCount(0)
      return
    }

    // Load existing notifications from DB on login
    loadNotifications()

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socket.on('new_notification', (payload) => {
      // Build a notification-shaped object matching the DB format
      const incoming = {
        _id: `live_${Date.now()}`,
        announcementId: payload,   // payload IS the announcement data
        isRead: false,
        createdAt: payload.createdAt || new Date().toISOString(),
      }
      setNotifications(prev => [incoming, ...prev])
      setUnreadCount(prev => prev + 1)
    })

    socketRef.current = socket

    return () => { socket.disconnect(); socketRef.current = null }
  }, [isAuthenticated, token, loadNotifications])

  const markAllRead = async () => {
    try {
      await apiMarkAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {}
  }

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      notifications,
      unreadCount,
      markAllRead,
      loadNotifications,
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)