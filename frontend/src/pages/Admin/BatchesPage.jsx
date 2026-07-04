import { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { getAllBatches, createBatch, deleteBatch } from '../../services/batchApi'

const BatchesPage = () => {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', course: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const courses = ['JEE Mains', 'JEE Advanced', 'NEET', 'Class 12 Boards', 'Class 11 Boards', 'Foundation']

  const fetchBatches = async () => {
    try {
      const res = await getAllBatches()
      setBatches(res.data.data)
    } catch {
      setError('Failed to load batches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBatches() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createBatch(form)
      setForm({ name: '', course: '', description: '' })
      setShowForm(false)
      fetchBatches()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create batch')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete batch "${name}"?`)) return
    try {
      await deleteBatch(id)
      fetchBatches()
    } catch {
      setError('Failed to delete batch')
    }
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
            <p className="text-gray-500 text-sm mt-1">Manage all your coaching batches</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError('') }}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            {showForm ? 'Cancel' : '+ New batch'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Create new batch</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Batch name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. JEE Mains A"
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Course</label>
                <select
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select course</option>
                  {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Description (optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Morning batch"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create batch'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">Loading batches...</p>
        ) : batches.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-1">No batches yet</p>
            <p className="text-sm">Click "New batch" to create your first one</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <div key={batch._id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{batch.name}</h3>
                    <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1">
                      {batch.course}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${batch.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {batch.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {batch.description && (
                  <p className="text-sm text-gray-500 mb-3">{batch.description}</p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {new Date(batch.createdAt).toLocaleDateString('en-IN')}
                  </span>
                  <button
                    onClick={() => handleDelete(batch._id, batch.name)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default BatchesPage