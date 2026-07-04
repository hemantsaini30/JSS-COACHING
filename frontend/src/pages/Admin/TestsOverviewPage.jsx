import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../layouts/AdminLayout'
import { getAllTestsAdmin, getAnalyticsOverview } from '../../services/testApi'

const statusColors = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-blue-100 text-blue-700',
  closed: 'bg-emerald-100 text-emerald-700',
}

const TestsOverviewPage = () => {
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAnalyticsOverview(), getAllTestsAdmin()])
      .then(([overRes, testRes]) => {
        setOverview(overRes.data.data)
        setTests(testRes.data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Test Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Institute-wide assessment performance</p>
        </div>

        {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total tests', value: overview?.totalTests || 0, color: 'text-gray-900' },
                { label: 'Published', value: overview?.publishedTests || 0, color: 'text-blue-700' },
                { label: 'Closed', value: overview?.closedTests || 0, color: 'text-emerald-600' },
                { label: 'Submissions', value: overview?.totalSubmissions || 0, color: 'text-purple-700' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {overview?.batchPerformance?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h2 className="font-semibold text-gray-800 mb-4">Batch performance</h2>
                  <div className="flex flex-col gap-3">
                    {overview.batchPerformance.map(b => (
                      <div key={b.batchName} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-28 truncate">{b.batchName}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className={`h-2 rounded-full ${b.averagePercentage >= 75 ? 'bg-emerald-500' : b.averagePercentage >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                            style={{ width: `${b.averagePercentage}%` }} />
                        </div>
                        <span className={`text-sm font-bold w-10 text-right ${b.averagePercentage >= 75 ? 'text-emerald-600' : b.averagePercentage >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                          {b.averagePercentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {overview?.topPerformers?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h2 className="font-semibold text-gray-800 mb-4">Top performers</h2>
                  <div className="flex flex-col gap-3">
                    {overview.topPerformers.map((s, i) => (
                      <div key={s.name} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-400 w-5">#{i + 1}</span>
                        <span className="text-sm text-gray-700 flex-1">{s.name}</span>
                        <span className="text-sm font-bold text-emerald-600">{s.averagePercentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {tests.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="font-semibold text-gray-800">All tests</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Teacher</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Submissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tests.map((test, i) => (
                      <tr key={test._id}
                        onClick={() => navigate(`/admin/tests/${test._id}/analytics`)}
                        className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${i === tests.length - 1 ? 'border-b-0' : ''}`}>
                        <td className="px-5 py-3 font-medium text-gray-900">{test.title}</td>
                        <td className="px-5 py-3 text-gray-500">{test.subject}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{test.createdBy?.fullName || test.createdBy?.username}</td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{test.liveDate}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[test.status]}`}>
                            {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500">{test.submissionCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default TestsOverviewPage