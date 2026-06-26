import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Award, Target, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../../api/axios'

const METRICS = ['productivity', 'consistency', 'quality', 'diversity', 'leadership', 'collaboration', 'innovation', 'learning']

const METRIC_TIPS_FALLBACK = {
  productivity:  'Complete more of your planned tasks each day.',
  consistency:   'Log work consistently every working day.',
  quality:       'High quality comes from combining strong productivity with consistency.',
  diversity:     'Work across different categories — backend, frontend, testing, etc.',
  leadership:    'Use words like "led", "mentored", "guided" in your logs.',
  collaboration: 'Mention teamwork: "collaborated", "helped", "partnered".',
  innovation:    'Highlight improvements: "optimised", "automated", "refactored".',
  learning:      'Note learning: "researched", "studied", "explored".',
}

const METRIC_STRENGTHS_FALLBACK = {
  productivity:  'You consistently complete your planned tasks.',
  consistency:   'You log work regularly and maintain steady output.',
  quality:       'Your work shows a strong balance of output and reliability.',
  diversity:     'You engage across a wide range of work areas.',
  leadership:    'Your logs reflect leadership and guidance of others.',
  collaboration: 'You work well with your team and contribute collaboratively.',
  innovation:    'You actively improve and optimise how work gets done.',
  learning:      'You invest in growing your skills and knowledge.',
}

function getGrade(score) {
  const n = parseFloat(score)
  if (n >= 80) return { letter: 'A', label: 'Excellent',          color: '#059669', bg: '#ecfdf5' }
  if (n >= 65) return { letter: 'B', label: 'Good',               color: '#0891b2', bg: '#ecfeff' }
  if (n >= 50) return { letter: 'C', label: 'Average',            color: '#d97706', bg: '#fffbeb' }
  return       { letter: 'D', label: 'Needs Improvement',         color: '#7c3aed', bg: '#f5f3ff' }
}

function getTrend(curr, prev) {
  if (!prev) return null
  const diff = parseFloat(curr.overall) - parseFloat(prev.overall)
  if (diff > 2) return { icon: TrendingUp,   color: '#059669', text: 'Improved from last period' }
  if (diff < -2) return { icon: TrendingDown, color: '#dc2626', text: 'Dipped from last period' }
  return { icon: Minus, color: '#94a3b8', text: 'Steady — no major change' }
}

const PERIODS = [
  { key: 'all',       label: 'All Time' },
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '1w',        label: '1 Week' },
  { key: '1m',        label: '1 Month' },
  { key: '3m',        label: '3 Months' },
  { key: '6m',        label: '6 Months' },
  { key: '1y',        label: '1 Year' },
]
const PERIOD_DAYS = { '1w': 7, '1m': 30, '3m': 90, '6m': 182, '1y': 365 }
function localDateStr(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function todayStr() { return localDateStr(new Date()) }
function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return localDateStr(d) }

function getExpectedWeekStart(period, dateFilter) {
  if (dateFilter) return dateFilter
  if (period === 'today')     return todayStr()
  if (period === 'yesterday') return yesterdayStr()
  if (PERIOD_DAYS[period]) {
    const d = new Date(todayStr())
    d.setDate(d.getDate() - PERIOD_DAYS[period])
    return d.toISOString().slice(0, 10)
  }
  return null
}

