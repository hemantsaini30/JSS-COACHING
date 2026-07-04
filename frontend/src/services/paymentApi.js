import API from './authApi'

export const recordPayment = (data) => API.post('/api/payments', data)
export const getAllPayments = (params = '') => API.get(`/api/payments${params}`)
export const getMyPayments = () => API.get('/api/payments/my')
export const getPaymentsByFee = (feeId) => API.get(`/api/payments/fee/${feeId}`)
export const getStudentLedger = (studentId) => API.get(`/api/payments/ledger/${studentId}`)