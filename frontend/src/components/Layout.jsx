
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

const pageTitles = {
  '/': 'Overview',
  '/incidents': 'Incidents',
  '/root-cause-analysis': 'Root Cause Analysis',
  '/services': 'Services',
  '/logs-metrics': 'Logs & Metrics',
  '/feedback': 'Feedback',
  '/settings': 'Settings',
}

function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [theme, setTheme] = useState('dark')
  const location = useLocation()

  const pageTitle = pageTitles[location.pathname] || 'Overview'

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className={`dashboard theme-${theme} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((current) => !current)}
      />

      <main className="main-content">
        <Topbar
          theme={theme}
          onToggleTheme={toggleTheme}
          pageTitle={pageTitle}
        />

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
