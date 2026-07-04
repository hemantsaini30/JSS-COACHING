import { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { getAllInquiries, updateInquiryStatus, deleteInquiry } from '../../services/adminApi'

const InquiriesPage = () => {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')

  const fetchInquiries = async () => {
    try {
      const res = await getAllInquiries(filter)
      setInquiries(res.data.data)
    } catch {
      setError('Failed to load inquiries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInquiries() }, [filter])

  const handleStatusChange = async (id, status) => {
    try {
      await updateInquiryStatus(id, status)
      fetchInquiries()
    } catch {
      setError('Failed to update status')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete inquiry from "${name}"?`)) return
    try {
      await deleteInquiry(id)
      fetchInquiries()
    } catch {
      setError('Failed to delete inquiry')
    }
  }

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    contacted: 'bg-blue-100 text-blue-700',
    resolved: 'bg-emerald-100 text-emerald-700',
  }

  const counts = {
    all: inquiries.length,
    pending: inquiries.filter(i => i.status === 'pending').length,
    contacted: inquiries.filter(i => i.status === 'contacted').length,
    resolved: inquiries.filter(i => i.status === 'resolved').length,
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
          <p className="text-gray-500 text-sm mt-1">Walk-in and online enquiries from prospective students</p>
        </div>

        <div className="flex gap-2 mb-6">
          {['', 'pending', 'contacted', 'resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === s
                  ? 'bg-blue-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {s === '' ? counts.all : counts[s]}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">Loading inquiries...</p>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-1">No inquiries yet</p>
            <p className="text-sm">Inquiries from the landing page form will appear here</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Course</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Received</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inq, i) => (
                  <tr key={inq._id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i === inquiries.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold flex-shrink-0">
                          {inq.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{inq.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{inq.phone}</td>
                    <td className="px-5 py-4">
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {inq.targetCourse}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {new Date(inq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={inq.status}
                        onChange={(e) => handleStatusChange(inq._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusColors[inq.status]}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleDelete(inq._id, inq.name)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default InquiriesPage