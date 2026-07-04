import API from './authApi'

export const getAvailableTeachers  = ()         => API.get('/api/doubts/available-teachers')
export const getMySessionsStudent  = ()         => API.get('/api/doubts/sessions/mine')
export const getSessionsForTeacher = ()         => API.get('/api/doubts/sessions/teacher')
export const getMessages           = (id)       => API.get(`/api/doubts/sessions/${id}/messages`)
export const toggleSave            = (id)       => API.patch(`/api/doubts/sessions/${id}/save`)
export const resolveSession        = (id)       => API.patch(`/api/doubts/sessions/${id}/resolve`)

// FormData for both — multer receives the optional file field
export const createDoubSessions = (formData) =>
  API.post('/api/doubts/sessions', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const sendMessage = (id, formData) =>
  API.post(`/api/doubts/sessions/${id}/messages`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })