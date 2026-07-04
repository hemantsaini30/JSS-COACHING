import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TeacherLayout from '../../layouts/TeacherLayout'
import { getTestAnalytics } from '../../services/testApi'

const TestAnalyticsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getTestAnalytics(id)
      .then(res => setData(res.data.data))
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <TeacherLayout><div className="p-8 text-gray-400">Loading analytics...</div></TeacherLayout>
  if (error) return <TeacherLayout><div className="p-8 text-red-500">{error}</div></TeacherLayout>

  const { test, overview, scoreDistribution, questionAnalysis, studentResults } = data

  return (
    <TeacherLayout>
      <div className="p-4 md:p-8">
        <button onClick={() => navigate('/teacher/tests')} className="text-xs text-gray-400 hover:text-gray-600 mb-3">← Back to tests</button>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
          <p className="text-gray-500 text-sm">{test.subject} · {test.questionCount} questions · {test.totalMarks} marks · {test.duration} min</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Assigned', value: overview.totalAssigned, color: 'text-blue-700' },
            { label: 'Submitted', value: overview.submitted, color: 'text-emerald-600' },
            { label: 'Not submitted', value: overview.notSubmitted, color: 'text-red-500' },
            { label: 'Avg score', value: `${overview.averagePercentage}%`, color: 'text-purple-700' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Score distribution</h2>
            <div className="flex flex-col gap-3">
              {scoreDistribution.map(d => {
                const pct = overview.submitted === 0 ? 0 : Math.round((d.count / overview.submitted) * 100)
                return (
                  <div key={d.range} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16">{d.range}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-purple-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-8 text-right">{d.count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Hardest questions</h2>
            <div className="flex flex-col gap-3">
              {questionAnalysis.slice(0, 5).map((q, i) => (
                <div key={q.questionId} className="flex items-start gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-700">{q.questionText}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${q.correctRate >= 60 ? 'bg-emerald-400' : q.correctRate >= 30 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${q.correctRate}%` }} />
                      </div>
                      <span className={`text-xs font-medium ${q.correctRate >= 60 ? 'text-emerald-600' : q.correctRate >= 30 ? 'text-amber-600' : 'text-red-500'}`}>
                        {q.correctRate}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {studentResults.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-800">Student results</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Time taken</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {studentResults.map((s, i) => (
                  <tr key={s.username} className={`border-b border-gray-50 hover:bg-gray-50 ${i === studentResults.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-3 text-gray-400 font-medium">#{i + 1}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{s.fullName}</p>
                      <p className="text-xs text-gray-400">{s.username}</p>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">{s.score}/{s.totalMarks}</td>
                    <td className="px-5 py-3">
                      <span className={`font-bold ${s.percentage >= 75 ? 'text-emerald-600' : s.percentage >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                        {s.percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{Math.floor(s.timeTaken / 60)}m {s.timeTaken % 60}s</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.status === 'auto_submitted' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {s.status === 'auto_submitted' ? 'Auto-submitted' : 'Submitted'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TeacherLayout>
  )
}

export default TestAnalyticsPage