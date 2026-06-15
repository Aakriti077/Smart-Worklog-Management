import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import api from '../../api/axios'

const CATEGORIES = ['Bug Fixing', 'Feature Development', 'Code Review', 'Documentation', 'Meeting', 'Testing', 'Research', 'Deployment', 'Planning']

export default function AllLogs() {
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [empFilter, setEmpFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')

  useEffect(() => {
    Promise.all([api.get('/worklogs/'), api.get('/users/')])
      .then(([l, u]) => { setLogs(l.data); setUsers(u.data.filter(u => u.role === 'employee')) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter(l => {
    const matchSearch = !search || l.log_text?.toLowerCase().includes(search.toLowerCase())
    const matchEmp = !empFilter || l.user === parseInt(empFilter)
    const matchCat = !catFilter || l.svm_category_name === catFilter
    return matchSearch && matchEmp && matchCat
  })

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="form-input" style={{ width: 160, padding: '5px 10px' }} value={empFilter} onChange={e => setEmpFilter(e.target.value)}>
              <option value="">All Employees</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select className="form-input" style={{ width: 170, padding: '5px 10px' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <span className="text-muted text-sm" style={{ alignSelf: 'center' }}>{filtered.length} logs</span>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Task</th>
                <th>Planned</th>
                <th>Completed</th>
                <th>ML Category</th>
                <th>Cluster</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id}>
                  <td className="text-sm text-muted">{l.date}</td>
                  <td><strong>{l.user_name}</strong></td>
                  <td style={{ maxWidth: 260 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                      {l.log_text}
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{l.tasks_planned}</span></td>
                  <td>
                    <span className={`badge badge-${l.tasks_completed >= l.tasks_planned ? 'green' : 'yellow'}`}>
                      {l.tasks_completed}
                    </span>
                  </td>
                  <td>{l.svm_category_name ? <span className="badge badge-blue">{l.svm_category_name}</span> : <span className="text-muted">—</span>}</td>
                  <td>{l.cluster_name ? <span className="badge badge-purple">{l.cluster_name}</span> : <span className="text-muted">—</span>}</td>
                  <td>{l.hours_worked ?? '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8}>
                  <div className="empty-state" style={{ padding: 20 }}><h3>No Logs Found</h3></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
