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

function Sidebar({ open, onToggle, onClose }) {
  return (
    <>
      {/* Round glass bubble fixed in the top-left corner. */}
      <button
        className="gm-bubble"
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="gm-menu-panel"
        aria-label={open ? 'Close menu' : 'Open menu'}
        title={open ? 'Close menu' : 'Open menu'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6 6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      {/* Click anywhere outside the panel to close it. */}
      {open && (
        <div className="gm-backdrop" onClick={onClose} aria-hidden="true" />
      )}

      {/* Panel drops from the top. `inert` keeps it out of the tab order while closed. */}
      <aside
        id="gm-menu-panel"
        className="gm-panel"
        aria-label="Main menu"
        inert={!open}
      >
        <div className="gm-head">
          <NavLink
            to="/"
            className="brand"
            title="InferOps Home"
            onClick={onClose}
          >
            <span className="brand-mark">I</span>
            <span className="brand-copy">
              <strong>InferOps</strong>
              <small>INCIDENT INTELLIGENCE</small>
            </span>
          </NavLink>
        </div>

        <nav className="navigation" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="environment-card">
            <span className="environment-dot" />
            <div className="sidebar-copy">
              <strong>Development</strong>
              <small>Local environment</small>
            </div>
          </div>

          <div className="profile">
            <div className="profile-avatar">IO</div>
            <div className="sidebar-copy">
              <strong>InferOps Admin</strong>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar