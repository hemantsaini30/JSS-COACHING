import API from './authApi'

export const getDashboardStats = () => API.get('/api/admin/stats')
export const getAllInquiries = (status = '') => API.get(`/api/admin/inquiries${status ? `?status=${status}` : ''}`)
export const updateInquiryStatus = (id, status) => API.patch(`/api/admin/inquiries/${id}`, { status })
export const deleteInquiry = (id) => API.delete(`/api/admin/inquiries/${id}`)