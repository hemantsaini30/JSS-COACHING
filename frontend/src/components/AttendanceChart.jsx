const AttendanceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No attendance data yet. Mark attendance to see the chart.
      </div>
    )
  }

  const maxVal = Math.max(...data.map(d => d.present + d.absent), 1)
  const CHART_HEIGHT = 130

  const formatDate = (dateStr) => {
    const parts = dateStr.split('-')
    return `${parts[2]}/${parts[1]}`
  }

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div
          className="flex items-end gap-3 min-w-max px-4 pt-2"
          style={{ height: CHART_HEIGHT + 36 }}
        >
          {data.map((d) => {
            const presentH = Math.max((d.present / maxVal) * CHART_HEIGHT, d.present > 0 ? 4 : 0)
            const absentH = Math.max((d.absent / maxVal) * CHART_HEIGHT, d.absent > 0 ? 4 : 0)
            return (
              <div key={d.date} className="flex flex-col items-center gap-1">
                <div className="flex items-end gap-0.5" style={{ height: CHART_HEIGHT }}>
                  <div
                    className="w-5 bg-emerald-400 rounded-t transition-all"
                    style={{ height: presentH }}
                    title={`Present: ${d.present}`}
                  />
                  <div
                    className="w-5 bg-red-300 rounded-t transition-all"
                    style={{ height: absentH }}
                    title={`Absent: ${d.absent}`}
                  />
                </div>
                <span className="text-xs text-gray-400 select-none">{formatDate(d.date)}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-6 px-4 mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-emerald-400 rounded-sm inline-block" />
          Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-red-300 rounded-sm inline-block" />
          Absent
        </span>
        <span className="ml-auto text-gray-400">{data.length} day{data.length !== 1 ? 's' : ''} of data</span>
      </div>
    </div>
  )
}

export default AttendanceChart