import { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { getAllStudents, createStudent, deleteStudent } from '../../services/studentApi'
import { getAllBatches } from '../../services/batchApi'


const StudentsPage = () => {
  const [students, setStudents] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    fullName: '', username: '', password: '', parentPhone: '', batchId: '',
    monthlyFee: '', initialFeeStatus: 'unpaid'
  })

  const fetchAll = async () => {
    try {
      const [studRes, batRes] = await Promise.all([getAllStudents(), getAllBatches()])
      setStudents(studRes.data.data)
      setBatches(batRes.data.data)
    } catch {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createStudent(form)
      setForm({ fullName: '', username: '', password: '', parentPhone: '', batchId: '', monthlyFee: '', initialFeeStatus: 'unpaid' })
      setShowForm(false)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create student')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"? This will also delete their login account.`)) return
    try {
      await deleteStudent(id)
      fetchAll()
    } catch {
      setError('Failed to delete student')
    }
  }

  const filtered = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.userId?.username.toLowerCase().includes(search.toLowerCase()) ||
    s.batchId?.name.toLowerCase().includes(search.toLowerCase())
  )

  const feeColors = {
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-red-100 text-red-600',
    partial: 'bg-amber-100 text-amber-700',
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-500 text-sm mt-1">{students.length} students enrolled</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError('') }}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add student'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Add new student</h2>
            {batches.length === 0 ? (
              <p className="text-amber-600 text-sm">No batches found. Please create a batch first.</p>
            ) : (
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Full name</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Student's full name"
                    required
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="Login username"
                    required
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Initial password"
                    required
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Parent phone</label>
                  <input
                    type="tel"
                    value={form.parentPhone}
                    onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                    placeholder="Parent's mobile number"
                    required
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Monthly fee (₹)</label>
                    <input
                      type="number"
                      value={form.monthlyFee}
                      onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
                      placeholder="e.g. 3000"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">First month fee status</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, initialFeeStatus: 'unpaid' })}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          form.initialFeeStatus === 'unpaid'
                            ? 'bg-red-50 border-red-300 text-red-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Unpaid
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, initialFeeStatus: 'paid' })}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          form.initialFeeStatus === 'paid'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Paid
                      </button>
                    </div>
                  </div>
                  <label className="text-sm font-medium text-gray-700">Assign batch</label>
                  <select
                    value={form.batchId}
                    onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                    required
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select a batch</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.name} — {b.course}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add student'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username or batch..."
            className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading students...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-1">{search ? 'No students match your search' : 'No students yet'}</p>
            <p className="text-sm">{!search && 'Click "Add student" to enroll your first student'}</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Username</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Batch</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Parent phone</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Fee status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Joined</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, i) => (
                  <tr key={student._id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                          {student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-gray-900">{student.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{student.userId?.username}</td>
                    <td className="px-5 py-4">
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {student.batchId?.name}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{student.parentPhone}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${feeColors[student.feeStatus]}`}>
                        {student.feeStatus.charAt(0).toUpperCase() + student.feeStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {new Date(student.joiningDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleDelete(student._id, student.fullName)}
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

export default StudentsPage