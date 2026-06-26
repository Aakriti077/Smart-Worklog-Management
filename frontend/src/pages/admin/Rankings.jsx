import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

function scoreColor(s) {
  return parseFloat(s) >= 75 ? 'var(--success)' : parseFloat(s) >= 50 ? 'var(--warning)' : 'var(--danger)'
}

const METRICS = ['productivity', 'consistency', 'quality', 'leadership', 'collaboration', 'innovation', 'learning']

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

export default function Rankings() {
  const [rankings, setRankings] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [msg, setMsg] = useState(null)
  const [tab, setTab] = useState('leaderboard')
  const [period, setPeriod] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  const todayStr = () => new Date().toISOString().slice(0, 10)

  useEffect(() => {
    api.get('/users/').then(r => setUsers(r.data))
  }, [])

  const load = (p = period, d = dateFilter) => {
    setLoading(true)
    const param = d ? `date=${d}` : `period=${p}`
    api.get(`/kpi/rankings/?${param}`)
      .then(r => setRankings(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load('all', '') }, [])

  const handlePeriod = p => {
    setPeriod(p)
    setDateFilter('')
    load(p, '')
  }

  const handleDatePick = d => {
    setDateFilter(d)
    if (d) { setPeriod(''); load('', d) }
    else { setPeriod('all'); load('all', '') }
  }

  // map frontend period keys → backend period keys
  const PERIOD_KEY_MAP = { today: 'today', yesterday: 'yesterday', '1w': '1w', '1m': '1m', '3m': '3m', '6m': '6m', '1y': '1y', all: 'all' }

  const calculateAll = async () => {
    setCalculating(true); setMsg(null)
    const employees = users.filter(u => u.role === 'employee')
    const body = dateFilter
      ? { date: dateFilter }
      : { period: PERIOD_KEY_MAP[period] || '1w' }
    let success = 0, failed = 0
    for (const emp of employees) {
      try { await api.post(`/kpi/calculate/${emp.id}/`, body); success++ }
      catch { failed++ }
    }
    const periodLabel = dateFilter ? dateFilter : (PERIODS.find(p => p.key === period)?.label || 'selected period')
    setMsg({ type: success > 0 ? 'success' : 'error', text: `Calculated ${success} KPIs for ${periodLabel}. ${failed} employees had no logs.` })
    load(period, dateFilter)
    setCalculating(false)
  }

  const top10 = rankings.slice(0, 10).map(k => ({ name: k.user_name.split(' ')[0], score: parseFloat(k.overall) }))
  const bottom10 = [...rankings].slice(-10).reverse().map(k => ({ name: k.user_name.split(' ')[0], score: parseFloat(k.overall) }))

  const METRIC_SHORT = { productivity: 'Productivity', consistency: 'Consistency', quality: 'Quality', leadership: 'Leadership', collaboration: 'Collaboration', innovation: 'Innovation', learning: 'Learning' }
  const top3 = rankings.slice(0, 3)
  const metricData = METRICS.map(m => {
    const obj = { metric: METRIC_SHORT[m] }
    top3.forEach(k => { obj[k.user_name.split(' ')[0]] = parseFloat(k[m]) })
    return obj
  })

  const periodLabel = dateFilter ? dateFilter : (PERIODS.find(p => p.key === period)?.label || 'All Time')

  return (
    <div className="page">

      {/* Top bar — tabs left, filters + button right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab ${tab === 'leaderboard' ? 'active' : ''}`} onClick={() => setTab('leaderboard')}>Leaderboard</button>
          <button className={`tab ${tab === 'chart' ? 'active' : ''}`} onClick={() => setTab('chart')}>Charts</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={dateFilter ? '__date__' : period}
            onChange={e => handlePeriod(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#1e293b', background: '#fff', cursor: 'pointer', outline: 'none' }}
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
              padding: '6px 8px', borderRadius: 8,
              border: dateFilter ? '2px solid #4f46e5' : '1px solid #e2e8f0',
              fontSize: 12, color: dateFilter ? '#4f46e5' : '#94a3b8',
              background: '#fff', outline: 'none', cursor: 'pointer', width: 36,
            }}
          />
          {dateFilter && (
            <button onClick={() => handleDatePick('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={calculateAll} disabled={calculating}>
            <RefreshCw size={13} /> {calculating ? 'Calculating...' : 'Calculate All KPIs'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'} mb-16`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16, lineHeight: 1, padding: 0, marginLeft: 12, opacity: 0.6 }}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : rankings.length === 0 ? (
        <div className="card"><div className="card-body">
          <div className="empty-state">
            <h3>No Rankings for {periodLabel}</h3>
            <p>
              {(period === 'today' || period === 'yesterday')
                ? `No KPI scores calculated for ${periodLabel.toLowerCase()}. Employees must submit logs first, then use "Calculate All KPIs".`
                : 'No KPI scores found for this period. Try "Calculate All KPIs" or select a wider time range.'}
            </p>
          </div>
        </div></div>
      ) : tab === 'leaderboard' ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Leaderboard</div>
            <div className="card-subtitle">{periodLabel} · {rankings.length} employees</div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Rank</th><th>Employee</th><th>Dept</th><th>Productivity</th><th>Consistency</th><th>Leadership</th><th>Collab</th><th>Innovation</th><th>Overall</th></tr>
              </thead>
              <tbody>
                {rankings.map((k, i) => (
                  <tr key={k.id}>
                    <td>
                      <span style={{ fontSize: 15, fontWeight: 800, color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--text-muted)' }}>
                        #{i + 1}
                      </span>
                    </td>
                    <td><strong>{k.user_name}</strong></td>
                    <td className="text-muted text-sm">{users.find(u => u.id === k.user)?.department_name || '—'}</td>
                    <td>{parseFloat(k.productivity).toFixed(0)}</td>
                    <td>{parseFloat(k.consistency).toFixed(0)}</td>
                    <td>{parseFloat(k.leadership).toFixed(0)}</td>
                    <td>{parseFloat(k.collaboration).toFixed(0)}</td>
                    <td>{parseFloat(k.innovation).toFixed(0)}</td>
                    <td>
                      <strong style={{ color: scoreColor(k.overall), fontSize: 15 }}>
                        {parseFloat(k.overall).toFixed(1)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Top 10 / Bottom 10 side-by-side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Top 10 Performers</div>
                <div className="card-subtitle">{periodLabel}</div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={top10} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={v => [v.toFixed(1), 'Overall Score']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Bottom 10 Performers</div>
                <div className="card-subtitle">{periodLabel}</div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={bottom10} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={v => [v.toFixed(1), 'Overall Score']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="score" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top 3 metric breakdown — grouped bar */}
          {top3.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Top 3 Skill Breakdown</div>
                <div className="card-subtitle">Score per metric for the top 3 employees</div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={metricData} barCategoryGap="20%" barGap={3} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={v => [v.toFixed(1), 'Score']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    {top3.map((k, i) => (
                      <Bar key={k.id} dataKey={k.user_name.split(' ')[0]} fill={['#4f46e5', '#059669', '#d97706'][i]} radius={[3, 3, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
