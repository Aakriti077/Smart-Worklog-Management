import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, FileText, Target, BookOpen,
  Users, Building2, Trophy, ClipboardList, LogOut,
  UserCircle, ListChecks, Cpu, CheckSquare
} from 'lucide-react'

const employeeNav = [
  { label: 'Dashboard',   icon: LayoutDashboard, path: '/employee/dashboard' },
  { label: 'Submit Log',  icon: FileText,         path: '/employee/submit-log' },
  { label: 'My Logs',     icon: ListChecks,       path: '/employee/logs' },
  { label: 'My Tasks',    icon: CheckSquare,      path: '/employee/tasks' },
  { label: 'My KPIs',     icon: Target,           path: '/employee/kpis' },
  { label: 'Summaries',   icon: BookOpen,         path: '/employee/summaries' },
]

const managerNav = [
  { label: 'Dashboard',   icon: LayoutDashboard, path: '/manager/dashboard' },
  { label: 'Tasks',       icon: CheckSquare,      path: '/manager/tasks' },
  { label: 'Team KPIs',   icon: Target,           path: '/manager/kpis' },
  { label: 'Work Logs',   icon: ClipboardList,    path: '/manager/logs' },
  { label: 'Summaries',   icon: BookOpen,         path: '/manager/summaries' },
]

const adminNav = [
  { label: 'Dashboard',   icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Users',       icon: Users,            path: '/admin/users' },
  { label: 'Departments', icon: Building2,        path: '/admin/departments' },
  { label: 'Rankings',    icon: Trophy,           path: '/admin/rankings' },
  { label: 'All Logs',    icon: ClipboardList,    path: '/admin/logs' },
  { label: 'ML Insights', icon: Cpu,              path: '/admin/ml' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = user?.role === 'admin' ? adminNav
    : user?.role === 'manager' ? managerNav
    : employeeNav

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const firstName = user?.name?.split(' ')[0] || 'User'

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-text">Smart Worklog System</div>
      </div>

      {/* Scrollable middle: nav + account pinned above footer */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Main navigation — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {navItems.map(item => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={16} className="nav-icon" />
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Account section — always pinned above footer, never scrolls away */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => navigate('/profile')}
          >
            <UserCircle size={16} className="nav-icon" />
            My Profile
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout}>
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
