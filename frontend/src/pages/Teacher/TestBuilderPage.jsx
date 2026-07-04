import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TeacherLayout from '../../layouts/TeacherLayout'
import {
  getTestById, addQuestion, addBulkQuestions,
  deleteQuestion, publishTest, generateQuestionsAI,
} from '../../services/testApi'

const statusColors = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-blue-100 text-blue-700',
  closed: 'bg-emerald-100 text-emerald-700',
}

const difficultyColors = {
  easy: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  hard: 'bg-red-50 text-red-600',
}

const TestBuilderPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [test, setTest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('manual')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const [manualForm, setManualForm] = useState({
    questionText: '', options: { A: '', B: '', C: '', D: '' },
    correctOption: 'A', explanation: '', difficulty: 'medium', marks: 1,
  })

  const [aiForm, setAiForm] = useState({ topic: '', grade: '', difficulty: 'medium', context: '' })
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiQuestions, setAiQuestions] = useState([])
  const [selectedAiIds, setSelectedAiIds] = useState(new Set())

  const fetchTest = async () => {
    try {
      const res = await getTestById(id)
      setTest(res.data.data.test)
      setQuestions(res.data.data.questions)
    } catch { setError('Failed to load test') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTest() }, [id])

  const handleAddManual = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await addQuestion(id, manualForm)
      setManualForm({ questionText: '', options: { A: '', B: '', C: '', D: '' }, correctOption: 'A', explanation: '', difficulty: 'medium', marks: 1 })
      setSuccess('Question added')
      fetchTest()
    } catch (err) { setError(err.response?.data?.message || 'Failed to add question') }
    finally { setSaving(false) }
  }

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return
    try {
      await deleteQuestion(id, qId)
      fetchTest()
    } catch { setError('Failed to delete question') }
  }

  const handleGenerate = async (append = false) => {
    if (!aiForm.topic || !aiForm.grade || !aiForm.difficulty) {
      setError('Topic, grade and difficulty are required'); return
    }
    setAiGenerating(true); setError('')
    try {
      const res = await generateQuestionsAI({ ...aiForm, count: 10 })
      if (append) {
        setAiQuestions(prev => [...prev, ...res.data.data])
      } else {
        setAiQuestions(res.data.data)
        setSelectedAiIds(new Set())
      }
      setSuccess(`${res.data.count} questions generated`)
    } catch (err) { setError(err.response?.data?.message || 'AI generation failed. Check your GROQ_API_KEY.') }
    finally { setAiGenerating(false) }
  }

  const toggleAiSelect = (idx) => {
    setSelectedAiIds(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const handleAddSelected = async () => {
    if (selectedAiIds.size === 0) { setError('Select at least one question'); return }
    setSaving(true); setError('')
    try {
      const toAdd = [...selectedAiIds].map(idx => aiQuestions[idx])
      await addBulkQuestions(id, { questions: toAdd })
      setAiQuestions(prev => prev.filter((_, idx) => !selectedAiIds.has(idx)))
      setSelectedAiIds(new Set())
      setSuccess(`${toAdd.length} questions added to test`)
      fetchTest()
    } catch (err) { setError(err.response?.data?.message || 'Failed to add questions') }
    finally { setSaving(false) }
  }

  const handlePublish = async () => {
    try {
      await publishTest(id)
      setSuccess('Test published! Students can now see it.')
      fetchTest()
    } catch (err) { setError(err.response?.data?.message || 'Failed to publish') }
  }

  if (loading) return <TeacherLayout><div className="p-8 text-gray-400">Loading...</div></TeacherLayout>

  const canEdit = test?.status !== 'closed'

  return (
    <TeacherLayout>
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <button onClick={() => navigate('/teacher/tests')} className="text-xs text-gray-400 hover:text-gray-600 mb-1">← Back to tests</button>
            <h1 className="text-xl font-bold text-gray-900">{test?.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">{test?.subject}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[test?.status]}`}>
                {test?.status?.charAt(0).toUpperCase() + test?.status?.slice(1)}
              </span>
              <span className="text-xs text-gray-400">{questions.length} questions · {test?.totalMarks} marks · {test?.duration} min</span>
            </div>
          </div>
          <div className="flex gap-2">
            {test?.status === 'draft' && (
              <button onClick={handlePublish} disabled={questions.length === 0}
                className="bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-800 disabled:opacity-40">
                Publish test
              </button>
            )}
            {test?.status !== 'draft' && (
              <button onClick={() => navigate(`/teacher/tests/${id}/analytics`)}
                className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200">
                View analytics
              </button>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Question list */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-3">
              Questions ({questions.length})
            </h2>
            {questions.length === 0 ? (
              <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-lg mb-1">No questions yet</p>
                <p className="text-sm">Add questions using the panel on the right</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {questions.map((q, i) => (
                  <div key={q._id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="text-gray-400 mr-1">Q{i + 1}.</span>
                        {q.questionText}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[q.difficulty]}`}>{q.difficulty}</span>
                        {canEdit && (
                          <button onClick={() => handleDeleteQuestion(q._id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(q.options).map(([key, val]) => (
                        <p key={key} className={`text-xs px-2 py-1 rounded ${key === q.correctOption ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-500'}`}>
                          {key}: {val}
                        </p>
                      ))}
                    </div>
                    {q.explanation && <p className="text-xs text-gray-400 mt-2 italic">{q.explanation}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Add questions */}
          {canEdit && (
            <div>
              <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setActiveTab('manual')}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  Manual entry
                </button>
                <button onClick={() => setActiveTab('ai')}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'ai' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  ✨ AI generate
                </button>
              </div>

              {activeTab === 'manual' && (
                <form onSubmit={handleAddManual} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Question</label>
                    <textarea value={manualForm.questionText}
                      onChange={e => setManualForm({ ...manualForm, questionText: e.target.value })}
                      rows={3} required placeholder="Enter question text..."
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                  </div>
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div key={opt} className="flex items-center gap-2">
                      <button type="button" onClick={() => setManualForm({ ...manualForm, correctOption: opt })}
                        className={`w-8 h-8 rounded-full text-xs font-bold border-2 flex-shrink-0 transition-colors ${manualForm.correctOption === opt ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-500 border-gray-300 hover:border-emerald-400'}`}>
                        {opt}
                      </button>
                      <input type="text" value={manualForm.options[opt]}
                        onChange={e => setManualForm({ ...manualForm, options: { ...manualForm.options, [opt]: e.target.value } })}
                        placeholder={`Option ${opt}`} required
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                  ))}
                  <p className="text-xs text-gray-400">Click the letter circle to mark the correct answer</p>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Explanation (optional)</label>
                    <textarea value={manualForm.explanation}
                      onChange={e => setManualForm({ ...manualForm, explanation: e.target.value })}
                      rows={2} placeholder="Why is this the correct answer?"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs font-medium text-gray-600">Difficulty</label>
                      <select value={manualForm.difficulty} onChange={e => setManualForm({ ...manualForm, difficulty: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 w-24">
                      <label className="text-xs font-medium text-gray-600">Marks</label>
                      <input type="number" value={manualForm.marks} min="1" max="10"
                        onChange={e => setManualForm({ ...manualForm, marks: Number(e.target.value) })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                  </div>
                  <button type="submit" disabled={saving}
                    className="w-full py-2.5 bg-purple-700 text-white text-sm rounded-lg font-medium hover:bg-purple-800 disabled:opacity-50">
                    {saving ? 'Adding...' : 'Add question'}
                  </button>
                </form>
              )}

              {activeTab === 'ai' && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex flex-col gap-3 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Topic</label>
                        <input type="text" value={aiForm.topic} onChange={e => setAiForm({ ...aiForm, topic: e.target.value })}
                          placeholder="e.g. Newton's Laws" required
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Grade / Level</label>
                        <input type="text" value={aiForm.grade} onChange={e => setAiForm({ ...aiForm, grade: e.target.value })}
                          placeholder="e.g. Class 11" required
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Difficulty</label>
                      <select value={aiForm.difficulty} onChange={e => setAiForm({ ...aiForm, difficulty: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Context / source material (optional)</label>
                      <textarea value={aiForm.context} onChange={e => setAiForm({ ...aiForm, context: e.target.value })}
                        rows={2} placeholder="Paste syllabus or specific content..."
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleGenerate(false)} disabled={aiGenerating}
                        className="flex-1 py-2 bg-purple-700 text-white text-sm rounded-lg font-medium hover:bg-purple-800 disabled:opacity-50">
                        {aiGenerating ? 'Generating...' : '✨ Generate 10 questions'}
                      </button>
                      {aiQuestions.length > 0 && (
                        <button onClick={() => handleGenerate(true)} disabled={aiGenerating}
                          className="py-2 px-4 bg-purple-100 text-purple-700 text-sm rounded-lg font-medium hover:bg-purple-200 disabled:opacity-50">
                          + More
                        </button>
                      )}
                    </div>
                  </div>

                  {aiQuestions.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700">{aiQuestions.length} generated — select to add</p>
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedAiIds(new Set(aiQuestions.map((_, i) => i)))}
                            className="text-xs text-purple-600 hover:text-purple-800">Select all</button>
                          <button onClick={() => setSelectedAiIds(new Set())}
                            className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto mb-3">
                        {aiQuestions.map((q, idx) => (
                          <div key={idx}
                            onClick={() => toggleAiSelect(idx)}
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${selectedAiIds.has(idx) ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-200'}`}>
                            <div className="flex items-start gap-2">
                              <div className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${selectedAiIds.has(idx) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                                {selectedAiIds.has(idx) && <span className="text-white text-xs">✓</span>}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-900 mb-2">{q.questionText}</p>
                                <div className="grid grid-cols-2 gap-1">
                                  {Object.entries(q.options).map(([key, val]) => (
                                    <p key={key} className={`text-xs px-2 py-1 rounded ${key === q.correctOption ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-500'}`}>
                                      {key}: {val}
                                    </p>
                                  ))}
                                </div>
                                {q.explanation && <p className="text-xs text-gray-400 mt-1 italic">{q.explanation}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button onClick={handleAddSelected} disabled={saving || selectedAiIds.size === 0}
                        className="w-full py-2.5 bg-emerald-600 text-white text-sm rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
                        {saving ? 'Adding...' : `Add selected (${selectedAiIds.size}) to test`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  )
}

export default TestBuilderPage