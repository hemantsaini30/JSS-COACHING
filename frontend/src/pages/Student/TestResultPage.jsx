import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTestResult } from '../../services/testApi'

const TestResultPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedQ, setExpandedQ] = useState(null)

  useEffect(() => {
    getTestResult(id)
      .then(res => setResult(res.data.data))
      .catch(err => setError(err.response?.data?.message || 'Results not available yet'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading results...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
      <p className="text-amber-600 font-medium text-center max-w-sm">{error}</p>
      <button onClick={() => navigate('/student/tests')} className="text-sm text-blue-600 hover:underline">← Back to tests</button>
    </div>
  )

  const { test, submission, review } = result
  const correct = review.filter(r => r.isCorrect).length
  const incorrect = review.filter(r => !r.isCorrect && r.selectedOption !== null).length
  const skipped = review.filter(r => r.selectedOption === null).length

  const getScoreColor = (pct) => pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-blue-800">Inst<span className="text-emerald-600">ora</span></span>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/student/tests/${id}/leaderboard`)} className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-200">🏆 Leaderboard</button>
          <button onClick={() => navigate('/student/tests')} className="text-sm text-gray-500 hover:text-gray-700">← Back to tests</button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Score Summary */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center mb-6">
          <p className="text-sm text-gray-500 mb-1">{test.title} · {test.subject}</p>
          <div className={`text-6xl font-bold mb-2 ${getScoreColor(submission.percentage)}`}>
            {submission.percentage}%
          </div>
          <p className="text-xl text-gray-700 mb-4">{submission.score} / {submission.totalMarks} marks</p>
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{correct}</p>
              <p className="text-gray-400 text-xs mt-0.5">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{incorrect}</p>
              <p className="text-gray-400 text-xs mt-0.5">Incorrect</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{skipped}</p>
              <p className="text-gray-400 text-xs mt-0.5">Skipped</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{Math.floor(submission.timeTaken / 60)}m {submission.timeTaken % 60}s</p>
              <p className="text-gray-400 text-xs mt-0.5">Time taken</p>
            </div>
          </div>
          {submission.status === 'auto_submitted' && (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg mt-4 inline-block">
              ⚠ This test was auto-submitted when time expired
            </p>
          )}
        </div>

        {/* Question Review */}
        <h2 className="font-bold text-gray-900 mb-4">Detailed review</h2>
        <div className="flex flex-col gap-4">
          {review.map((item, i) => (
            <div key={item.questionId}
              className={`bg-white border rounded-xl overflow-hidden ${item.isCorrect ? 'border-emerald-200' : item.selectedOption ? 'border-red-200' : 'border-gray-200'}`}>
              <div
                className={`px-5 py-4 cursor-pointer ${item.isCorrect ? 'bg-emerald-50' : item.selectedOption ? 'bg-red-50' : 'bg-gray-50'}`}
                onClick={() => setExpandedQ(expandedQ === i ? null : i)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`text-lg flex-shrink-0 mt-0.5`}>
                      {item.isCorrect ? '✅' : item.selectedOption ? '❌' : '⬜'}
                    </span>
                    <p className="text-sm font-medium text-gray-900">
                      <span className="text-gray-400 mr-1">Q{i + 1}.</span>
                      {item.questionText}
                    </p>
                  </div>
                  <span className="text-gray-400 text-xs flex-shrink-0">{expandedQ === i ? '▲' : '▼'}</span>
                </div>
              </div>

              {expandedQ === i && (
                <div className="px-5 py-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    {Object.entries(item.options).map(([key, val]) => {
                      const isCorrect = key === item.correctOption
                      const isSelected = key === item.selectedOption
                      const isWrong = isSelected && !isCorrect
                      return (
                        <div key={key} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                          isCorrect ? 'bg-emerald-50 border-emerald-300' :
                          isWrong ? 'bg-red-50 border-red-300' :
                          'bg-gray-50 border-gray-200'
                        }`}>
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isCorrect ? 'bg-emerald-500 text-white' :
                            isWrong ? 'bg-red-400 text-white' :
                            'bg-gray-200 text-gray-600'
                          }`}>{key}</span>
                          <span className={`text-sm ${isCorrect ? 'text-emerald-800 font-medium' : isWrong ? 'text-red-700' : 'text-gray-600'}`}>{val}</span>
                          {isCorrect && <span className="ml-auto text-xs text-emerald-600 font-medium">✓ Correct</span>}
                          {isWrong && <span className="ml-auto text-xs text-red-500">Your answer</span>}
                        </div>
                      )
                    })}
                  </div>
                  {item.selectedOption === null && (
                    <p className="text-xs text-gray-400 mb-3 italic">You skipped this question</p>
                  )}
                  {item.explanation && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">Explanation</p>
                      <p className="text-sm text-blue-800">{item.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TestResultPage