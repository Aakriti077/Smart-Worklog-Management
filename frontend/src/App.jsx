import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Login from './pages/Login'
import Profile from './pages/Profile'
import EmployeeDashboard from './pages/employee/Dashboard'
import SubmitLog from './pages/employee/SubmitLog'
import EmployeeLogs from './pages/employee/AllLogs'
import MyKpis from './pages/employee/MyKpis'
import Summaries from './pages/employee/Summaries'
import MyTasks from './pages/employee/MyTasks'
import ManagerDashboard from './pages/manager/Dashboard'
import TeamKpis from './pages/manager/TeamKpis'
import ManagerLogs from './pages/manager/Logs'
import ManagerSummaries from './pages/manager/ManagerSummaries'
import ManagerTasks from './pages/manager/Tasks'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import Departments from './pages/admin/Departments'
import Rankings from './pages/admin/Rankings'
import AllLogs from './pages/admin/AllLogs'
import MLInsights from './pages/admin/MLInsights'

const PAGE_TITLES = {
  '/employee/dashboard':  'Dashboard',
  '/employee/submit-log': 'Submit Work Log',
  '/employee/logs':       'My Work Logs',
  '/employee/tasks':      'My Tasks',
  '/employee/kpis':       'My KPI Scores',
  '/employee/summaries':  'My Summaries',
  '/manager/dashboard':   'Team Dashboard',
  '/manager/tasks':       'Task Management',
  '/manager/kpis':        'Team KPIs',
  '/manager/logs':        'Work Logs',
  '/manager/summaries':   'Summaries',
  '/admin/dashboard':     'Admin Dashboard',
  '/admin/users':         'User Management',
  '/admin/departments':   'Departments',
  '/admin/rankings':      'Employee Rankings',
  '/admin/logs':          'All Work Logs',
  '/admin/ml':            'ML Insights',
  '/profile':             'My Profile',
}

function ProtectedLayout({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Topbar titles={PAGE_TITLES} />
        {children}
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Employee */}
      <Route path="/employee/dashboard" element={<ProtectedLayout roles={['employee']}><EmployeeDashboard /></ProtectedLayout>} />
      <Route path="/employee/submit-log" element={<ProtectedLayout roles={['employee']}><SubmitLog /></ProtectedLayout>} />
      <Route path="/employee/logs"       element={<ProtectedLayout roles={['employee']}><EmployeeLogs /></ProtectedLayout>} />
      <Route path="/employee/tasks"      element={<ProtectedLayout roles={['employee']}><MyTasks /></ProtectedLayout>} />
      <Route path="/employee/kpis"       element={<ProtectedLayout roles={['employee']}><MyKpis /></ProtectedLayout>} />
      <Route path="/employee/summaries"  element={<ProtectedLayout roles={['employee']}><Summaries /></ProtectedLayout>} />

      {/* Manager */}
      <Route path="/manager/dashboard"  element={<ProtectedLayout roles={['manager', 'admin']}><ManagerDashboard /></ProtectedLayout>} />
      <Route path="/manager/tasks"      element={<ProtectedLayout roles={['manager', 'admin']}><ManagerTasks /></ProtectedLayout>} />
      <Route path="/manager/kpis"       element={<ProtectedLayout roles={['manager', 'admin']}><TeamKpis /></ProtectedLayout>} />
      <Route path="/manager/logs"       element={<ProtectedLayout roles={['manager', 'admin']}><ManagerLogs /></ProtectedLayout>} />
      <Route path="/manager/summaries"  element={<ProtectedLayout roles={['manager', 'admin']}><ManagerSummaries /></ProtectedLayout>} />

      {/* Admin */}
      <Route path="/admin/dashboard"   element={<ProtectedLayout roles={['admin']}><AdminDashboard /></ProtectedLayout>} />
      <Route path="/admin/users"       element={<ProtectedLayout roles={['admin']}><AdminUsers /></ProtectedLayout>} />
      <Route path="/admin/departments" element={<ProtectedLayout roles={['admin']}><Departments /></ProtectedLayout>} />
      <Route path="/admin/rankings"    element={<ProtectedLayout roles={['admin']}><Rankings /></ProtectedLayout>} />
      <Route path="/admin/logs"        element={<ProtectedLayout roles={['admin']}><AllLogs /></ProtectedLayout>} />
      <Route path="/admin/ml"          element={<ProtectedLayout roles={['admin']}><MLInsights /></ProtectedLayout>} />

      {/* Shared */}
      <Route path="/profile" element={<ProtectedLayout roles={['employee', 'manager', 'admin']}><Profile /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
