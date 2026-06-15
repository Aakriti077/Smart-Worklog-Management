import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import api from '../../api/axios'

export default function ManagerLogs() {
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [filterUser, setFilterUser] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/worklogs/'), api.get('/users/')])
      .then(([l, u]) => { setLogs(l.data); setUsers(u.data.filter(u => u.role === 'employee')) })
      .finally(() => setLoading(false))
  }, [])

  const categories = [...new Set(logs.filter(l => l.svm_category_name).map(l => l.svm_category_name))]

  const filtered = logs.filter(l => {
    const matchUser = !filterUser || l.user == filterUser
    const matchCat = !filterCategory || l.svm_category_name === filterCategory
    const matchSearch = !search || l.log_text.toLowerCase().includes(search.toLowerCase()) || l.user_name?.toLowerCase().includes(search.toLowerCase())
    return matchUser && matchCat && matchSearch
  })

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="card">
        {/* Filters */}
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 280 }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              className="form-input"
              style={{ border: 'none', padding: '4px 0', outline: 'none', fontSize: 13.5 }}
              placeholder="Search logs or employees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="btn btn-secondary btn-sm" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
              <option value="">All Employees</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select className="btn btn-secondary btn-sm" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <span className="text-muted text-sm">{filtered.length} logs</span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Employee</th><th>Description</th><th>Category (SVM)</th><th>Cluster (K-Means)</th><th>Planned</th><th>Done</th></tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id}>
                  <td className="text-muted text-sm">{log.date}</td>
                  <td><strong>{log.user_name}</strong></td>
                  <td style={{ maxWidth: 260 }}>{log.log_text.length > 70 ? log.log_text.slice(0, 70) + '…' : log.log_text}</td>
                  <td>{log.svm_category_name ? <span className="badge badge-blue">{log.svm_category_name}</span> : <span className="text-muted">—</span>}</td>
                  <td>{log.cluster_name ? <span className="badge badge-purple">{log.cluster_name}</span> : <span className="text-muted">—</span>}</td>
                  <td>{log.tasks_planned}</td>
                  <td><strong>{log.tasks_completed}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty-state"><h3>No Logs Found</h3><p>Try adjusting the filters.</p></div>}
        </div>
      </div>
    </div>
  )
}
