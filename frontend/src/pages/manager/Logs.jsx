import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import api from '../../api/axios'

const PERIODS = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '1w',        label: '1 Week' },
  { key: '1m',        label: '1 Month' },
  { key: '3m',        label: '3 Months' },
  { key: '6m',        label: '6 Months' },
  { key: '1y',        label: '1 Year' },
  { key: 'all',       label: 'All Time' },
]

const PERIOD_DAYS = { '1w': 7, '1m': 30, '3m': 90, '6m': 182, '1y': 365 }
const PAGE_SIZE = 10

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function Pagination({ page, total, onChange }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) return null
  const pages = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else if (page <= 4) {
    pages.push(1, 2, 3, 4, 5, '…', totalPages)
  } else if (page >= totalPages - 3) {
    pages.push(1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
  } else {
    pages.push(1, '…', page - 1, page, page + 1, '…', totalPages)
  }
  const btn = (label, target, disabled, active = false) => (
    <button key={label} onClick={() => onChange(target)} disabled={disabled} style={{
      minWidth: 32, height: 32, padding: '0 10px', border: active ? 'none' : '1px solid #e2e8f0',
      borderRadius: 7, background: active ? '#4f46e5' : disabled ? '#f8fafc' : '#fff',
      color: active ? '#fff' : disabled ? '#cbd5e1' : '#1e293b',
      fontWeight: active ? 700 : 500, fontSize: 13, cursor: disabled ? 'default' : 'pointer',
    }}>{label}</button>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 12.5, color: '#94a3b8' }}>
        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} logs
      </span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {btn('←', page - 1, page === 1)}
        {pages.map((p, i) => p === '…'
          ? <span key={`d${i}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: 13 }}>…</span>
          : btn(p, p, false, p === page)
        )}
        {btn('→', page + 1, page === totalPages)}
      </div>
    </div>
  )
}

export default function ManagerLogs() {
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [filterUser, setFilterUser] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    Promise.all([api.get('/worklogs/'), api.get('/users/')])
      .then(([l, u]) => { setLogs(l.data); setUsers(u.data.filter(u => u.role === 'employee')) })
      .finally(() => setLoading(false))
  }, [])

  const handlePeriod = p => {
    setPeriod(p)
    setDateFilter('')
  }

  const handleDatePick = d => {
    setDateFilter(d)
    if (d) setPeriod('')
    else setPeriod('all')
  }

  const dateInRange = log => {
    if (dateFilter) return log.date === dateFilter
    const today = todayStr()
    if (period === 'today') return log.date === today
    if (period === 'yesterday') {
      const d = new Date(today); d.setDate(d.getDate() - 1)
      return log.date === d.toISOString().slice(0, 10)
    }
    if (period === 'all' || !period) return true
    if (PERIOD_DAYS[period]) {
      const from = new Date(today)
      from.setDate(from.getDate() - PERIOD_DAYS[period])
      return log.date >= from.toISOString().slice(0, 10)
    }
    return true
  }

  const filtered = logs.filter(l => {
    const matchUser = !filterUser || l.user == filterUser
    const matchSearch = !search || l.log_text.toLowerCase().includes(search.toLowerCase()) || l.user_name?.toLowerCase().includes(search.toLowerCase())
    return matchUser && matchSearch && dateInRange(l)
  })

  useEffect(() => setPage(1), [search, filterUser, period, dateFilter])
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="card">
        {/* Filters */}
        <div className="card-header" style={{ padding: '16px 24px', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              className="form-input"
              style={{ border: 'none', padding: '4px 0', outline: 'none', width: 200 }}
              placeholder="Search logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <select className="form-input" style={{ width: 160, padding: '5px 10px' }} value={filterUser} onChange={e => setFilterUser(e.target.value)}>
              <option value="">All Employees</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select
              value={dateFilter ? '__date__' : period}
              onChange={e => handlePeriod(e.target.value)}
              className="form-input"
              style={{ width: 120, padding: '5px 10px' }}
            >
              {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              {dateFilter && <option value="__date__">{dateFilter}</option>}
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={e => handleDatePick(e.target.value)}
              max={todayStr()}
              title="Pick a specific date"
              style={{
                padding: '5px 8px', borderRadius: 8,
                border: dateFilter ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                fontSize: 12, color: dateFilter ? '#4f46e5' : '#94a3b8',
                background: '#fff', outline: 'none', cursor: 'pointer', width: 36,
              }}
            />
            {dateFilter && (
              <button onClick={() => handleDatePick('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
            )}
            <span className="text-muted text-sm" style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}>{filtered.length} logs</span>
          </div>
        </div>

        <div className="table-wrap" style={{ minHeight: 580 }}>
          <table className="table">
            <thead>
              <tr><th style={{ whiteSpace: 'nowrap' }}>Date</th><th>Employee</th><th>Log</th><th>Category (SVM)</th><th>Cluster (K-Means)</th><th>Planned</th><th>Done</th></tr>
            </thead>
            <tbody>
              {paged.map(log => (
                <tr key={log.id}>
                  <td className="text-muted text-sm" style={{ whiteSpace: 'nowrap' }}>{log.date}</td>
                  <td style={{ whiteSpace: 'nowrap' }}><strong>{log.user_name}</strong></td>
                  <td style={{ maxWidth: 360, fontSize: 13, lineHeight: 1.55, wordBreak: 'break-word' }}>{log.log_text}</td>
                  <td>{log.svm_category_name ? <span className="badge badge-blue">{log.svm_category_name}</span> : <span className="text-muted">—</span>}</td>
                  <td>{log.cluster_name ? <span className="badge badge-purple">{log.cluster_name}</span> : <span className="text-muted">—</span>}</td>
                  <td>{log.tasks_planned}</td>
                  <td><strong>{log.tasks_completed}</strong></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="empty-state" style={{ padding: 20 }}>
                    <h3>No Logs Found</h3>
                    <p>Try a wider time range or clear the date filter.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} onChange={setPage} />
      </div>
    </div>
  )
}
