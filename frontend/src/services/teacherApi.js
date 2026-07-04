import API from './authApi'

export const getAllTeachers = () => API.get('/api/teachers')
export const createTeacher = (data) => API.post('/api/teachers', data)
export const deleteTeacher = (id) => API.delete(`/api/teachers/${id}`)
export const resetTeacherPassword = (id, newPassword) =>
  API.patch(`/api/teachers/${id}/reset-password`, { newPassword })
export const assignTeacherBatches = (id, batchIds) =>
  API.patch(`/api/teachers/${id}/batches`, { batchIds })