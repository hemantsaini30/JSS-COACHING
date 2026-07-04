import API from './authApi'

export const getFeeSummary = () => API.get('/api/fees/summary')
export const getStudentFeeProfile = (studentId) => API.get(`/api/fees/student/${studentId}`)
export const addNextMonthFee = (studentId) => API.post(`/api/fees/student/${studentId}/next-month`)
export const updateFeePayment = (feeId, data) => API.patch(`/api/fees/${feeId}/payment`, data)
export const deleteFeeRecord = (id) => API.delete(`/api/fees/${id}`)
export const getMyFees = () => API.get('/api/fees/my')