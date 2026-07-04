import API from './authApi'

export const createAnnouncement      = (data) => API.post('/api/announcements', data)
export const getMyNotifications      = ()     => API.get('/api/announcements/my')
export const getMySentAnnouncements  = ()     => API.get('/api/announcements/sent')
export const markAsRead              = (id)   => API.patch(`/api/announcements/${id}/read`)
export const markAllAsRead           = ()     => API.patch('/api/announcements/read-all')