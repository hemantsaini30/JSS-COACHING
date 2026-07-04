import { useEffect, useState, useRef, useCallback } from 'react'
import TeacherLayout from '../../layouts/TeacherLayout'
import {
  getSessionsForTeacher, getMessages, sendMessage as apiSend,
  toggleSave, resolveSession,
} from '../../services/doubtApi'

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d)
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const MessageBubble = ({ msg, onImageClick }) => {
  const isMe = msg.senderRole === 'teacher'
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

const TeacherDoubtsPage = () => {
  const [grouped, setGrouped]             = useState([])
  const [activeBatch, setActiveBatch]     = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages]           = useState([])

  const [replyText, setReplyText]           = useState('')
  const [replyImageFile, setReplyImageFile] = useState(null)
  const [replyImgPrev, setReplyImgPrev]     = useState(null)
  const [audioBlob, setAudioBlob]           = useState(null)
  const [recording, setRecording]           = useState(false)
  const [sendingReply, setSendingReply]     = useState(false)

  const [lightboxSrc, setLightboxSrc]       = useState(null)

  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [mobileView, setMobileView] = useState('sessions')

  const pollingRef   = useRef(null)
  const msgEndRef    = useRef(null)
  const mediaRef     = useRef(null)
  const audioChunks  = useRef([])
  const fileInputRef = useRef(null)

  const fetchGrouped = useCallback(async () => {
    try { const r = await getSessionsForTeacher(); setGrouped(r.data.data) } catch {}
  }, [])

  const fetchMessages = useCallback(async (id) => {
    try { const r = await getMessages(id); setMessages(r.data.data) } catch {}
  }, [])

  useEffect(() => { fetchGrouped().finally(() => setLoading(false)) }, [fetchGrouped])

  useEffect(() => {
    clearInterval(pollingRef.current)
    if (activeSession) {
      fetchMessages(activeSession._id)
      pollingRef.current = setInterval(() => fetchMessages(activeSession._id), 6000)
    }
    return () => clearInterval(pollingRef.current)
  }, [activeSession, fetchMessages])

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setLightboxSrc(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const allSessions = grouped.flatMap(g => g.sessions)
  const filteredSessions = activeBatch
    ? allSessions.filter(s => s.batchId?._id?.toString() === activeBatch)
    : allSessions
  const batches = grouped.map(g => g.batch)

  const openSession = (s) => {
    setActiveSession(s); setMessages([]); setMobileView('chat')
    setReplyText(''); setReplyImageFile(null); setReplyImgPrev(null); setAudioBlob(null)
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
      await fetchMessages(activeSession._id); await fetchGrouped()
    } catch { setError('Failed to send') }
    finally { setSendingReply(false) }
  }

  const handleToggleSave = async () => {
    if (!activeSession) return
    try {
      const r = await toggleSave(activeSession._id)
      setActiveSession(p => ({ ...p, isSavedByTeacher: r.data.data.isSavedByTeacher }))
      await fetchGrouped()
    } catch { setError('Failed to update') }
  }

  const handleResolve = async () => {
    if (!activeSession || !window.confirm('Mark this doubt as resolved?')) return
    try {
      await resolveSession(activeSession._id)
      setActiveSession(p => ({ ...p, status: 'resolved' }))
      await fetchGrouped()
    } catch { setError('Failed to resolve') }
  }

  return (
    <TeacherLayout>

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

      <div className="flex h-[calc(100vh-53px)] md:h-screen overflow-hidden">

        {/* Left: session list */}
        <div className={`flex-col bg-white border-r border-gray-200 overflow-hidden
          w-full md:w-80 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>

          <div className="p-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="font-semibold text-gray-900 mb-3">Doubts</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveBatch(null)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  !activeBatch ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                All ({allSessions.length})
              </button>
              {batches.map(b => (
                <button key={b?._id} onClick={() => setActiveBatch(b?._id?.toString())}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    activeBatch === b?._id?.toString() ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {b?.name} ({grouped.find(g => g.batch?._id?.toString() === b?._id?.toString())?.sessions.length || 0})
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-sm text-gray-400">No doubts yet</p>
              </div>
            ) : filteredSessions.map(s => (
              <div key={s._id} onClick={() => openSession(s)}
                className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition-colors
                  ${activeSession?._id === s._id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {(s.studentId?.fullName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    {/* Title — the doubt question */}
                    <p className="font-medium text-gray-900 text-sm truncate">{s.title || 'Doubt'}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(s.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {s.studentId?.fullName} · {s.batchId?.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {s.lastMessage?.type === 'image' ? '📷 Image' : s.lastMessage?.type === 'voice' ? '🎤 Voice note' : s.lastMessage?.text || '—'}
                  </p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0 items-end pt-0.5">
                  {s.isSavedByTeacher && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Saved</span>}
                  {s.status === 'resolved' && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Done</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: chat */}
        <div className={`flex-col flex-1 bg-gray-50 overflow-hidden
          ${mobileView === 'sessions' && !activeSession ? 'hidden md:flex' : 'flex'}`}>

          {!activeSession ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-5xl mb-4">💬</p>
                <p className="font-medium text-gray-600">Select a student doubt to reply</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
                <button onClick={() => { setMobileView('sessions'); setActiveSession(null) }}
                  className="md:hidden text-gray-500 p-1">←</button>
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {(activeSession.studentId?.fullName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{activeSession.title || 'Doubt'}</p>
                  <p className="text-xs text-gray-400">{activeSession.studentId?.fullName} · {activeSession.batchId?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {activeSession.status === 'resolved' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Resolved</span>
                  )}
                  <button onClick={handleToggleSave}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      activeSession.isSavedByTeacher
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {activeSession.isSavedByTeacher ? '✓ Saved' : 'Save'}
                  </button>
                  {activeSession.status !== 'resolved' && (
                    <button onClick={handleResolve}
                      className="text-xs px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors">
                      Mark resolved
                    </button>
                  )}
                </div>
              </div>

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
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={onReplyImg} />
                <button onClick={() => fileInputRef.current?.click()}
                  className="text-gray-400 hover:text-purple-600 transition-colors p-1.5 text-lg">📎</button>
                <button
                  onMouseDown={startRec} onMouseUp={stopRec}
                  onTouchStart={startRec} onTouchEnd={stopRec}
                  className={`p-1.5 text-lg transition-colors ${recording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-purple-600'}`}>
                  🎤
                </button>
                <textarea
                  value={replyText} onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply() } }}
                  placeholder={recording ? 'Recording...' : 'Type a reply...'}
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
    </TeacherLayout>
  )
}

export default TeacherDoubtsPage