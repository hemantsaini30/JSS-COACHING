import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTestLeaderboard } from '../../services/testApi'

const medalForRank = (rank) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

const TestLeaderboardPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getTestLeaderboard(id)
      .then(res => setData(res.data.data))
      .catch(err => setError(err.response?.data?.message || 'Leaderboard not available'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading leaderboard...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
      <p className="text-amber-600 font-medium text-center max-w-sm">{error}</p>
      <button onClick={() => navigate('/student/tests')} className="text-sm text-blue-600 hover:underline">← Back to tests</button>
    </div>
  )

  const { test, leaderboard, stats } = data

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-blue-800">Inst<span className="text-emerald-600">ora</span></span>
        <button onClick={() => navigate(`/student/tests/${id}/result`)} className="text-sm text-gray-500 hover:text-gray-700">← Back to result</button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-500">{test.subject}</p>
          <h1 className="text-2xl font-bold text-gray-900">{test.title} — Leaderboard</h1>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Participants</p>
            <p className="text-2xl font-bold text-blue-700">{stats.totalParticipants}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Class average</p>
            <p className="text-2xl font-bold text-amber-600">{stats.averagePercentage}%</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Your rank</p>
            <p className="text-2xl font-bold text-emerald-600">#{stats.yourRank}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {leaderboard.map((row, i) => {
            const medal = medalForRank(row.rank)
            return (
              <div
                key={row.rank}
                className={`flex items-center justify-between px-5 py-4 ${i !== leaderboard.length - 1 ? 'border-b border-gray-100' : ''} ${row.isYou ? 'bg-purple-50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    medal ? 'bg-amber-50 text-lg' :
                    row.isYou ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {medal || row.rank}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${row.isYou ? 'text-purple-900' : 'text-gray-900'}`}>
                      {row.displayName} {row.isYou && <span className="text-xs text-purple-500 font-normal">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-400">{Math.floor(row.timeTaken / 60)}m {row.timeTaken % 60}s</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${row.percentage >= 75 ? 'text-emerald-600' : row.percentage >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                    {row.percentage}%
                  </p>
                  <p className="text-xs text-gray-400">{row.score}/{row.totalMarks} marks</p>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Ranked by highest score, then fastest time for ties. Only names are shown — no other personal details.
        </p>
      </div>
    </div>
  )
}

export default TestLeaderboardPage