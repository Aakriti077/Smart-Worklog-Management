import { useEffect, useState } from 'react'
import { Cpu, Layers, RefreshCw, Zap, Send, CheckCircle, AlertCircle, BarChart2 } from 'lucide-react'
import api from '../../api/axios'

const CAT_COLORS = {
  'Engineering':                  '#4f46e5',
  'DevOps & Infrastructure':      '#ea580c',
  'Data Science & Analytics':     '#6d28d9',
  'Quality Assurance':            '#059669',
  'Human Resources':              '#0891b2',
  'Product':                      '#d97706',
  'Sales & Business Development': '#dc2626',
  'Finance & Accounting':         '#ca8a04',
  'UI/UX Design':                 '#db2777',
}

const CLUSTER_COLORS = ['#4f46e5','#059669','#d97706','#0891b2','#dc2626']

export default function MLInsights() {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [testText, setTestText] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)
  const [retraining, setRetraining] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    api.get('/ml/info/').then(r => setInfo(r.data)).finally(() => setLoading(false))
  }, [])

  const runTest = async () => {
    if (!testText.trim()) return
    setTesting(true); setTestResult(null)
    try {
      const res = await api.post('/ml/classify/', { text: testText })
      setTestResult(res.data)
    } catch {
      setMsg({ type: 'error', text: 'Classification failed.' })
    } finally {
      setTesting(false)
    }
  }

  const retrain = async () => {
    setRetraining(true); setMsg(null)
    try {
      await api.post('/ml/retrain/')
      setMsg({ type: 'success', text: 'Model retrained successfully! Reload page to see updated stats.' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Retrain failed.' })
    } finally {
      setRetraining(false)
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#0f172a,#1e1b4b)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 22,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(79,70,229,0.15)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 80, bottom: -30, width: 90, height: 90, borderRadius: '50%', background: 'rgba(124,58,237,0.12)', pointerEvents: 'none' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(79,70,229,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={18} color="#a5b4fc" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>ML Model Insights</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            SVM text classifier + K-Means clustering — monitor model health and test predictions
          </p>
        </div>
        <button
          className="btn"
          onClick={retrain}
          disabled={retraining}
          style={{ background: 'rgba(79,70,229,0.3)', color: '#a5b4fc', border: '1px solid rgba(79,70,229,0.4)', flexShrink: 0 }}
        >
          <RefreshCw size={14} className={retraining ? 'spin' : ''} />
          {retraining ? 'Retraining...' : 'Retrain Model'}
        </button>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {msg.text}
        </div>
      )}

      {/* Stats overview row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Training Examples', value: info?.svm?.total_training || 0, icon: BarChart2, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'SVM Categories', value: info?.svm?.categories?.length || 0, icon: Cpu, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'K-Means Clusters', value: info?.kmeans?.num_clusters || 0, icon: Layers, color: '#059669', bg: '#ecfdf5' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#1e293b' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* SVM categories */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={15} color="#4f46e5" />
              <div className="card-title">SVM Categories</div>
            </div>
            <div className="card-subtitle">{info?.svm?.total_training} labeled examples</div>
          </div>
          <div className="card-body">
            {(info?.svm?.categories || []).map(cat => {
              const count = info.svm.label_counts?.[cat] || 0
              const pct = info.svm.total_training ? Math.round(count / info.svm.total_training * 100) : 0
              const color = CAT_COLORS[cat] || '#64748b'
              return (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{cat}</span>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{count} examples ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* K-Means clusters */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={15} color="#7c3aed" />
              <div className="card-title">K-Means Clusters</div>
            </div>
            <div className="card-subtitle">Unsupervised behavioral grouping</div>
          </div>
          <div className="card-body">
            {(info?.kmeans?.clusters || []).map((cluster, i) => (
              <div key={cluster} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderRadius: 10, background: '#f8fafc', marginBottom: 8, border: `1px solid ${CLUSTER_COLORS[i % CLUSTER_COLORS.length]}30`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: `${CLUSTER_COLORS[i % CLUSTER_COLORS.length]}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b' }}>{cluster}</div>
                  <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>Cluster {i + 1} — K-Means group</div>
                </div>
                <span style={{
                  marginLeft: 'auto', fontSize: 10.5, fontWeight: 700,
                  background: `${CLUSTER_COLORS[i % CLUSTER_COLORS.length]}20`,
                  color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
                  borderRadius: 20, padding: '2px 10px',
                }}>
                  C{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Test classifier */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={15} color="#d97706" />
            <div className="card-title">Live Classifier Test</div>
          </div>
          <div className="card-subtitle">Enter any text to see how the ML models would classify it</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
            <div>
              <div className="form-group">
                <label className="form-label">Test Text</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="e.g. Fixed critical authentication bug in the API login endpoint and wrote unit tests to prevent regression..."
                  value={testText}
                  onChange={e => setTestText(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={runTest}
                disabled={testing || !testText.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Send size={14} />
                {testing ? 'Classifying...' : 'Run Classification'}
              </button>
            </div>

            {/* Result panel */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, minHeight: 160 }}>
              {testResult ? (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 14 }}>
                    Classification Result
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Cpu size={14} color="#4f46e5" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>SVM Category</span>
                    </div>
                    <span style={{
                      display: 'inline-block', background: `${CAT_COLORS[testResult.category] || '#4f46e5'}15`,
                      color: CAT_COLORS[testResult.category] || '#4f46e5',
                      border: `1.5px solid ${CAT_COLORS[testResult.category] || '#4f46e5'}40`,
                      borderRadius: 8, padding: '6px 14px', fontSize: 13.5, fontWeight: 700,
                    }}>
                      {testResult.category || 'Unclassified'}
                    </span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Layers size={14} color="#7c3aed" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>K-Means Cluster</span>
                    </div>
                    <span style={{
                      display: 'inline-block', background: '#f5f3ff', color: '#7c3aed',
                      border: '1.5px solid #ddd6fe', borderRadius: 8, padding: '6px 14px',
                      fontSize: 13.5, fontWeight: 700,
                    }}>
                      {testResult.cluster || 'Unassigned'}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 120, color: '#94a3b8' }}>
                  <Cpu size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
                  <p style={{ fontSize: 13, textAlign: 'center', margin: 0 }}>Enter text above and click Run Classification</p>
                </div>
              )}
            </div>
          </div>

          {/* Algorithm info */}
          <div style={{ marginTop: 20, borderTop: '1px solid #f1f5f9', paddingTop: 18 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>How It Works</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { step: '1', title: 'TF-IDF', desc: 'Text → numerical feature vectors using Term Frequency–Inverse Document Frequency' },
                { step: '2', title: 'SVM', desc: 'Linear Support Vector Machine classifies into one of 8 work categories' },
                { step: '3', title: 'K-Means++', desc: 'Unsupervised clustering groups similar logs into 5 behavioral clusters' },
                { step: '4', title: 'KPI Engine', desc: 'Category + cluster data feeds into the 8-metric KPI scoring engine' },
              ].map(s => (
                <div key={s.step} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#eef2ff', color: '#4f46e5', fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{s.step}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
