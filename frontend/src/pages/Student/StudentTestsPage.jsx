import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAvailableTests } from '../../services/testApi'

const StudentTestsPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getAvailableTests()
      .then(res => setTests(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  const getStatusInfo = (test) => {
    if (test.canReview) return { label: 'Results ready', color: 'bg-emerald-100 text-emerald-700' }
    if (test.isSubmitted) return { label: 'Submitted', color: 'bg-blue-100 text-blue-700' }
    if (test.canResume) return { label: 'In progress', color: 'bg-amber-100 text-amber-700' }
    if (test.canStart) return { label: 'Live now', color: 'bg-red-100 text-red-600 animate-pulse' }
    if (test.status === 'closed' && !test.isSubmitted) return { label: 'Missed', color: 'bg-gray-100 text-gray-500' }
    return { label: 'Upcoming', color: 'bg-gray-100 text-gray-500' }
  }

  const filtered = tests.filter(t => {
    if (filter === 'upcoming') return !t.isSubmitted && t.status === 'published' && !t.canStart
    if (filter === 'live') return t.canStart || t.canResume
    if (filter === 'submitted') return t.isSubmitted
    if (filter === 'results') return t.canReview
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <span className="text-xl font-bold text-blue-800">Inst<span className="text-emerald-600">ora</span></span>
        <nav className="flex items-center gap-1">
          <button onClick={() => navigate('/student/dashboard')}
            className="text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100">Dashboard</button>
          <button className="text-sm px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 font-medium">Tests</button>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{user?.username}</span>
          <button onClick={() => { logout(); navigate('/login') }} className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Tests</h1>
          <p className="text-gray-500 text-sm mt-1">{tests.length} test{tests.length !== 1 ? 's' : ''} assigned to you</p>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {[['all', 'All'], ['live', '🔴 Live now'], ['upcoming', 'Upcoming'], ['submitted', 'Submitted'], ['results', 'Results ready']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${filter === val ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? <p className="text-gray-400 text-sm">Loading tests...</p> :
          filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-lg">No tests here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map(test => {
                const status = getStatusInfo(test)
                return (
                  <div key={test._id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-200 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{test.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{test.subject} · by {test.createdBy?.fullName || test.createdBy?.username}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                          <span>📅 {test.liveDate}</span>
                          <span>🕐 {test.startTime} – {test.endTime}</span>
                          <span>⏱ {test.duration} min</span>
                          <span>❓ {test.questionCount} questions</span>
                          <span>📊 {test.totalMarks} marks</span>
                        </div>
                        {test.submission && (
                          <p className="text-xs text-emerald-600 mt-2 font-medium">
                            Score: {test.submission.score}/{test.totalMarks} ({test.submission.percentage}%)
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {test.canStart && (
                          <button onClick={() => navigate(`/student/tests/${test._id}/exam`)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 animate-pulse">
                            Start test →
                          </button>
                        )}
                        {test.canResume && (
                          <button onClick={() => navigate(`/student/tests/${test._id}/exam`)}
                            className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600">
                            Resume →
                          </button>
                        )}
                        {test.canReview && (
                          <button onClick={() => navigate(`/student/tests/${test._id}/result`)}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
                            View results →
                          </button>
                        )}
                        {test.isSubmitted && !test.canReview && (
                          <span className="text-xs text-gray-400 text-center px-3 py-2">Awaiting review release</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>
    </div>
  )
}

export default StudentTestsPage