import { useEffect, useState } from 'react'
import { getAllBatches } from '../services/batchApi'
import { getAllStudents } from '../services/studentApi'
import {
  markAttendance as apiMark,
  getAttendanceByBatchAndDate,
  getBatchAttendanceSummary,
  getStudentCalendar,
  getBatchCalendar,
} from '../services/attendanceApi'

// ── constants ────────────────────────────────────────────────

const DAYS        = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const TODAY       = () => new Date().toISOString().split('T')[0]

// ── helpers ──────────────────────────────────────────────────

const buildCells = (year, month) => {
  const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const last   = new Date(year, month, 0).getDate()
  const cells  = Array(offset).fill(null)
  for (let d = 1; d <= last; d++)
    cells.push(`${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
  return cells
}

const cellStatus = (dateStr, recordMap, classSet) => {
  const today = TODAY()
  if (!dateStr || dateStr > today) return 'future'
  if (recordMap[dateStr] === 'present') return 'present'
  if (recordMap[dateStr] === 'absent' || classSet.has(dateStr)) return 'absent'
  return 'holiday'
}

const STATUS_STYLE = {
  present: 'bg-emerald-100 text-emerald-700',
  absent:  'bg-red-100 text-red-500',
  holiday: 'bg-gray-100 text-gray-400',
  future:  'text-gray-200',
}
const STATUS_LABEL = { present: 'P', absent: 'A', holiday: 'H', future: '' }

const pctColor = (p) => p >= 75 ? 'text-emerald-600' : p >= 50 ? 'text-amber-600' : 'text-red-500'
const barColor = (p) => p >= 75 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-500' : 'bg-red-400'

// ── mini calendar (used in modal) ────────────────────────────

const MiniCalendar = ({ year, month, records, classDates }) => {
  const rMap = Object.fromEntries((records || []).map(r => [r.date, r.status]))
  const cSet = new Set(classDates || [])
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {buildCells(year, month).map((ds, i) => {
          if (!ds) return <div key={i} />
          const s = cellStatus(ds, rMap, cSet)
          const d = parseInt(ds.split('-')[2])
          return (
            <div key={i} className={`rounded-lg p-1 flex flex-col items-center justify-center h-10 ${STATUS_STYLE[s]}`}>
              <span className="text-xs leading-none opacity-70">{d}</span>
              <span className="text-xs font-bold leading-none mt-0.5">{STATUS_LABEL[s]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── main module ──────────────────────────────────────────────

const AttendanceModule = () => {
  const [batches,       setBatches]       = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedDate,  setSelectedDate]  = useState(() => TODAY())
  const [tab,           setTab]           = useState('mark')
  const [loading,       setLoading]       = useState(true)

  // mark tab
  const [students,   setStudents]   = useState([])
  const [attendance, setAttendance] = useState({})
  const [isLocked,   setIsLocked]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [message,    setMessage]    = useState('')
  const [markErr,    setMarkErr]    = useState('')

  // summary tab
  const [summary,        setSummary]        = useState([])
  const [summaryLoading, setSummaryLoading] = useState(false)

  // student modal
  const [modal,        setModal]        = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  // batch calendar tab
  const [bCalYear,    setBCalYear]    = useState(() => new Date().getFullYear())
  const [bCalMonth,   setBCalMonth]   = useState(() => new Date().getMonth() + 1)
  const [bCalData,    setBCalData]    = useState(null)
  const [bCalLoading, setBCalLoading] = useState(false)

  useEffect(() => {
    getAllBatches().then(r => setBatches(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedBatch) return
    setStudents([]); setAttendance({}); setMessage(''); setMarkErr(''); setIsLocked(false)
    getAllStudents().then(res => {
      const bs = res.data.data.filter(s => s.batchId?._id === selectedBatch)
      setStudents(bs)
      const init = {}; bs.forEach(s => { init[s._id] = 'present' })
      getAttendanceByBatchAndDate(selectedBatch, selectedDate)
        .then(ar => {
          const ex = {}; ar.data.data.forEach(r => { ex[r.studentId?._id] = r.status })
          if (Object.keys(ex).length > 0) { setAttendance(ex); setIsLocked(true) }
          else { setAttendance(init); setIsLocked(false) }
        }).catch(() => setAttendance(init))
    })
  }, [selectedBatch, selectedDate])

  useEffect(() => {
    if (!selectedBatch || tab !== 'summary') return
    setSummaryLoading(true)
    getBatchAttendanceSummary(selectedBatch)
      .then(r => setSummary(r.data.data)).catch(() => {}).finally(() => setSummaryLoading(false))
  }, [selectedBatch, tab])

  useEffect(() => {
    if (!selectedBatch || tab !== 'batch-calendar') return
    setBCalLoading(true); setBCalData(null)
    getBatchCalendar(selectedBatch, bCalYear, bCalMonth)
      .then(r => setBCalData(r.data.data)).catch(() => {}).finally(() => setBCalLoading(false))
  }, [selectedBatch, tab, bCalYear, bCalMonth])

  const handleSave = async () => {
    if (!selectedBatch || !students.length) return
    setSaving(true); setMessage(''); setMarkErr('')
    try {
      const records = students.map(s => ({ studentId: s._id, status: attendance[s._id] || 'absent' }))
      await apiMark({ batchId: selectedBatch, date: selectedDate, records })
      setIsLocked(true); setMessage('Attendance saved successfully')
      getBatchAttendanceSummary(selectedBatch).then(r => setSummary(r.data.data))
    } catch (err) {
      setMarkErr(err.response?.data?.message || 'Failed to save attendance')
    } finally { setSaving(false) }
  }

  const handleMarkAgain = () => {
    if (!window.confirm(`Re-mark attendance for ${selectedDate}?`)) return
    setIsLocked(false); setMessage('')
  }

  const toggleAll = (status) => {
    const u = {}; students.forEach(s => { u[s._id] = status }); setAttendance(u)
  }

  const openModal = async (row) => {
    const n = new Date()
    setModal({ student: row, year: n.getFullYear(), month: n.getMonth() + 1, data: null })
    setModalLoading(true)
    try {
      const r = await getStudentCalendar(row.studentId, selectedBatch, n.getFullYear(), n.getMonth() + 1)
      setModal(m => ({ ...m, data: r.data.data }))
    } catch {} finally { setModalLoading(false) }
  }

  const navModal = async (delta) => {
    if (!modal) return
    let { year, month } = modal
    month += delta
    if (month > 12) { month = 1; year++ }
    if (month < 1)  { month = 12; year-- }
    setModal(m => ({ ...m, year, month, data: null }))
    setModalLoading(true)
    try {
      const r = await getStudentCalendar(modal.student.studentId, selectedBatch, year, month)
      setModal(m => ({ ...m, data: r.data.data }))
    } catch {} finally { setModalLoading(false) }
  }

  const navBatchCal = (delta) => {
    let y = bCalYear, m = bCalMonth + delta
    if (m > 12) { m = 1; y++ }
    if (m < 1)  { m = 12; y-- }
    setBCalYear(y); setBCalMonth(m)
  }

  const presentCount = Object.values(attendance).filter(v => v === 'present').length

  if (loading) return <p className="text-gray-400 text-sm p-8">Loading...</p>

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">Mark and track student attendance by batch</p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-6 flex-wrap items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Batch</label>
          <select value={selectedBatch} onChange={e => { setSelectedBatch(e.target.value); setTab('mark') }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-48">
            <option value="">Select batch</option>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
        {tab === 'mark' && selectedBatch && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}
      </div>

      {!selectedBatch ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-1">Select a batch to get started</p>
          <p className="text-sm">Choose a batch above to mark or view attendance</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'mark',           label: 'Mark attendance' },
              { key: 'summary',        label: 'Summary report'  },
              { key: 'batch-calendar', label: 'Batch calendar'  },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── MARK ──────────────────────────────────────── */}
          {tab === 'mark' && (
            <div>
              {message && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
                  <span>{message}</span>
                  <button onClick={handleMarkAgain} className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg ml-4">Mark again</button>
                </div>
              )}
              {markErr && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{markErr}</div>}
              {isLocked && !message && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
                  <span>Attendance already marked for <strong>{selectedDate}</strong></span>
                  <button onClick={handleMarkAgain} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg ml-4">Mark again</button>
                </div>
              )}
              {students.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><p>No students in this batch</p></div>
              ) : (
                <div className={`bg-white border rounded-xl overflow-hidden ${isLocked ? 'border-blue-200 opacity-75 pointer-events-none' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">{students.length} students</span>
                      <span className="text-emerald-600 font-medium">{presentCount} present</span>
                      <span className="text-red-500 font-medium">{students.length - presentCount} absent</span>
                    </div>
                    {!isLocked && (
                      <div className="flex gap-2">
                        <button onClick={() => toggleAll('present')} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg">All present</button>
                        <button onClick={() => toggleAll('absent')} className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg">All absent</button>
                      </div>
                    )}
                  </div>
                  {students.map((s, i) => (
                    <div key={s._id} className={`flex items-center justify-between px-5 py-4 ${i < students.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                          {s.fullName.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.fullName}</p>
                          <p className="text-xs text-gray-400">{s.userId?.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setAttendance({ ...attendance, [s._id]: 'present' })}
                          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${attendance[s._id] === 'present' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          Present
                        </button>
                        <button onClick={() => setAttendance({ ...attendance, [s._id]: 'absent' })}
                          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${attendance[s._id] === 'absent' ? 'bg-red-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          Absent
                        </button>
                      </div>
                    </div>
                  ))}
                  {!isLocked && (
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                      <button onClick={handleSave} disabled={saving}
                        className="bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save attendance'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── SUMMARY ───────────────────────────────────── */}
          {tab === 'summary' && (
            <div>
              <p className="text-xs text-gray-400 mb-3">Click any student to view their monthly attendance calendar</p>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
                {summaryLoading ? (
                  <p className="text-center text-gray-400 text-sm py-10">Loading...</p>
                ) : summary.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-10">No attendance data yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Present</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Absent</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Total classes</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map((row, i) => (
                        <tr key={row.studentId} onClick={() => openModal(row)}
                          className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${i === summary.length - 1 ? 'border-b-0' : ''}`}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                                {row.fullName.split(' ').map(n => n[0]).join('').slice(0,2)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{row.fullName}</p>
                                <p className="text-xs text-gray-400">{row.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-emerald-600 font-medium">{row.present}</td>
                          <td className="px-5 py-4 text-red-500 font-medium">{row.absent}</td>
                          <td className="px-5 py-4 text-gray-500">{row.total}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-24 bg-gray-100 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${barColor(row.percentage)}`} style={{ width: `${row.percentage}%` }} />
                              </div>
                              <span className={`text-sm font-semibold ${pctColor(row.percentage)}`}>{row.percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── BATCH CALENDAR ────────────────────────────── */}
          {tab === 'batch-calendar' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-gray-800">Batch Calendar</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Click a date to open it in the mark tab</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navBatchCal(-1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">‹</button>
                  <span className="text-sm font-medium text-gray-700 w-36 text-center">{MONTH_NAMES[bCalMonth - 1]} {bCalYear}</span>
                  <button onClick={() => navBatchCal(1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">›</button>
                </div>
              </div>

              {bCalLoading ? (
                <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
              ) : bCalData ? (() => {
                const today = TODAY()
                const cellMap = Object.fromEntries(bCalData.days.map(d => [d.date, d]))
                return (
                  <>
                    <div className="grid grid-cols-7 gap-1.5 mb-1">
                      {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {buildCells(bCalYear, bCalMonth).map((ds, i) => {
                        if (!ds) return <div key={i} />
                        const day  = parseInt(ds.split('-')[2])
                        const cell = cellMap[ds]
                        const isFuture = ds > today

                        if (!cell?.hasClass) return (
                          <div key={i} className={`rounded-lg min-h-12 flex flex-col items-center justify-center ${isFuture ? '' : 'bg-gray-50'}`}>
                            <span className={`text-xs ${isFuture ? 'text-gray-200' : 'text-gray-300'}`}>{day}</span>
                            {!isFuture && <span className="text-xs text-gray-300">—</span>}
                          </div>
                        )

                        const pct   = cell.total > 0 ? Math.round(cell.present / cell.total * 100) : 0
                        const style = pct >= 80 ? 'bg-emerald-50 border border-emerald-200' : pct >= 60 ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'
                        const tCol  = pct >= 80 ? 'text-emerald-700' : pct >= 60 ? 'text-amber-700' : 'text-red-600'

                        return (
                          <button key={i} onClick={() => { setSelectedDate(ds); setTab('mark') }}
                            className={`rounded-lg min-h-12 flex flex-col items-center justify-center hover:opacity-75 transition-opacity ${style}`}>
                            <span className="text-xs text-gray-500">{day}</span>
                            <span className={`text-xs font-bold ${tCol}`}>{cell.present}/{cell.total}</span>
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded-sm" /> ≥80%</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-100 border border-amber-200 rounded-sm" /> 60–80%</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-100 border border-red-200 rounded-sm" /> &lt;60%</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-gray-50 border border-gray-200 rounded-sm" /> No class</span>
                    </div>
                  </>
                )
              })() : <p className="text-center text-gray-400 text-sm py-8">No data for this month</p>}
            </div>
          )}
        </>
      )}

      {/* ── STUDENT CALENDAR MODAL ────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-semibold text-gray-900">{modal.student.fullName}</h2>
                <p className="text-xs text-gray-400">{modal.student.percentage}% overall · click month to browse</p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="flex items-center justify-between my-4">
              <button onClick={() => navModal(-1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">‹</button>
              <span className="font-medium text-gray-800 text-sm">{MONTH_NAMES[modal.month - 1]} {modal.year}</span>
              <button onClick={() => navModal(1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">›</button>
            </div>

            {modal.data && (
              <div className="flex items-center gap-3 text-xs mb-4 bg-gray-50 rounded-lg px-4 py-2.5">
                <span className="font-semibold text-emerald-600">{modal.data.monthStats.present} P</span>
                <span className="text-gray-300">·</span>
                <span className="font-semibold text-red-500">{modal.data.monthStats.absent} A</span>
                <span className="text-gray-300">·</span>
                <span className="font-semibold text-gray-400">{modal.data.monthStats.holiday} H</span>
                <span className="ml-auto font-bold text-gray-700">{modal.data.monthStats.percentage}% this month</span>
              </div>
            )}

            {modalLoading ? (
              <p className="text-center text-gray-400 py-8 text-sm">Loading...</p>
            ) : modal.data ? (
              <>
                <MiniCalendar year={modal.year} month={modal.month} records={modal.data.records} classDates={modal.data.classDates} />
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-100 rounded-sm" /> Present</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-100 rounded-sm" /> Absent</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-gray-100 rounded-sm" /> No class</span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

export default AttendanceModule