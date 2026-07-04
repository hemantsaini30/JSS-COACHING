import { useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { createAnnouncement, getMySentAnnouncements } from '../../services/announcementApi'

const TARGET_OPTIONS = [
  { value: 'everyone',     label: 'Everyone',      desc: 'All teachers and students',  color: 'blue' },
  { value: 'all_teachers', label: 'Teachers only',  desc: 'All teacher accounts',       color: 'purple' },
  { value: 'all_students', label: 'Students only',  desc: 'All student accounts',       color: 'emerald' },
]

const TARGET_BADGE = {
  everyone:     'bg-blue-100 text-blue-700',
  all_teachers: 'bg-purple-100 text-purple-700',
  all_students: 'bg-emerald-100 text-emerald-700',
}

const TARGET_LABEL = {
  everyone:     '📢 Everyone',
  all_teachers: '🎓 Teachers only',
  all_students: '👤 Students only',
}

const AdminAnnouncementsPage = () => {
  const [form, setForm] = useState({ title: '', message: '', targetType: 'everyone' })
  const [sent, setSent]         = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [success, setSuccess]   = useState('')
  const [error, setError]       = useState('')

  const fetchSent = async () => {
    try { const r = await getMySentAnnouncements(); setSent(r.data.data) }
    catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchSent() }, [])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) return setError('Title and message are required')
    setSubmitting(true); setError(''); setSuccess('')
    try {
      await createAnnouncement({ title: form.title, message: form.message, targetType: form.targetType })
      setForm({ title: '', message: '', targetType: 'everyone' })
      setSuccess('Announcement sent successfully')
      fetchSent()
    } catch (err) { setError(err.response?.data?.message || 'Failed to send') }
    finally { setSubmitting(false) }
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">Broadcast messages to teachers, students, or everyone</p>
        </div>

        {/* Compose card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-gray-800 mb-5">New announcement</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>
          )}

          <form onSubmit={handleSend} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Title</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Holiday notice, Exam schedule update"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Write your announcement here..." rows={4}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Send to</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TARGET_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setForm({ ...form, targetType: opt.value })}
                    className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                      form.targetType === opt.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                    <span className={`text-sm font-semibold ${form.targetType === opt.value ? 'text-blue-700' : 'text-gray-800'}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button type="submit" disabled={submitting}
                className="bg-blue-700 text-white px-8 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors">
                {submitting ? 'Sending...' : `Send to ${TARGET_OPTIONS.find(o => o.value === form.targetType)?.label}`}
              </button>
            </div>
          </form>
        </div>

        {/* Sent history */}
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
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{a.title}</p>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{a.message}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${TARGET_BADGE[a.targetType] || 'bg-gray-100 text-gray-600'}`}>
                      {TARGET_LABEL[a.targetType] || a.targetType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">{fmtDate(a.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminAnnouncementsPage