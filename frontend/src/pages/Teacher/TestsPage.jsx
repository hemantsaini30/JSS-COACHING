import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TeacherLayout from '../../layouts/TeacherLayout'
import { getMyTests, createTest, deleteTest, publishTest, closeTest } from '../../services/testApi'
import { getAllBatches } from '../../services/batchApi'

const statusColors = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-blue-100 text-blue-700',
  closed: 'bg-emerald-100 text-emerald-700',
}

const TestsPage = () => {
  const navigate = useNavigate()
  const [tests, setTests] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    title: '', subject: '', instructions: '',
    assignedBatches: [], liveDate: '', startTime: '09:00', endTime: '17:00', duration: 30,
  })

  const fetchTests = async () => {
    try {
      const [testsRes, batchRes] = await Promise.all([getMyTests(), getAllBatches()])
      setTests(testsRes.data.data)
      setBatches(batchRes.data.data)
    } catch { setError('Failed to load tests') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTests() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.assignedBatches.length) { setError('Assign at least one batch'); return }
    setSubmitting(true); setError('')
    try {
      const res = await createTest(form)
      setSuccess('Test created as draft')
      setShowModal(false)
      setForm({ title: '', subject: '', instructions: '', assignedBatches: [], liveDate: '', startTime: '09:00', endTime: '17:00', duration: 30 })
      navigate(`/teacher/tests/${res.data.data._id}/build`)
    } catch (err) { setError(err.response?.data?.message || 'Failed to create test') }
    finally { setSubmitting(false) }
  }

  const handleToggleBatch = (batchId) => {
    setForm(f => ({
      ...f,
      assignedBatches: f.assignedBatches.includes(batchId)
        ? f.assignedBatches.filter(id => id !== batchId)
        : [...f.assignedBatches, batchId],
    }))
  }

  const handlePublish = async (id) => {
    try {
      await publishTest(id)
      setSuccess('Test published — students can now see it')
      fetchTests()
    } catch (err) { setError(err.response?.data?.message || 'Failed to publish') }
  }

  const handleClose = async (id) => {
    if (!window.confirm('Close this test? Students will be able to see their results.')) return
    try {
      await closeTest(id)
      setSuccess('Test closed — results are now visible to students')
      fetchTests()
    } catch (err) { setError(err.response?.data?.message || 'Failed to close test') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this draft test?')) return
    try {
      await deleteTest(id)
      fetchTests()
    } catch (err) { setError(err.response?.data?.message || 'Failed to delete') }
  }

  return (
    <TeacherLayout>
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tests</h1>
            <p className="text-gray-500 text-sm mt-1">{tests.length} test{tests.length !== 1 ? 's' : ''} created</p>
          </div>
          <button onClick={() => { setShowModal(true); setError('') }}
            className="bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors">
            + Create test
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}

        {loading ? <p className="text-gray-400 text-sm">Loading tests...</p> :
          tests.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-lg font-medium mb-1">No tests yet</p>
              <p className="text-sm">Click "Create test" to build your first assessment</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tests.map(test => (
                <div key={test._id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-200 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{test.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[test.status]}`}>
                          {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{test.subject}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <span>📅 {test.liveDate} · {test.startTime}–{test.endTime}</span>
                        <span>⏱ {test.duration} min</span>
                        <span>❓ {test.questionCount} questions</span>
                        <span>📊 {test.totalMarks} marks</span>
                        {test.submissionCount > 0 && <span>✅ {test.submissionCount} submitted</span>}
                        {test.assignedBatches?.map(b => (
                          <span key={b._id} className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{b.name}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {test.status === 'draft' && (
                        <>
                          <button onClick={() => navigate(`/teacher/tests/${test._id}/build`)}
                            className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700">Build</button>
                          <button onClick={() => handlePublish(test._id)}
                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                            disabled={test.questionCount === 0}>Publish</button>
                          <button onClick={() => handleDelete(test._id)}
                            className="text-xs text-red-400 hover:text-red-600">Delete</button>
                        </>
                      )}
                      {test.status === 'published' && (
                        <>
                          <button onClick={() => navigate(`/teacher/tests/${test._id}/build`)}
                            className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200">View</button>
                          <button onClick={() => navigate(`/teacher/tests/${test._id}/analytics`)}
                            className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200">Analytics</button>
                          <button onClick={() => handleClose(test._id)}
                            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700">Close test</button>
                        </>
                      )}
                      {test.status === 'closed' && (
                        <button onClick={() => navigate(`/teacher/tests/${test._id}/analytics`)}
                          className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700">View results</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Create new test</h2>
                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-sm font-medium text-gray-700">Test title</label>
                      <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. Physics Unit 1 Test" required
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Subject</label>
                      <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                        placeholder="e.g. Physics" required
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Duration (minutes)</label>
                      <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                        min="5" max="180" required
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Live date</label>
                      <input type="date" value={form.liveDate} onChange={e => setForm({ ...form, liveDate: e.target.value })} required
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Start time</label>
                      <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">End time</label>
                      <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Instructions (optional)</label>
                    <textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })}
                      rows={2} placeholder="Any special instructions for students..."
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Assign to batches</label>
                    <div className="flex flex-wrap gap-2">
                      {batches.map(b => (
                        <button key={b._id} type="button"
                          onClick={() => handleToggleBatch(b._id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            form.assignedBatches.includes(b._id)
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                          }`}>
                          {b.name}
                        </button>
                      ))}
                    </div>
                    {form.assignedBatches.length === 0 && (
                      <p className="text-xs text-amber-600">Select at least one batch</p>
                    )}
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <div className="flex gap-3 justify-end mt-1">
                    <button type="button" onClick={() => { setShowModal(false); setError('') }}
                      className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={submitting}
                      className="px-6 py-2 bg-purple-700 text-white text-sm rounded-lg font-medium hover:bg-purple-800 disabled:opacity-50">
                      {submitting ? 'Creating...' : 'Create & build'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  )
}

export default TestsPage