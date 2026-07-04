import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { startTest, submitTest } from '../../services/testApi'

const ExamPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [examData, setExamData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentQ, setCurrentQ] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [autoSubmitted, setAutoSubmitted] = useState(false)

  useEffect(() => {
    startTest(id)
      .then(res => { setExamData(res.data.data); setLoading(false) })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to start test')
        setLoading(false)
      })
  }, [id])

  const handleAutoSubmit = useCallback(async () => {
    if (autoSubmitted || submitting) return
    setAutoSubmitted(true)
    setSubmitting(true)
    try {
      const answersArray = Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption }))
      await submitTest(id, { answers: answersArray, autoSubmit: true })
      navigate(`/student/tests/${id}/result?auto=1`)
    } catch { setSubmitting(false) }
  }, [answers, id, autoSubmitted, submitting])

  useEffect(() => {
    if (!examData?.submission?.startedAt || !examData?.test?.duration) return
    const durationSeconds = examData.test.duration * 60

    const tick = () => {
      const elapsed = (Date.now() - new Date(examData.submission.startedAt).getTime()) / 1000
      const remaining = Math.max(0, durationSeconds - elapsed)
      setTimeRemaining(remaining)
      if (remaining <= 0) handleAutoSubmit()
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [examData, handleAutoSubmit])

  const handleSubmit = async () => {
    if (!window.confirm(`Submit test? You have answered ${Object.keys(answers).length} of ${examData?.questions?.length} questions.`)) return
    setSubmitting(true)
    try {
      const answersArray = Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption }))
      await submitTest(id, { answers: answersArray, autoSubmit: false })
      navigate(`/student/tests/${id}/result`)
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed')
      setSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading test...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
      <p className="text-red-500 font-medium">{error}</p>
      <button onClick={() => navigate('/student/tests')} className="text-sm text-blue-600 hover:underline">← Back to tests</button>
    </div>
  )

  const { test, questions } = examData
  const question = questions[currentQ]
  const answeredCount = Object.keys(answers).length
  const isTimeLow = timeRemaining !== null && timeRemaining <= 60

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{test.title}</p>
          <p className="text-xs text-gray-400">{test.subject} · {questions.length} questions · {test.totalMarks} marks</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-2xl font-mono font-bold px-4 py-2 rounded-xl ${isTimeLow ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-800'}`}>
            {formatTime(timeRemaining)}
          </div>
          <button onClick={handleSubmit} disabled={submitting}
            className="bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-800 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        {/* Question */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Question {currentQ + 1} of {questions.length}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-gray-900 font-medium text-lg leading-relaxed mb-6">{question.questionText}</p>

          <div className="flex flex-col gap-3">
            {Object.entries(question.options).map(([key, val]) => {
              const isSelected = answers[question._id] === key
              return (
                <button key={key} onClick={() => setAnswers(prev => ({ ...prev, [question._id]: key }))}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all font-medium ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                  }`}>
                  <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-sm font-bold mr-3 ${isSelected ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {key}
                  </span>
                  {val}
                </button>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">
            ← Previous
          </button>
          <p className="text-xs text-gray-400">{answeredCount}/{questions.length} answered</p>
          <button onClick={() => setCurrentQ(q => Math.min(questions.length - 1, q + 1))} disabled={currentQ === questions.length - 1}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">
            Next →
          </button>
        </div>

        {/* Question grid */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Question navigator</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => {
              const isAnswered = !!answers[q._id]
              const isCurrent = i === currentQ
              return (
                <button key={q._id} onClick={() => setCurrentQ(i)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-colors ${
                    isCurrent ? 'bg-purple-600 text-white' :
                    isAnswered ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-100 rounded-sm"></span>Answered</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-gray-100 rounded-sm"></span>Not answered</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-purple-600 rounded-sm"></span>Current</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExamPage