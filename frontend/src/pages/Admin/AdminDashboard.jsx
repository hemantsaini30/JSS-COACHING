import { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { getDashboardStats } from '../../services/adminApi'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(res => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatAmount = (n) => {
    if (!n) return '₹0'
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
    return `₹${n}`
  }

  const getHour = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {getHour()}, {user?.username}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-24 mb-3"></div>
                <div className="h-7 bg-gray-100 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-1">Total students</p>
              <p className="text-2xl font-bold text-blue-700">{stats?.totalStudents ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">{stats?.totalBatches ?? 0} active batches</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-1">Attendance today</p>
              <p className={`text-2xl font-bold ${
                (stats?.attendancePercent ?? 0) >= 75 ? 'text-emerald-600' :
                (stats?.attendancePercent ?? 0) >= 50 ? 'text-amber-600' : 'text-red-500'
              }`}>
                {stats?.attendancePercent ?? 0}%
              </p>
              <p className="text-xs text-gray-400 mt-1">{stats?.presentToday ?? 0} present today</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-1">Fee collected</p>
              <p className="text-2xl font-bold text-amber-600">{formatAmount(stats?.totalFeesCollected)}</p>
              <p className="text-xs text-gray-400 mt-1">{formatAmount(stats?.totalFeesPending)} pending</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-1">Pending inquiries</p>
              <p className="text-2xl font-bold text-pink-600">{stats?.newInquiries ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">Awaiting response</p>
            </div>
          </div>
        )}

        {stats?.recentInquiries?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Recent inquiries</h2>
              <a href="/admin/inquiries" className="text-xs text-blue-600 hover:text-blue-800">View all</a>
            </div>
            <div className="flex flex-col gap-1">
              {stats.recentInquiries.map((inq) => (
                <div key={inq._id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">
                      {inq.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inq.name}</p>
                      <p className="text-xs text-gray-400">{inq.targetCourse} · {inq.phone}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    inq.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                    inq.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && stats?.totalStudents === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-400 text-sm">No data yet. Start by creating a batch and adding students.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard