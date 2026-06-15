import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Award, AlertCircle, CheckCircle, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line } from 'recharts'
import api from '../../api/axios'

const METRICS = ['productivity', 'consistency', 'quality', 'diversity', 'leadership', 'collaboration', 'innovation', 'learning']
const METRIC_COLORS = { productivity: '#4f46e5', consistency: '#0891b2', quality: '#059669', diversity: '#d97706', leadership: '#7c3aed', collaboration: '#0284c7', innovation: '#dc2626', learning: '#b45309' }
const METRIC_TIPS = {
  productivity: 'Complete more of your planned tasks each day.',
  consistency: 'Log work consistently every day. Aim for 40+ hours/week.',
  quality: 'High quality = high productivity + high consistency combined.',
  diversity: 'Work across different categories (backend, frontend, testing, etc.).',
  leadership: 'Use words like "led", "mentored", "guided" in your logs.',
  collaboration: 'Mention teamwork: "collaborated", "helped", "partnered".',
  innovation: 'Highlight improvements: "optimized", "automated", "refactored".',
  learning: 'Note learning: "researched", "studied", "explored".',
}

function scoreColor(s) { return parseFloat(s) >= 75 ? '#059669' : parseFloat(s) >= 50 ? '#d97706' : '#4f46e5' }
function scoreClass(s) { return parseFloat(s) >= 75 ? 'high' : parseFloat(s) >= 50 ? 'medium' : 'low' }

function getGrade(score) {
  const n = parseFloat(score)
  if (n >= 80) return { letter: 'A', label: 'Excellent', color: '#059669', bg: '#ecfdf5' }
  if (n >= 65) return { letter: 'B', label: 'Good', color: '#0891b2', bg: '#ecfeff' }
  if (n >= 50) return { letter: 'C', label: 'Average', color: '#d97706', bg: '#fffbeb' }
  return { letter: 'D', label: 'Needs Improvement', color: '#4f46e5', bg: '#eef2ff' }
}

function getTrend(curr, prev) {
  if (!prev) return null
  const diff = parseFloat(curr.overall) - parseFloat(prev.overall)
  if (diff > 2) return { icon: TrendingUp, color: '#059669', text: `+${diff.toFixed(1)}` }
  if (diff < -2) return { icon: TrendingDown, color: '#dc2626', text: diff.toFixed(1) }
  return { icon: Minus, color: '#94a3b8', text: '±0' }
}

export default function MyKpis() {
  const [kpis, setKpis] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    api.get('/kpi/me/').then(r => setKpis(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-page"><div className="spinner" /></div>
  if (kpis.length === 0) return (
    <div className="page">
      <div className="card"><div className="card-body"><div className="empty-state">
        <h3>No KPI Records Yet</h3>
        <p>KPI scores are calculated weekly from your work logs. Submit logs and ask your manager to calculate KPIs.</p>
      </div></div></div>
    </div>
  )

  const current = kpis[selected]
  const prev = kpis[selected + 1] || null
  const grade = getGrade(current.overall)
  const trend = getTrend(current, prev)

  const sorted = [...METRICS].sort((a, b) => parseFloat(current[a]) - parseFloat(current[b]))
  const weakest = sorted.slice(0, 3)
  const strongest = sorted.slice(-3).reverse()

  const barData = METRICS.map(m => ({ name: m.charAt(0).toUpperCase() + m.slice(1), score: parseFloat(current[m]) }))
  const radarData = METRICS.map(m => ({ m: m.charAt(0).toUpperCase() + m.slice(1), v: parseFloat(current[m]) }))
  const trendData = [...kpis].reverse().map(k => ({ week: k.week_start.slice(5), score: parseFloat(k.overall) }))

  return (
    <div className="page">
      {/* Week selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <button key={k.id} className={`btn ${i === selected ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setSelected(i)}>
            Week of {k.week_start}
          </button>
        ))}
      </div>

      {/* Hero score card */}
      <div style={{
        background: '#fff',
        border: `1.5px solid ${grade.color}30`,
        borderRadius: 16, padding: '22px 26px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 22,
        boxShadow: `0 2px 16px ${grade.color}12`,
      }}>
        {/* Grade pill */}
        <div style={{
          width: 84, height: 84, borderRadius: '50%', flexShrink: 0,
          background: grade.bg,
          border: `2.5px solid ${grade.color}50`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 34, fontWeight: 900, color: grade.color, lineHeight: 1 }}>{grade.letter}</div>
          <div style={{ fontSize: 8, fontWeight: 700, color: grade.color, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 3, textAlign: 'center', lineHeight: 1.3, padding: '0 8px', width: '100%', wordBreak: 'break-word' }}>{grade.label}</div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 60, background: '#e2e8f0', flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            Overall Score — Week of {current.week_start}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: grade.color, lineHeight: 1 }}>{parseFloat(current.overall).toFixed(1)}</span>
            <span style={{ fontSize: 15, color: '#94a3b8', fontWeight: 500 }}>/100</span>
            {trend && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: trend.color, background: trend.color + '12', border: `1px solid ${trend.color}25`, borderRadius: 20, padding: '2px 10px', marginLeft: 4, fontWeight: 600 }}>
                <trend.icon size={12} /> {trend.text}
              </span>
            )}
          </div>
          {/* Score bar */}
          <div style={{ marginTop: 10, background: '#f1f5f9', borderRadius: 6, height: 7, width: '100%', maxWidth: 320, overflow: 'hidden' }}>
            <div style={{ width: `${parseFloat(current.overall)}%`, height: '100%', background: `linear-gradient(90deg, ${grade.color}88, ${grade.color})`, borderRadius: 6, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ marginTop: 5, fontSize: 11.5, color: '#cbd5e1' }}>
            {parseFloat(current.overall).toFixed(0)} out of 100 points
          </div>
        </div>
      </div>

      {/* Metric cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 20 }}>
        {METRICS.map(m => (
          <div key={m} className="card" style={{ padding: '14px 16px', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 6 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor(current[m]), lineHeight: 1.1, marginTop: 2 }}>
                  {parseFloat(current[m]).toFixed(0)}
                </div>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: (METRIC_COLORS[m] || '#4f46e5') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: METRIC_COLORS[m] || '#4f46e5' }} />
              </div>
            </div>
            <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${parseFloat(current[m])}%`, height: '100%', background: scoreColor(current[m]), borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Score Breakdown</div></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={barData} margin={{ top: 5, right: 8, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: '#64748b' }} interval={0} angle={-35} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => [v.toFixed(1), 'Score']} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <rect key={i} fill={scoreColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Skill Radar</div></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={210}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="m" tick={{ fontSize: 9.5, fill: '#64748b' }} />
                <Radar dataKey="v" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.22} strokeWidth={2} dot={{ fill: '#4f46e5', r: 3 }} />
                <Tooltip formatter={v => [v.toFixed(1), 'Score']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strengths + Improvements + Trend row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
        {/* Strengths */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={15} color="#059669" />
              <div className="card-title">Top Strengths</div>
            </div>
          </div>
          <div className="card-body">
            {strongest.map(m => (
              <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: (METRIC_COLORS[m] || '#059669') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: METRIC_COLORS[m] || '#059669' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1e293b', textTransform: 'capitalize' }}>{m}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#059669' }}>{parseFloat(current[m]).toFixed(0)}</span>
                  </div>
                  <div style={{ height: 4, background: '#dcfce7', borderRadius: 2 }}>
                    <div style={{ width: `${parseFloat(current[m])}%`, height: '100%', background: '#059669', borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Areas to improve */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={15} color="#d97706" />
              <div className="card-title">Improve These</div>
            </div>
          </div>
          <div className="card-body">
            {weakest.map(m => (
              <div key={m} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1e293b', textTransform: 'capitalize' }}>{m}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: scoreColor(current[m]) }}>{parseFloat(current[m]).toFixed(0)}</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.5 }}>{METRIC_TIPS[m]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trend */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={15} color="var(--primary)" />
              <div className="card-title">Score Trend</div>
            </div>
          </div>
          <div className="card-body">
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 9.5 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9.5 }} />
                  <Tooltip formatter={v => [v.toFixed(1), 'Overall']} />
                  <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: '#4f46e5', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 24 }}>
                <p style={{ fontSize: 13 }}>More data needed for trend. Keep submitting logs each week!</p>
              </div>
            )}
            {trend && trendData.length > 1 && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: trend.color }}>
                <trend.icon size={14} />
                {parseFloat(trend.text) > 0 ? `Up ${trend.text} from last week` : parseFloat(trend.text) < 0 ? `Down ${Math.abs(parseFloat(trend.text)).toFixed(1)} from last week` : 'No change from last week'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
