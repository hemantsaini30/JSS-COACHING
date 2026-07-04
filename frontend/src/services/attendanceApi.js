import API from './authApi'

export const markAttendance             = (data)                   => API.post('/api/attendance', data)
export const getAttendanceByBatchAndDate = (batchId, date)         => API.get(`/api/attendance?batchId=${batchId}&date=${date}`)
export const getAttendanceByStudent     = (studentId)              => API.get(`/api/attendance/student/${studentId}`)
export const getBatchAttendanceSummary  = (batchId)                => API.get(`/api/attendance/summary?batchId=${batchId}`)
export const getDatewiseAttendance      = (batchId)                => API.get(`/api/attendance/datewise?batchId=${batchId}`)
export const getMyCalendar              = (year, month)            => API.get(`/api/attendance/my-calendar?year=${year}&month=${month}`)
export const getStudentCalendar         = (studentId, batchId, y, m) => API.get(`/api/attendance/student-calendar?studentId=${studentId}&batchId=${batchId}&year=${y}&month=${m}`)
export const getBatchCalendar           = (batchId, year, month)   => API.get(`/api/attendance/batch-calendar?batchId=${batchId}&year=${year}&month=${month}`)