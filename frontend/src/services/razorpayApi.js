import API from './authApi'

export const createRazorpayOrder = (feeId) => API.post('/api/razorpay/create-order', { feeId })
export const verifyRazorpayPayment = (data) => API.post('/api/razorpay/verify-payment', data)
export const getOnlinePayments = () => API.get('/api/razorpay/online-payments')