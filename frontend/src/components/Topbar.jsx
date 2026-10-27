import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Topbar({ theme, onToggleTheme, pageTitle }) {
  const navigate = useNavigate()

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Database connection failure',
      detail: 'PostgreSQL · Critical incident',
      time: '18 min ago',
      read: false,
    },
    {
      id: 2,
      title: 'Backend API response timeout',
      detail: 'inferops-backend · High severity',
      time: '5 min ago',
      read: false,
    },
  ])

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    )
  }

  function handleSearchSubmit(event) {
    event.preventDefault()

    const query = searchQuery.trim()

    if (!query) return

    // Preserve the search query while opening the RCA page.
    navigate(
      `/root-cause-analysis?q=${encodeURIComponent(query)}`,
    )
    setNotificationsOpen(false)
    setProfileOpen(false)
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="breadcrumb">
          Workspace <span>/</span> {pageTitle}
        </div>

        <form
          className="dashboard-search"
          role="search"
          onSubmit={handleSearchSubmit}
        >
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>

          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search incidents or ask about a root cause..."
            aria-label="Search incidents or ask about a root cause"
          />

          <kbd>Enter</kbd>
        </form>
      </div>

      <div className="topbar-right">
        <span className="demo-badge">DEMO DATA</span>

        <button
          className="icon-button theme-toggle"
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title="Switch theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        <div className="popover-container">
          <button
            className="icon-button notification-button"
            type="button"
            onClick={() => {
              setNotificationsOpen((current) => !current)
              setProfileOpen(false)
            }}
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={notificationsOpen}
            title="Notifications"
          >
            ♧
            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <section className="popover-panel notification-panel">
              <div className="popover-heading">
                <div>
                  <h3>Notifications</h3>
                  <p>{unreadCount} unread notifications</p>
                </div>

                <button
                  className="text-button"
                  type="button"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </button>
              </div>

              <div className="notification-list">
                {notifications.map((notification) => (
                  <button
                    className={`notification-item ${
                      notification.read ? 'is-read' : 'is-unread'
                    }`}
                    key={notification.id}
                    type="button"
                    onClick={() =>
                      setNotifications((current) =>
                        current.map((item) =>
                          item.id === notification.id
                            ? { ...item, read: true }
                            : item,
                        ),
                      )
                    }
                  >
                    <span className="notification-dot" />

                    <span className="notification-content">
                      <strong>{notification.title}</strong>
                      <small>{notification.detail}</small>
                      <small>{notification.time}</small>
                    </span>
                  </button>
                ))}
              </div>

              <p className="popover-footnote">
                Sample notifications · Database integration pending
              </p>
            </section>
          )}
        </div>

        <div className="popover-container">
          <button
            className="profile-trigger"
            type="button"
            onClick={() => {
              setProfileOpen((current) => !current)
              setNotificationsOpen(false)
            }}
            aria-expanded={profileOpen}
            title="Profile and settings"
          >
            <span className="profile-avatar">IO</span>
            <span className="profile-trigger-label">Admin</span>
            <span aria-hidden="true">⌄</span>
          </button>

          {profileOpen && (
            <div className="popover-panel settings-panel">
              <div className="popover-heading">
                <div>
                  <h3>Workspace settings</h3>
                  <p>InferOps preferences</p>
                </div>
              </div>

              <button
                className="settings-menu-item"
                type="button"
                onClick={() => {
                  setProfileOpen(false)
                  navigate('/settings')
                }}
              >
                ⚙ <span>Open Settings</span>
              </button>

              <div className="settings-footer">
                Local development preview
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
