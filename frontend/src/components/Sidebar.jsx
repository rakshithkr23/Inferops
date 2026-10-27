import { NavLink } from 'react-router-dom'

const navigation = [
  { label: 'Home', icon: '▦', path: '/' },
  { label: 'Incidents', icon: '⚠', path: '/incidents' },
  { label: 'Root Cause Analysis', icon: '⌕', path: '/root-cause-analysis' },
  { label: 'Services', icon: '◈', path: '/services' },
  { label: 'Logs & Metrics', icon: '▤', path: '/logs-metrics' },
  { label: 'Feedback', icon: '✉', path: '/feedback' },
  { label: 'Settings', icon: '⚙', path: '/settings' },
]

function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <NavLink to="/" className="brand" title="InferOps Home">
          <span className="brand-mark">I</span>
          {!collapsed && (
            <span className="brand-copy">
              <strong>InferOps</strong>
              <small>INCIDENT INTELLIGENCE</small>
            </span>
          )}
        </NavLink>

        <button
          className="sidebar-toggle"
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '☰' : '◧'}
        </button>
      </div>

      {!collapsed && <p className="workspace-label">WORKSPACE</p>}

      <nav className="navigation" aria-label="Main navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>

            {!collapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="environment-card" title="Local development environment">
          <span className="environment-dot" />
          {!collapsed && (
            <div className="sidebar-copy">
              <strong>Development</strong>
              <small>Local environment</small>
            </div>
          )}
        </div>

        <div className="profile">
          <div className="profile-avatar">IO</div>
          {!collapsed && (
            <div className="sidebar-copy">
              <strong>InferOps Admin</strong>
              <small>Project workspace</small>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
