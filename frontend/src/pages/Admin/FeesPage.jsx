import { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { getFeeSummary, getStudentFeeProfile, addNextMonthFee, updateFeePayment, deleteFeeRecord } from '../../services/feeApi'
import { getAllPayments } from '../../services/paymentApi'
import { getAllBatches } from '../../services/batchApi'
import { getAllStudents } from '../../services/studentApi'
import { getOnlinePayments } from '../../services/razorpayApi'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const statusColors = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-red-100 text-red-600',
  partial: 'bg-amber-100 text-amber-700',
}

const methodColors = {
  cash: 'bg-gray-100 text-gray-600',
  online: 'bg-blue-100 text-blue-700',
  cheque: 'bg-purple-100 text-purple-700',
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const FeesPage = () => {
  const [tab, setTab] = useState('students')
  const [batches, setBatches] = useState([])
  const [students, setStudents] = useState([])
  const [payments, setPayments] = useState([])
  const [onlinePayments, setOnlinePayments] = useState([])
  const [onlineTotal, setOnlineTotal] = useState(0)
  const [summary, setSummary] = useState(null)
  const [selectedBatch, setSelectedBatch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [profileModal, setProfileModal] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [expandedFee, setExpandedFee] = useState(null)
  const [payForm, setPayForm] = useState({ paymentAmount: '', paymentMethod: 'cash', note: '' })
  const [paying, setPaying] = useState(false)
  const [addingMonth, setAddingMonth] = useState(false)

  const fetchAll = async () => {
    try {
      const [batchRes, studRes, sumRes, payRes,onlineRes] = await Promise.all([
        getAllBatches(),
        getAllStudents(),
        getFeeSummary(),
        getAllPayments(),
        getOnlinePayments(),
      ])
      setBatches(batchRes.data.data)
      setStudents(studRes.data.data)
      setSummary(sumRes.data.data)
      setPayments(payRes.data.data)
      setOnlinePayments(onlineRes.data.data)
      setOnlineTotal(onlineRes.data.totalOnlineCollection)
      if (!selectedBatch && batchRes.data.data.length > 0) {
        setSelectedBatch(batchRes.data.data[0]._id)
      }
    } catch {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const openProfile = async (student) => {
    setProfileModal({ student, fees: null, summary: null })
    setExpandedFee(null)
    setProfileLoading(true)
    setError('')
    try {
      const res = await getStudentFeeProfile(student._id)
      setProfileModal(res.data.data)
    } catch {
      setError('Failed to load fee profile')
      setProfileModal(null)
    } finally {
      setProfileLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (!profileModal?.student) return
    try {
      const res = await getStudentFeeProfile(profileModal.student._id)
      setProfileModal(res.data.data)
      const studRes = await getAllStudents()
      setStudents(studRes.data.data)
      const sumRes = await getFeeSummary()
      setSummary(sumRes.data.data)
    } catch {}
  }

  const handlePayment = async (feeId, e) => {
    e.preventDefault()
    setPaying(true)
    setError('')
    try {
      await updateFeePayment(feeId, {
        paymentAmount: Number(payForm.paymentAmount),
        paymentMethod: payForm.paymentMethod,
        note: payForm.note,
      })
      setExpandedFee(null)
      setPayForm({ paymentAmount: '', paymentMethod: 'cash', note: '' })
      setSuccess('Payment recorded')
      refreshProfile()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment')
    } finally {
      setPaying(false)
    }
  }

  const handleAddNextMonth = async () => {
    if (!profileModal?.student) return
    setAddingMonth(true)
    setError('')
    try {
      const res = await addNextMonthFee(profileModal.student._id)
      setSuccess(res.data.message)
      refreshProfile()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add next month')
    } finally {
      setAddingMonth(false)
    }
  }

  const handleDeleteFee = async (feeId) => {
    if (!window.confirm('Delete this fee record?')) return
    try {
      await deleteFeeRecord(feeId)
      setSuccess('Fee record deleted')
      refreshProfile()
    } catch {
      setError('Failed to delete fee record')
    }
  }

  const filteredStudents = selectedBatch
    ? students.filter(s => s.batchId?._id === selectedBatch)
    : students

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-500 text-sm mt-1">Student-wise fee tracking and payment records</p>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">This month</p>
              <p className="text-xl font-bold text-gray-900">{fmt(summary.thisMonthBilled)} billed</p>
              <p className="text-sm mt-1">
                <span className="text-emerald-600">{fmt(summary.thisMonthCollected)} collected</span>
                <span className="text-gray-400"> · </span>
                <span className="text-red-500">{fmt(summary.thisMonthPending)} pending</span>
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">All time collected</p>
              <p className="text-xl font-bold text-emerald-600">{fmt(summary.totalCollected)}</p>
              <p className="text-sm text-gray-400 mt-1">of {fmt(summary.totalBilled)} billed</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Outstanding balance</p>
              <p className="text-xl font-bold text-red-500">{fmt(summary.totalPending)}</p>
              <p className="text-sm text-gray-400 mt-1">
                {summary.paid} paid · {summary.partial} partial · {summary.pending} pending
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
          {['students', 'transactions', 'online'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'students' ? 'Students' : t === 'transactions' ? 'All transactions' : '💳 Online payments'}
            </button>
          ))}
        </div>

        {tab === 'students' && (
          <div>
            <div className="flex gap-2 mb-5 flex-wrap">
              {batches.map(b => (
                <button key={b._id} onClick={() => setSelectedBatch(b._id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selectedBatch === b._id
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}>
                  {b.name}
                  <span className="ml-1.5 text-xs opacity-70">
                    ({students.filter(s => s.batchId?._id === b._id).length})
                  </span>
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg mb-1">No students in this batch</p>
                <p className="text-sm">Add students from the Students page first</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredStudents.map(s => (
                  <button
                    key={s._id}
                    onClick={() => openProfile(s)}
                    className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                        {s.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{s.fullName}</p>
                        <p className="text-xs text-gray-400">{s.userId?.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">Monthly fee</p>
                        <p className="font-bold text-gray-900">{fmt(s.monthlyFee)}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[s.feeStatus]}`}>
                        {s.feeStatus?.charAt(0).toUpperCase() + s.feeStatus?.slice(1)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'transactions' && (
          <div>
            <div className="flex items-center gap-2 mb-4 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg w-fit">
              🔒 All payment records are permanent and cannot be deleted
            </div>
            {payments.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg mb-1">No payments recorded yet</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Receipt</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Student</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Method</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={p._id} className={`border-b border-gray-100 hover:bg-gray-50 ${i === payments.length - 1 ? 'border-b-0' : ''}`}>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{p.receiptNumber}</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{p.studentId?.fullName}</p>
                          <p className="text-xs text-gray-400">{p.studentId?.batchId?.name}</p>
                        </td>
                        <td className="px-5 py-4 font-bold text-emerald-600">{fmt(p.amount)}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${methodColors[p.paymentMethod]}`}>
                            {p.paymentMethod?.charAt(0).toUpperCase() + p.paymentMethod?.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">{p.recordedBy?.username}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'online' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                <p className="text-xs text-purple-600">Total collected online</p>
                <p className="text-xl font-bold text-purple-700">{fmt(onlineTotal)}</p>
              </div>
              <div className="text-xs text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2">
                🔒 Online payments are verified by Razorpay and permanent
              </div>
            </div>
            {onlinePayments.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg mb-1">No online payments yet</p>
                <p className="text-sm">Payments made by students via Razorpay will appear here</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Razorpay Order ID</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Batch</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Fee period</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Paid on</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onlinePayments.map((p, i) => (
                      <tr key={p._id} className={`border-b border-gray-100 hover:bg-gray-50 ${i === onlinePayments.length - 1 ? 'border-b-0' : ''}`}>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">{p.orderId}</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{p.studentName}</p>
                          <p className="text-xs text-gray-400">{p.username}</p>
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs">{p.batchName}</td>
                        <td className="px-5 py-4 text-gray-700 font-medium">{p.period}</td>
                        <td className="px-5 py-4 font-bold text-emerald-600">{fmt(p.amountInRupees)}</td>
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          {new Date(p.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Fee Profile Modal */}
        {profileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto">

              <div className="p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">
                      {profileModal.student?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900">{profileModal.student?.fullName}</h2>
                      <p className="text-xs text-gray-500">
                        {profileModal.student?.batch} · Joined {new Date(profileModal.student?.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setProfileModal(null); setSuccess('') }}
                    className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                </div>

                {!profileLoading && profileModal.summary && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Total billed</p>
                      <p className="font-bold text-gray-900">{fmt(profileModal.summary.totalBilled)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Total paid</p>
                      <p className="font-bold text-emerald-600">{fmt(profileModal.summary.totalPaid)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Outstanding</p>
                      <p className="font-bold text-red-500">{fmt(profileModal.summary.totalBalance)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                {profileLoading ? (
                  <p className="text-gray-400 text-sm text-center py-8">Loading fee profile...</p>
                ) : (
                  <>
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
                    )}

                    {profileModal.fees?.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p className="mb-2">No fee records yet</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 mb-4">
                        {profileModal.fees?.map((fee) => (
                          <div key={fee._id} className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{fee.period}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Fee: {fmt(fee.amount)} · Paid: <span className="text-emerald-600">{fmt(fee.paidAmount)}</span>
                                  {fee.balance > 0 && <span className="text-red-500"> · Due: {fmt(fee.balance)}</span>}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[fee.status]}`}>
                                  {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                                </span>
                                {fee.status !== 'paid' && (
                                  <button
                                    onClick={() => {
                                      setExpandedFee(expandedFee === fee._id ? null : fee._id)
                                      setPayForm({ paymentAmount: fee.balance, paymentMethod: 'cash', note: '' })
                                      setError('')
                                    }}
                                    className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                                      expandedFee === fee._id
                                        ? 'bg-gray-200 text-gray-600'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                  >
                                    {expandedFee === fee._id ? 'Cancel' : 'Update payment'}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteFee(fee._id)}
                                  className="text-xs text-red-400 hover:text-red-600"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            {expandedFee === fee._id && (
                              <form onSubmit={(e) => handlePayment(fee._id, e)}
                                className="px-4 py-4 border-t border-gray-100 bg-white">
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-gray-600">Amount being paid (₹)</label>
                                    <input
                                      type="number"
                                      value={payForm.paymentAmount}
                                      onChange={e => setPayForm({ ...payForm, paymentAmount: e.target.value })}
                                      max={fee.balance}
                                      required
                                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-400">Max payable: {fmt(fee.balance)}</p>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-gray-600">Payment method</label>
                                    <select
                                      value={payForm.paymentMethod}
                                      onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="cash">Cash</option>
                                      <option value="online">Online</option>
                                      <option value="cheque">Cheque</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1 mb-3">
                                  <label className="text-xs font-medium text-gray-600">Note (optional)</label>
                                  <input
                                    type="text"
                                    value={payForm.note}
                                    onChange={e => setPayForm({ ...payForm, note: e.target.value })}
                                    placeholder="e.g. UPI ref, partial payment..."
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <button
                                  type="submit"
                                  disabled={paying}
                                  className="w-full py-2 bg-emerald-600 text-white text-sm rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {paying ? 'Recording...' : 'Confirm payment'}
                                </button>
                              </form>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={handleAddNextMonth}
                      disabled={addingMonth}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                    >
                      {addingMonth ? 'Adding...' : '+ Add next month fee'}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-1">
                      Auto-sets amount to {fmt(profileModal.student?.monthlyFee)}/month · Status: Unpaid
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default FeesPage