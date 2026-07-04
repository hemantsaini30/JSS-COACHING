import API from './authApi'

export const getAllStudents = () => API.get('/api/students')
export const createStudent = (data) => API.post('/api/students', data)
export const deleteStudent = (id) => API.delete(`/api/students/${id}`)
export const getMyProfile = () => API.get('/api/students/me')