import { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { getAllTeachers, createTeacher, deleteTeacher, resetTeacherPassword, assignTeacherBatches } from '../../services/teacherApi'
import { getAllBatches } from '../../services/batchApi'

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [resetModal, setResetModal] = useState(null)
  const [assignModal, setAssignModal] = useState(null)
  const [assignedIds, setAssignedIds] = useState([])
  const [assigning, setAssigning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ fullName: '', username: '', password: '', subject: '', phone: '' })
  const [newPassword, setNewPassword] = useState('')

  const fetchTeachers = async () => {
    try {
      const res = await getAllTeachers()
      setTeachers(res.data.data)
    } catch {
      setError('Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
    getAllBatches().then(res => setBatches(res.data.data)).catch(() => {})
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await createTeacher(form)
      setForm({ fullName: '', username: '', password: '', subject: '', phone: '' })
      setShowForm(false)
      setSuccess('Teacher account created successfully')
      fetchTeachers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create teacher')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete teacher "${name}"? They will lose access immediately.`)) return
    try {
      await deleteTeacher(id)
      fetchTeachers()
    } catch {
      setError('Failed to delete teacher')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await resetTeacherPassword(resetModal._id, newPassword)
      setResetModal(null)
      setNewPassword('')
      setSuccess(`Password reset for ${resetModal.fullName || resetModal.username}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setSubmitting(false)
    }
  }

  const openAssignModal = (teacher) => {
    setAssignModal(teacher)
    setAssignedIds((teacher.assignedBatches || []).map(b => b._id))
    setError('')
  }

  const toggleBatch = (batchId) => {
    setAssignedIds(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    )
  }

  const handleAssignBatches = async () => {
    setAssigning(true)
    setError('')
    try {
      await assignTeacherBatches(assignModal._id, assignedIds)
      setAssignModal(null)
      setSuccess(`Batches updated for ${assignModal.fullName || assignModal.username}`)
      fetchTeachers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign batches')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
            <p className="text-gray-500 text-sm mt-1">{teachers.length} teacher account{teachers.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError(''); setSuccess('') }}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add teacher'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Create teacher account</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Full name</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Teacher's full name" required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Username</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Login username" required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Initial password" required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Physics, Chemistry"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Phone (optional)</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Teacher's phone number"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2 flex justify-end">
                <button type="submit" disabled={submitting}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">Loading teachers...</p>
        ) : teachers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-1">No teachers yet</p>
            <p className="text-sm">Click "Add teacher" to create the first account</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Teacher</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Username</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Batches</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Added</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher, i) => (
                  <tr key={teacher._id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i === teachers.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold flex-shrink-0">
                          {(teacher.fullName || teacher.username).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{teacher.fullName || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{teacher.username}</td>
                    <td className="px-5 py-4">
                      {teacher.subject
                        ? <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full">{teacher.subject}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      {(teacher.assignedBatches || []).length === 0
                        ? <span className="text-gray-300 text-sm">None</span>
                        : <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                            {teacher.assignedBatches.length} {teacher.assignedBatches.length === 1 ? 'batch' : 'batches'}
                          </span>
                      }
                    </td>
                    <td className="px-5 py-4 text-gray-500">{teacher.phone || '—'}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {new Date(teacher.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openAssignModal(teacher)}
                          className="text-xs text-purple-500 hover:text-purple-700 transition-colors"
                        >
                          Assign batches
                        </button>
                        <button
                          onClick={() => { setResetModal(teacher); setNewPassword(''); setError('') }}
                          className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          Reset password
                        </button>
                        <button
                          onClick={() => handleDelete(teacher._id, teacher.fullName || teacher.username)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reset password modal — unchanged */}
        {resetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h2 className="font-semibold text-gray-900 mb-1">Reset password</h2>
              <p className="text-sm text-gray-500 mb-4">
                Setting new password for <strong>{resetModal.fullName || resetModal.username}</strong>
              </p>
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">New password</label>
                  <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters" required minLength={6}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setResetModal(null)}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-6 py-2 bg-blue-700 text-white text-sm rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Reset password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign batches modal — new */}
        {assignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h2 className="font-semibold text-gray-900 mb-1">Assign batches</h2>
              <p className="text-sm text-gray-500 mb-4">
                Select batches for <strong>{assignModal.fullName || assignModal.username}</strong>.
                They will only see and interact with these batches.
              </p>
              {batches.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No batches found. Create batches first.</p>
              ) : (
                <div className="flex flex-col gap-2 mb-5 max-h-64 overflow-y-auto pr-1">
                  {batches.map(batch => (
                    <label
                      key={batch._id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        assignedIds.includes(batch._id)
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={assignedIds.includes(batch._id)}
                        onChange={() => toggleBatch(batch._id)}
                        className="accent-purple-600 w-4 h-4 flex-shrink-0"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{batch.name}</p>
                        <p className="text-xs text-gray-500">{batch.course}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setAssignModal(null)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleAssignBatches} disabled={assigning}
                  className="px-6 py-2 bg-purple-700 text-white text-sm rounded-lg font-medium hover:bg-purple-800 transition-colors disabled:opacity-50">
                  {assigning ? 'Saving...' : `Save${assignedIds.length > 0 ? ` (${assignedIds.length})` : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default TeachersPage