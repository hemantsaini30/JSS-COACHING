import { useState, useEffect } from 'react'
import TeacherLayout from '../../layouts/TeacherLayout'
import { createAnnouncement, getMySentAnnouncements } from '../../services/announcementApi'
import { getAllBatches } from '../../services/batchApi'

const TeacherAnnouncementsPage = () => {
  const [form, setForm] = useState({ title: '', message: '', targetBatchIds: [] })
  const [batches, setBatches]   = useState([])
  const [sent, setSent]         = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [success, setSuccess]   = useState('')
  const [error, setError]       = useState('')

  const fetchData = async () => {
    try {
      const [bRes, sRes] = await Promise.all([getAllBatches(), getMySentAnnouncements()])
      setBatches(bRes.data.data)
      setSent(sRes.data.data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const toggleBatch = (id) => setForm(prev => ({
    ...prev,
    targetBatchIds: prev.targetBatchIds.includes(id)
      ? prev.targetBatchIds.filter(b => b !== id)
      : [...prev.targetBatchIds, id],
  }))

  const selectAll  = () => setForm(prev => ({ ...prev, targetBatchIds: batches.map(b => b._id) }))
  const clearAll   = () => setForm(prev => ({ ...prev, targetBatchIds: [] }))

  const handleSend = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) return setError('Title and message are required')
    if (!form.targetBatchIds.length) return setError('Select at least one batch')
    setSubmitting(true); setError(''); setSuccess('')
    try {
      await createAnnouncement({ title: form.title, message: form.message, targetType: 'batch', targetBatchIds: form.targetBatchIds })
      setForm({ title: '', message: '', targetBatchIds: [] })
      setSuccess('Announcement sent to selected batches')
      fetchData()
    } catch (err) { setError(err.response?.data?.message || 'Failed to send') }
    finally { setSubmitting(false) }
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <TeacherLayout>
      <div className="p-4 md:p-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">Send announcements to students in your batches</p>
        </div>

        {/* Compose */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-gray-800 mb-5">New announcement</h2>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
          {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}

          <form onSubmit={handleSend} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Title</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Test tomorrow, Class rescheduled"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Write your announcement..." rows={4}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Send to batches
                  {form.targetBatchIds.length > 0 && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {form.targetBatchIds.length} selected
                    </span>
                  )}
                </label>
                {batches.length > 1 && (
                  <div className="flex gap-2">
                    <button type="button" onClick={selectAll} className="text-xs text-purple-600 hover:text-purple-800 transition-colors">
                      All
                    </button>
                    <button type="button" onClick={clearAll} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {batches.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No batches assigned to you yet</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                  {batches.map(b => (
                    <label key={b._id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        form.targetBatchIds.includes(b._id)
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}>
                      <input type="checkbox" checked={form.targetBatchIds.includes(b._id)}
                        onChange={() => toggleBatch(b._id)}
                        className="accent-purple-600 w-4 h-4 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{b.name}</p>
                        <p className="text-xs text-gray-500">{b.course}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button type="submit" disabled={submitting || !form.targetBatchIds.length}
                className="bg-purple-700 text-white px-8 py-2 rounded-lg text-sm font-medium hover:bg-purple-800 disabled:opacity-50 transition-colors">
                {submitting
                  ? 'Sending...'
                  : `Send to ${form.targetBatchIds.length} batch${form.targetBatchIds.length !== 1 ? 'es' : ''}`
                }
              </button>
            </div>
          </form>
        </div>

        {/* History */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-4">Sent announcements</h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : sent.length === 0 ? (
            <p className="text-gray-400 text-sm">No announcements sent yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {sent.map(a => (
                <div key={a._id} className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="font-semibold text-gray-900">{a.title}</p>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{a.message}</p>
                  {a.targetBatchIds?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {a.targetBatchIds.map(b => (
                        <span key={b._id} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{b.name}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-3">{fmtDate(a.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  )
}

export default TeacherAnnouncementsPage