export default function MyKpis() {
  const [kpis, setKpis]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [toast, setToast]             = useState(null)
  const [period, setPeriod]           = useState('all')
  const [dateFilter, setDateFilter]   = useState('')

  const handlePeriod   = p => { setPeriod(p); setDateFilter('') }
  const handleDatePick = d => { setDateFilter(d); if (d) setPeriod(''); else setPeriod('all') }

  const showToast = (type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  const calculateKpi = async () => {
    setCalculating(true)
    try {
      const payload = dateFilter ? { date: dateFilter } : { period: period !== 'all' ? period : '1w' }
      const res = await api.post('/kpi/me/calculate/', payload)
      setKpis(prev => {
        const exists = prev.find(k => k.week_start === res.data.week_start)
        if (exists) return prev.map(k => k.week_start === res.data.week_start ? res.data : k)
        return [res.data, ...prev].sort((a, b) => b.week_start.localeCompare(a.week_start))
      })
      showToast('success', `KPI calculated for ${dateFilter || PERIODS.find(p => p.key === period)?.label || period}!`)
    } catch (err) {
      showToast('error', err.response?.data?.error || 'No logs found for this period.')
    } finally {
      setCalculating(false)
    }
  }

  useEffect(() => {
    api.get('/kpi/me/').then(r => setKpis(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  const targetWeekStart = getExpectedWeekStart(period, dateFilter)
  const filteredKpis    = targetWeekStart ? kpis.filter(k => k.week_start === targetWeekStart) : kpis
  const current         = filteredKpis[0] || null
  const currentIdx      = current ? kpis.indexOf(current) : -1
  const prev            = currentIdx >= 0 ? (kpis[currentIdx + 1] || null) : null
  const grade           = current ? getGrade(current.overall) : null
  const trend           = current ? getTrend(current, prev) : null

  const sorted    = current ? [...METRICS].sort((a, b) => parseFloat(current[a]) - parseFloat(current[b])) : []
  const weakest   = sorted.slice(0, 3)
  const strongest = sorted.slice(-3).reverse()

  return (
    <div className="page">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 2000,
          background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: toast.type === 'success' ? '#065f46' : '#dc2626',
          borderRadius: 10, padding: '12px 18px', fontSize: 13.5,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toast.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {toast.text}
        </div>
      )}

      {/* Filter + Calculate bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <select
          value={dateFilter ? '__date__' : period}
          onChange={e => handlePeriod(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#1e293b', background: '#fff', cursor: 'pointer', outline: 'none' }}
        >
          {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          {dateFilter && <option value="__date__">{dateFilter}</option>}
        </select>
        <input
          type="date" value={dateFilter}
          onChange={e => handleDatePick(e.target.value)}
          max={todayStr()} title="Pick a specific date"
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
        <button className="btn btn-primary btn-sm" onClick={calculateKpi} disabled={calculating} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} className={calculating ? 'spin' : ''} />
          {calculating ? 'Calculating…' : 'Calculate KPI'}
        </button>
      </div>

      {/* Empty state */}
      {filteredKpis.length === 0 && (
        <div className="card"><div className="card-body">
          <div className="empty-state">
            <h3>No KPI for {dateFilter || PERIODS.find(p => p.key === period)?.label || 'this period'}</h3>
            <p>Select a period above and click <strong>Calculate KPI</strong> to generate your performance rating.</p>
          </div>
        </div></div>
      )}

      {filteredKpis.length > 0 && (
        <>
          {/* Grade card */}
          <div style={{
            background: '#fff',
            border: `1.5px solid ${grade.color}30`,
            borderRadius: 16, padding: '28px 32px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 28,
            boxShadow: `0 2px 16px ${grade.color}10`,
          }}>
            {/* Grade circle */}
            <div style={{
              width: 90, height: 90, borderRadius: '50%', flexShrink: 0,
              background: grade.bg, border: `2.5px solid ${grade.color}50`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: grade.color, lineHeight: 1 }}>{grade.letter}</div>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: grade.color, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 3, textAlign: 'center', padding: '0 6px' }}>{grade.label}</div>
            </div>

            <div style={{ width: 1, height: 60, background: '#e2e8f0', flexShrink: 0 }} />

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                Performance Rating · {current.week_start}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
                {grade.label} Performance
              </div>
              {trend && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: trend.color, background: trend.color + '12', border: `1px solid ${trend.color}25`, borderRadius: 20, padding: '4px 12px', width: 'fit-content' }}>
                  <trend.icon size={13} /> {trend.text}
                </div>
              )}
            </div>
          </div>

          {/* Strengths + Improvements */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {/* Top Strengths */}
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={15} color="#059669" />
                  <div className="card-title">Top Strengths</div>
                </div>
              </div>
              <div className="card-body">
                {strongest.map((m, i) => (
                  <div key={m} style={{ display: 'flex', gap: 14, marginBottom: i < strongest.length - 1 ? 18 : 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Award size={16} color="#059669" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b', textTransform: 'capitalize', marginBottom: 3 }}>{m}</div>
                      <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
                        {current.explanations?.[m] || METRIC_STRENGTHS_FALLBACK[m]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Improve These */}
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Target size={15} color="#d97706" />
                  <div className="card-title">Improve These</div>
                </div>
              </div>
              <div className="card-body">
                {weakest.map((m, i) => (
                  <div key={m} style={{ display: 'flex', gap: 14, marginBottom: i < weakest.length - 1 ? 18 : 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Target size={16} color="#d97706" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b', textTransform: 'capitalize', marginBottom: 3 }}>{m}</div>
                      <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
                        {current.explanations?.[m] || METRIC_TIPS_FALLBACK[m]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
