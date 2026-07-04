import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getMyProfile } from '../../services/studentApi'
import { getAttendanceByStudent, getMyCalendar } from '../../services/attendanceApi'
import { getMyFees } from '../../services/feeApi'
import { getMyPayments } from '../../services/paymentApi'
import { createRazorpayOrder, verifyRazorpayPayment } from '../../services/razorpayApi'
import useRazorpay from '../../hooks/useRazorpay'
import NotificationBell from '../../components/NotificationBell'

const DAYS        = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const buildCells = (year, month) => {
  const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const last   = new Date(year, month, 0).getDate()
  const cells  = Array(offset).fill(null)
  for (let d = 1; d <= last; d++)
    cells.push(`${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
  return cells
}

const statusColors = {
  paid:    'bg-emerald-100 text-emerald-700',
  pending: 'bg-red-100 text-red-600',
  partial: 'bg-amber-100 text-amber-700',
}

const StudentDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { openCheckout } = useRazorpay()

  const [profile,        setProfile]        = useState(null)
  const [attendance,     setAttendance]     = useState(null)
  const [fees,           setFees]           = useState([])
  const [payments,       setPayments]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [payingFeeId,    setPayingFeeId]    = useState(null)
  const [paymentMessage, setPaymentMessage] = useState(null)
  const [expandedFeeId,  setExpandedFeeId]  = useState(null)
  const [tab,            setTab]            = useState('overview')

  // Calendar
  const [calYear,    setCalYear]    = useState(() => new Date().getFullYear())
  const [calMonth,   setCalMonth]   = useState(() => new Date().getMonth() + 1)
  const [calData,    setCalData]    = useState(null)
  const [loadingCal, setLoadingCal] = useState(true)

  const fetchAll = async () => {
    try {
      const profileRes = await getMyProfile()
      const student = profileRes.data.data
      setProfile(student)
      const [attRes, feeRes, payRes] = await Promise.all([
        getAttendanceByStudent(student._id),
        getMyFees(),
        getMyPayments(),
      ])
      setAttendance(attRes.data.data)
      setFees(feeRes.data.data)
      setPayments(payRes.data.data)
    } catch { setError('Failed to load your profile data') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    setLoadingCal(true)
    getMyCalendar(calYear, calMonth)
      .then(res => setCalData(res.data.data))
      .catch(() => setCalData(null))
      .finally(() => setLoadingCal(false))
  }, [calYear, calMonth])

  const navigateCal = (delta) => {
    let y = calYear, m = calMonth + delta
    if (m > 12) { m = 1; y++ }
    if (m < 1)  { m = 12; y-- }
    if (profile?.joiningDate) {
      const j = new Date(profile.joiningDate)
      if (y < j.getFullYear() || (y === j.getFullYear() && m < j.getMonth() + 1)) return
    }
    const now = new Date()
    if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth() + 1)) return
    setCalYear(y); setCalMonth(m)
  }

  const handlePayOnline = async (fee) => {
    setPayingFeeId(fee._id); setPaymentMessage(null)
    try {
      const orderRes = await createRazorpayOrder(fee._id)
      const { orderId, amount, keyId, studentName, feeBalance } = orderRes.data.data
      openCheckout({
        orderId, amount, keyId, studentName, period: fee.period,
        onSuccess: async (response) => {
          try {
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            setPaymentMessage({ type: 'success', text: `Payment of ${fmt(feeBalance)} successful! Receipt: ${verifyRes.data.data.receiptNumber}` })
            fetchAll()
          } catch (err) {
            setPaymentMessage({ type: 'error', text: err.response?.data?.message || 'Payment verification failed.' })
          } finally { setPayingFeeId(null) }
        },
        onFailure: (msg) => {
          if (msg !== 'Payment cancelled') setPaymentMessage({ type: 'error', text: msg })
          setPayingFeeId(null)
        },
      })
    } catch (err) {
      setPaymentMessage({ type: 'error', text: err.response?.data?.message || 'Failed to initiate payment' })
      setPayingFeeId(null)
    }
  }

  const attColor = (p) => p >= 75 ? 'text-emerald-600' : p >= 50 ? 'text-amber-600' : 'text-red-500'
  const attBar   = (p) => p >= 75 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-500' : 'bg-red-400'

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading your dashboard...</p>
    </div>
  )
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-red-400">{error}</p>
    </div>
  )

  const pendingFees = fees.filter(f => f.status !== 'paid')
  const totalDue    = fees.reduce((s, f) => s + f.balance, 0)
  const today       = new Date().toISOString().split('T')[0]
  const rMap        = Object.fromEntries((calData?.records || []).map(r => [r.date, r.status]))
  const cSet        = new Set(calData?.classDates || [])
  const isToday     = calYear === new Date().getFullYear() && calMonth === new Date().getMonth() + 1
  const isJoined    = profile?.joiningDate
    ? (calYear === new Date(profile.joiningDate).getFullYear() && calMonth === new Date(profile.joiningDate).getMonth() + 1)
    : false

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <span className="text-xl font-bold text-blue-800">Inst<span className="text-emerald-600">ora</span></span>
        <nav className="flex items-center gap-1">
          <button onClick={() => setTab('overview')}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium ${tab === 'overview' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
            Dashboard
          </button>
          <button onClick={() => setTab('fees')}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium relative ${tab === 'fees' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
            Fees
            {pendingFees.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingFees.length}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/student/tests')} className="text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100">Tests</button>
          <button onClick={() => navigate('/student/doubts')} className="text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100">Doubts</button>
          <NotificationBell theme="light" />
        </nav>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">{user?.username}</span>
          <button onClick={() => { logout(); navigate('/login') }} className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.fullName}</h1>
              <p className="text-gray-500 text-sm mt-1">{profile?.batchId?.name} · {profile?.batchId?.course}</p>
            </div>

            {paymentMessage && (
              <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
                paymentMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                <span>{paymentMessage.text}</span>
                <button onClick={() => setPaymentMessage(null)} className="ml-4 text-lg leading-none">×</button>
              </div>
            )}

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs text-gray-500 mb-1">Attendance (overall)</p>
                <p className={`text-3xl font-bold ${attColor(attendance?.percentage || 0)}`}>
                  {attendance?.percentage || 0}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {attendance?.present || 0} present · {attendance?.absent || 0} absent
                </p>
                <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${attBar(attendance?.percentage || 0)}`}
                    style={{ width: `${attendance?.percentage || 0}%` }} />
                </div>
              </div>

              <div className={`bg-white border rounded-xl p-5 ${totalDue > 0 ? 'border-red-200' : 'border-gray-200'}`}>
                <p className="text-xs text-gray-500 mb-1">Outstanding fees</p>
                <p className={`text-3xl font-bold ${totalDue > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {totalDue > 0 ? fmt(totalDue) : 'Clear'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {totalDue > 0 ? `${pendingFees.length} month${pendingFees.length !== 1 ? 's' : ''} pending` : 'All fees paid'}
                </p>
                {totalDue > 0 && (
                  <button onClick={() => setTab('fees')}
                    className="mt-3 w-full py-1.5 bg-red-500 text-white text-xs rounded-lg font-medium hover:bg-red-600 transition-colors">
                    Pay now →
                  </button>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs text-gray-500 mb-1">Batch</p>
                <p className="text-lg font-bold text-blue-700">{profile?.batchId?.name}</p>
                <p className="text-xs text-gray-400 mt-1">{profile?.batchId?.course}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Joined {new Date(profile?.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Monthly attendance calendar */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-800">Attendance Calendar</h2>
                  {calData && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      <span className="text-emerald-600 font-medium">{calData.monthStats.present}P</span>
                      {' · '}
                      <span className="text-red-500 font-medium">{calData.monthStats.absent}A</span>
                      {' · '}
                      <span className="text-gray-400 font-medium">{calData.monthStats.holiday}H</span>
                      {' · '}
                      <strong>{calData.monthStats.percentage}%</strong> this month
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => navigateCal(-1)} disabled={isJoined}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors">
                    ‹
                  </button>
                  <span className="text-sm font-medium text-gray-700 w-32 text-center">
                    {MONTH_NAMES[calMonth - 1]} {calYear}
                  </span>
                  <button onClick={() => navigateCal(1)} disabled={isToday}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors">
                    ›
                  </button>
                </div>
              </div>

              {loadingCal ? (
                <p className="text-center text-gray-400 text-sm py-8">Loading calendar...</p>
              ) : (
                <>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {DAYS.map(d => (
                      <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {buildCells(calYear, calMonth).map((ds, i) => {
                      if (!ds) return <div key={i} />

                      const day      = parseInt(ds.split('-')[2])
                      const isFuture = ds > today

                      if (isFuture) return (
                        <div key={i} className="rounded-lg h-12 flex flex-col items-center justify-center">
                          <span className="text-xs text-gray-200">{day}</span>
                        </div>
                      )

                      let style, label, textColor
                      if (rMap[ds] === 'present') {
                        style = 'bg-emerald-100 border border-emerald-200'
                        label = 'P'; textColor = 'text-emerald-700'
                      } else if (rMap[ds] === 'absent' || cSet.has(ds)) {
                        style = 'bg-red-100 border border-red-200'
                        label = 'A'; textColor = 'text-red-500'
                      } else {
                        style = 'bg-gray-100 border border-gray-200'
                        label = 'H'; textColor = 'text-gray-400'
                      }

                      return (
                        <div key={i} className={`rounded-lg h-12 flex flex-col items-center justify-center ${style}`}>
                          <span className="text-xs text-gray-500 leading-none">{day}</span>
                          <span className={`text-xs font-bold leading-none mt-1 ${textColor}`}>{label}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-5 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded-sm" /> Present (P)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-red-100 border border-red-200 rounded-sm" /> Absent (A)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-sm" /> No class (H)
                    </span>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── FEES TAB ── */}
        {tab === 'fees' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Fees</h1>
                <p className="text-gray-500 text-sm mt-1">Monthly fee history and online payments</p>
              </div>
              {totalDue > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-right">
                  <p className="text-xs text-red-500">Total outstanding</p>
                  <p className="text-xl font-bold text-red-600">{fmt(totalDue)}</p>
                </div>
              )}
            </div>

            {paymentMessage && (
              <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
                paymentMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                <span>{paymentMessage.text}</span>
                <button onClick={() => setPaymentMessage(null)} className="ml-4 text-lg leading-none">×</button>
              </div>
            )}

            {fees.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg">No fee records yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mb-8">
                {fees.map((fee) => (
                  <div key={fee._id}
                    className={`bg-white border rounded-xl overflow-hidden ${
                      fee.status === 'paid' ? 'border-gray-200' :
                      fee.status === 'partial' ? 'border-amber-200' : 'border-red-200'
                    }`}>
                    <div className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-10 rounded-full ${
                          fee.status === 'paid' ? 'bg-emerald-400' :
                          fee.status === 'partial' ? 'bg-amber-400' : 'bg-red-400'
                        }`} />
                        <div>
                          <p className="font-semibold text-gray-900">{fee.period}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Fee: {fmt(fee.amount)}
                            {fee.paidAmount > 0 && <span className="text-emerald-600"> · Paid: {fmt(fee.paidAmount)}</span>}
                            {fee.balance > 0 && <span className="text-red-500"> · Due: {fmt(fee.balance)}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[fee.status]}`}>
                          {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                        </span>
                        {fee.status !== 'paid' && (
                          <button onClick={() => handlePayOnline(fee)} disabled={payingFeeId === fee._id}
                            className="bg-purple-700 text-white text-xs px-4 py-2 rounded-lg font-medium hover:bg-purple-800 disabled:opacity-60 transition-colors flex items-center gap-1.5">
                            {payingFeeId === fee._id
                              ? <span>Opening...</span>
                              : <><span>Pay</span><span className="font-bold">{fmt(fee.balance)}</span><span>online</span></>
                            }
                          </button>
                        )}
                        {fee.status === 'paid' && (
                          <button
                            onClick={() => setExpandedFeeId(expandedFeeId === fee._id ? null : fee._id)}
                            className="text-xs text-gray-400 hover:text-gray-600">
                            {expandedFeeId === fee._id ? 'Hide receipts' : 'View receipts'}
                          </button>
                        )}
                      </div>
                    </div>

                    {expandedFeeId === fee._id && (
                      <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
                        {payments
                          .filter(p => p.feeId?._id === fee._id || p.feeId === fee._id)
                          .map(p => (
                            <div key={p._id} className="flex items-center justify-between py-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600">
                                  {p.receiptNumber}
                                </span>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                  p.paymentMethod === 'online' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {p.paymentMethod}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-emerald-600 text-sm">{fmt(p.amount)}</span>
                                <span className="text-xs text-gray-400">
                                  {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {payments.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-800 mb-4">All payment receipts</h2>
                <div className="flex flex-col gap-2">
                  {payments.map(p => (
                    <div key={p._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 inline-block">
                          {p.receiptNumber}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {p.feeId?.period || p.period || '—'} ·
                          <span className={`ml-1 ${p.paymentMethod === 'online' ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                            {p.paymentMethod}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">{fmt(p.amount)}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default StudentDashboard