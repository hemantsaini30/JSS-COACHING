import API from './authApi'

export const getAllBatches = () => API.get('/api/batches')
export const createBatch = (data) => API.post('/api/batches', data)
export const deleteBatch = (id) => API.delete(`/api/batches/${id}`)