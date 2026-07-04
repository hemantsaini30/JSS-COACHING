import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getMyProfile } from '../../services/studentApi'
import {
  getAvailableTeachers, createDoubSessions, getMySessionsStudent,
  getMessages, sendMessage as apiSend, toggleSave,
} from '../../services/doubtApi'

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d)
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const MessageBubble = ({ msg, onImageClick }) => {
  const isMe = msg.senderRole === 'student'
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-xs lg:max-w-sm rounded-2xl px-4 py-2.5 shadow-sm ${
        isMe ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
      }`}>
        {msg.type === 'image' && msg.fileUrl && (
          <img
            src={msg.fileUrl}
            alt="attachment"
            onClick={() => onImageClick(msg.fileUrl)}
            className="rounded-xl mb-1.5 max-w-full cursor-zoom-in hover:opacity-90 transition-opacity"
            style={{ maxHeight: 200, maxWidth: 240 }}
          />
        )}
        {msg.type === 'voice' && msg.fileUrl && (
          <audio controls src={msg.fileUrl} className="w-52 mb-1" />
        )}
        {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
        <p className={`text-xs mt-1 ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>{timeAgo(msg.createdAt)}</p>
      </div>
    </div>
  )
}

const StudentDoubtsPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [sessions, setSessions]             = useState([])
  const [activeSession, setActiveSession]   = useState(null)
  const [messages, setMessages]             = useState([])
  const [teachers, setTeachers]             = useState([])
  const [studentBatchId, setStudentBatchId] = useState(null)

  // new doubt modal
  const [showNew, setShowNew]               = useState(false)
  const [selTeachers, setSelTeachers]       = useState([])
  const [newText, setNewText]               = useState('')
  const [newImageFile, setNewImageFile]     = useState(null)
  const [newImgPrev, setNewImgPrev]         = useState(null)
  const [sendingDoubt, setSendingDoubt]     = useState(false)

  // reply
  const [replyText, setReplyText]           = useState('')
  const [replyImageFile, setReplyImageFile] = useState(null)
  const [replyImgPrev, setReplyImgPrev]     = useState(null)
  const [audioBlob, setAudioBlob]           = useState(null)
  const [recording, setRecording]           = useState(false)
  const [sendingReply, setSendingReply]     = useState(false)

  // lightbox
  const [lightboxSrc, setLightboxSrc]       = useState(null)

  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [mobileView, setMobileView] = useState('list')

  const pollingRef   = useRef(null)
  const msgEndRef    = useRef(null)
  const mediaRef     = useRef(null)
  const audioChunks  = useRef([])
  const replyFileRef = useRef(null)
  const newFileRef   = useRef(null)

  const fetchSessions = useCallback(async () => {
    try { const r = await getMySessionsStudent(); setSessions(r.data.data) } catch {}
  }, [])

  const fetchMessages = useCallback(async (id) => {
    try { const r = await getMessages(id); setMessages(r.data.data) } catch {}
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const [profRes, tchRes, sesRes] = await Promise.all([
          getMyProfile(), getAvailableTeachers(), getMySessionsStudent(),
        ])
        setStudentBatchId(profRes.data.data?.batchId?._id || profRes.data.data?.batchId)
        setTeachers(tchRes.data.data.teachers || tchRes.data.data)
        setSessions(sesRes.data.data)
      } catch { setError('Failed to load doubts') }
      finally { setLoading(false) }
    }
    init()
  }, [])

  useEffect(() => {
    clearInterval(pollingRef.current)
    if (activeSession) {
      fetchMessages(activeSession._id)
      pollingRef.current = setInterval(() => fetchMessages(activeSession._id), 6000)
    }
    return () => clearInterval(pollingRef.current)
  }, [activeSession, fetchMessages])

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Close lightbox on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setLightboxSrc(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const openSession = (s) => {
    setActiveSession(s); setMessages([]); setMobileView('chat')
    setReplyText(''); setReplyImageFile(null); setReplyImgPrev(null); setAudioBlob(null)
  }

  const onNewImg = (e) => {
    const f = e.target.files[0]; if (!f) return
    setNewImageFile(f); setNewImgPrev(URL.createObjectURL(f))
  }

  const onReplyImg = (e) => {
    const f = e.target.files[0]; if (!f) return
    setReplyImageFile(f); setReplyImgPrev(URL.createObjectURL(f))
  }

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunks.current = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = e => { if (e.data.size > 0) audioChunks.current.push(e.data) }
      rec.onstop = () => {
        setAudioBlob(new Blob(audioChunks.current, { type: 'audio/webm' }))
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRef.current = rec; rec.start(); setRecording(true)
    } catch { setError('Microphone access denied') }
  }

  const stopRec = () => {
    if (mediaRef.current && recording) { mediaRef.current.stop(); setRecording(false) }
  }

  const handleSendDoubt = async () => {
    if (!selTeachers.length) return setError('Select at least one teacher')
    if (!newText.trim() && !newImageFile) return setError('Type your doubt or attach an image')
    if (!studentBatchId) return setError('Could not determine your batch')
    setSendingDoubt(true); setError('')
    try {
      const fd = new FormData()
      selTeachers.forEach(id => fd.append('teacherIds', id))
      fd.append('batchId', studentBatchId)
      fd.append('text', newText.trim())
      fd.append('type', newImageFile ? 'image' : 'text')
      if (newImageFile) fd.append('file', newImageFile)
      await createDoubSessions(fd)
      setShowNew(false); setSelTeachers([]); setNewText('')
      setNewImageFile(null); setNewImgPrev(null)
      await fetchSessions()
    } catch (err) { setError(err.response?.data?.message || 'Failed to send doubt') }
    finally { setSendingDoubt(false) }
  }

  const handleSendReply = async () => {
    if (!activeSession || (!replyText.trim() && !replyImageFile && !audioBlob)) return
    setSendingReply(true); setError('')
    try {
      const fd = new FormData()
      if (audioBlob) {
        fd.append('type', 'voice'); fd.append('text', '')
        fd.append('file', audioBlob, 'voice-note.webm')
      } else if (replyImageFile) {
        fd.append('type', 'image'); fd.append('text', replyText.trim())
        fd.append('file', replyImageFile)
      } else {
        fd.append('type', 'text'); fd.append('text', replyText.trim())
      }
      await apiSend(activeSession._id, fd)
      setReplyText(''); setReplyImageFile(null); setReplyImgPrev(null); setAudioBlob(null)
      await fetchMessages(activeSession._id); await fetchSessions()
    } catch { setError('Failed to send message') }
    finally { setSendingReply(false) }
  }

  const handleToggleSave = async () => {
    if (!activeSession) return
    try {
      const r = await toggleSave(activeSession._id)
      setActiveSession(p => ({ ...p, isSavedByStudent: r.data.data.isSavedByStudent }))
      await fetchSessions()
    } catch { setError('Failed to update') }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] cursor-zoom-out p-4"
        >
          <img
            src={lightboxSrc}
            alt="full size"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 text-white text-3xl leading-none hover:text-gray-300 transition-colors"
          >×</button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 h-16">
        <span className="text-xl font-bold text-blue-800">Inst<span className="text-emerald-600">ora</span></span>
        <nav className="flex items-center gap-1">
          {[
            { label: 'Dashboard', path: '/student/dashboard' },
            { label: 'Tests',     path: '/student/tests' },
            { label: 'Doubts',    path: '/student/doubts', active: true },
          ].map(n => (
            <button key={n.path} onClick={() => navigate(n.path)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium ${n.active ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">{user?.username}</span>
          <button onClick={() => { logout(); navigate('/login') }} className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
        </div>
      </header>

      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">

        {/* Left panel — session list */}
        <div className={`flex-col w-full md:w-2/5 border-r border-gray-200 bg-white overflow-hidden
          ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h2 className="font-semibold text-gray-900">My Doubts</h2>
            <button onClick={() => { setShowNew(true); setError('') }}
              className="bg-purple-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-purple-800 transition-colors">
              + Ask doubt
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
            ) : sessions.length === 0 ? (
              <div className="text-center py-16 px-6">
                <p className="text-4xl mb-3">💬</p>
                <p className="font-medium text-gray-700">No doubts yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Ask doubt" to send your first question</p>
              </div>
            ) : sessions.map(s => (
              <div key={s._id} onClick={() => openSession(s)}
                className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition-colors
                  ${activeSession?._id === s._id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                  {(s.teacherId?.fullName || s.teacherId?.username || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    {/* Title is the doubt question — most prominent */}
                    <p className="font-medium text-gray-900 text-sm truncate">{s.title || 'Doubt'}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(s.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    To: {s.teacherId?.fullName || s.teacherId?.username} · {s.batchId?.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {s.lastMessage?.type === 'image' ? '📷 Image' : s.lastMessage?.type === 'voice' ? '🎤 Voice note' : s.lastMessage?.text || '—'}
                  </p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0 items-end pt-0.5">
                  {s.isSavedByStudent && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Saved</span>}
                  {s.status === 'resolved' && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Done</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — chat */}
        <div className={`flex-col flex-1 bg-gray-50 overflow-hidden
          ${mobileView === 'list' && !activeSession ? 'hidden md:flex' : 'flex'}`}>

          {!activeSession ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-5xl mb-4">💬</p>
                <p className="font-medium text-gray-600">Select a doubt to open chat</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
                <button onClick={() => { setMobileView('list'); setActiveSession(null) }}
                  className="md:hidden text-gray-500 p-1 hover:text-gray-700">←</button>
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                  {(activeSession.teacherId?.fullName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{activeSession.title || 'Doubt'}</p>
                  <p className="text-xs text-gray-400">
                    {activeSession.teacherId?.fullName || activeSession.teacherId?.username}
                    {activeSession.teacherId?.subject ? ` · ${activeSession.teacherId.subject}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {activeSession.status === 'resolved' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Resolved</span>
                  )}
                  <button onClick={handleToggleSave}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      activeSession.isSavedByStudent
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {activeSession.isSavedByStudent ? '✓ Saved' : 'Save doubt'}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {messages.length === 0
                  ? <p className="text-center text-gray-400 text-sm py-8">Loading messages...</p>
                  : messages.map(m => <MessageBubble key={m._id} msg={m} onImageClick={setLightboxSrc} />)
                }
                <div ref={msgEndRef} />
              </div>

              {error && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex-shrink-0">
                  <p className="text-xs text-red-500">{error}</p>
                </div>
              )}

              {replyImgPrev && (
                <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
                  <img src={replyImgPrev} alt="preview" className="h-14 w-14 object-cover rounded-lg" />
                  <button onClick={() => { setReplyImageFile(null); setReplyImgPrev(null) }} className="text-red-400 text-sm">✕ Remove</button>
                </div>
              )}

              {audioBlob && (
                <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
                  <audio controls src={URL.createObjectURL(audioBlob)} className="h-8 flex-1" />
                  <button onClick={() => setAudioBlob(null)} className="text-red-400 text-sm">✕</button>
                </div>
              )}

              <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-end gap-2 flex-shrink-0">
                <input type="file" accept="image/*" ref={replyFileRef} className="hidden" onChange={onReplyImg} />
                <button onClick={() => replyFileRef.current?.click()}
                  className="text-gray-400 hover:text-purple-600 transition-colors p-1.5 text-lg" title="Attach image">📎</button>
                <button
                  onMouseDown={startRec} onMouseUp={stopRec}
                  onTouchStart={startRec} onTouchEnd={stopRec}
                  className={`p-1.5 text-lg transition-colors ${recording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-purple-600'}`}
                  title="Hold to record voice">🎤</button>
                <textarea
                  value={replyText} onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply() } }}
                  placeholder={recording ? 'Recording...' : 'Type a message...'}
                  rows={1}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <button onClick={handleSendReply}
                  disabled={sendingReply || (!replyText.trim() && !replyImageFile && !audioBlob)}
                  className="bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-800 disabled:opacity-50 transition-colors flex-shrink-0">
                  {sendingReply ? '...' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Doubt Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold text-gray-900 mb-1">Ask a doubt</h2>
            <p className="text-sm text-gray-500 mb-4">Each doubt opens as a separate chat thread</p>

            {teachers.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No teachers assigned to your batch yet</p>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Send to</p>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                    {teachers.map(t => (
                      <label key={t._id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selTeachers.includes(t._id) ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                        <input type="checkbox" checked={selTeachers.includes(t._id)}
                          onChange={() => setSelTeachers(p => p.includes(t._id) ? p.filter(x => x !== t._id) : [...p, t._id])}
                          className="accent-purple-600 w-4 h-4 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{t.fullName}</p>
                          <p className="text-xs text-gray-500">
                            {t.subject && <span>{t.subject} · </span>}
                            {t.sharedBatches?.map(b => b.name).join(', ')}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Your doubt</p>
                  <textarea value={newText} onChange={e => setNewText(e.target.value)}
                    placeholder="Describe your doubt in detail..." rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                </div>

                <div className="mb-4">
                  <input type="file" accept="image/*" ref={newFileRef} className="hidden" onChange={onNewImg} />
                  {newImgPrev ? (
                    <div className="flex items-center gap-3">
                      <img src={newImgPrev} alt="preview" className="h-20 w-20 object-cover rounded-lg" />
                      <button onClick={() => { setNewImageFile(null); setNewImgPrev(null) }} className="text-sm text-red-400 hover:text-red-600">✕ Remove</button>
                    </div>
                  ) : (
                    <button onClick={() => newFileRef.current?.click()}
                      className="text-sm text-purple-600 border border-dashed border-purple-300 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                      📷 Attach image (optional)
                    </button>
                  )}
                </div>
              </>
            )}

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowNew(false); setError(''); setSelTeachers([]); setNewText(''); setNewImageFile(null); setNewImgPrev(null) }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSendDoubt} disabled={sendingDoubt || !selTeachers.length}
                className="px-6 py-2 bg-purple-700 text-white text-sm rounded-lg font-medium hover:bg-purple-800 disabled:opacity-50 transition-colors">
                {sendingDoubt ? 'Sending...' : `Send to ${selTeachers.length || ''} teacher${selTeachers.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentDoubtsPage