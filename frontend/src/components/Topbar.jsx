
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from '../config'

function Topbar({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const location = useLocation()

  const topbarRef = useRef(null)
  const googleButtonRef = useRef(null)

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  function handleSearch(event) {
     if (event.key !== 'Enter') return

  const query = searchQuery.trim()

  if (!query) return

     navigate(`/incidents?q=${encodeURIComponent(query)}`)
 }

  const [user, setUser] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [googleError, setGoogleError] = useState('')
  const [googleMessage, setGoogleMessage] = useState('')

  async function loadUser() {
    try {
      const response = await apiFetch('/auth/me')

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Profile loading failed:', error)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  // Close menus when clicking outside or pressing Escape.
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        topbarRef.current &&
        !topbarRef.current.contains(event.target)
      ) {
        setProfileOpen(false)
        setNotificationsOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setProfileOpen(false)
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  // Close open menus after route navigation.
  useEffect(() => {
    setProfileOpen(false)
    setNotificationsOpen(false)
  }, [location.pathname])

  // Initialize Google account linking when the profile menu is open.
  useEffect(() => {
    if (!profileOpen || user?.connected_methods?.includes('google')) {
      return
    }

    let active = true
    let script = null
    let handleScriptLoad = null

    function initializeGoogle() {
      if (!active || !window.google?.accounts?.id) return

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

      if (!clientId || !googleButtonRef.current) {
        setGoogleError('Google Sign-In is not configured.')
        return
      }

      window.google.accounts.id.initialize({
        client_id: clientId,

        callback: async (response) => {
          try {
            setGoogleError('')
            setGoogleMessage('Connecting Google account...')

            const result = await apiFetch('/auth/google/link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                credential: response.credential,
              }),
            })

            const data = await result.json()

            if (!result.ok) {
              throw new Error(
                data.detail || 'Google account linking failed.'
              )
            }

            setGoogleMessage('Google account connected successfully.')
            await loadUser()
          } catch (error) {
            setGoogleMessage('')
            setGoogleError(error.message)
          }
        },
      })

      if (!googleButtonRef.current) return

      googleButtonRef.current.innerHTML = ''

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: theme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 260,
        }
      )
    }

    if (window.google?.accounts?.id) {
      initializeGoogle()
    } else {
      script = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      )

      if (!script) {
        script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }

      handleScriptLoad = initializeGoogle
      script.addEventListener('load', handleScriptLoad)
    }

    return () => {
      active = false

      if (script && handleScriptLoad) {
        script.removeEventListener('load', handleScriptLoad)
      }
    }
  }, [profileOpen, user?.connected_methods, theme])

  async function handleLogout() {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      const response = await apiFetch('/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        navigate('/login', { replace: true })
      } else {
        setLoggingOut(false)
      }
    } catch (error) {
      console.error('Logout failed:', error)
      setLoggingOut(false)
    }
  }

  function openSettings() {
    setProfileOpen(false)
    navigate('/settings')
  }

  function toggleNotifications() {
    setNotificationsOpen((open) => !open)
    setProfileOpen(false)
  }

  function toggleProfile() {
    setProfileOpen((open) => !open)
    setNotificationsOpen(false)
  }

  const displayName = user?.full_name || 'InferOps User'

  const initials = user?.full_name
    ? user.full_name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'IO'

  const googleConnected =
    user?.connected_methods?.includes('google') || false

  const connectedMethods = user?.connected_methods || []

  function formatMethod(method) {
    if (method === 'google') return 'Google'
    if (method === 'phone') return 'Phone + Password'
    if (method === 'email') return 'Email + Password'
    return method
  }

  return (
    <header className="topbar" ref={topbarRef}>
      {/* Search bar on the left */}
      <div className="topbar-left">
        <div className="topbar-search">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="topbar-search-icon"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>

          <input
            type="search"
            placeholder="Search incidents by ID, title, service..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={handleSearch}
            aria-label="Search incidents and services"
          />

          {searchQuery && (
            <button
              type="button"
              className="topbar-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Actions on the right */}
      <div className="topbar-right">
        <span className="demo-badge">DEMO DATA</span>

        <button
          type="button"
          className="topbar-icon-button"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
            </svg>
          )}
        </button>

        <div className="notification-wrapper">
          <button
            type="button"
            className="topbar-icon-button notification-trigger"
            onClick={toggleNotifications}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            aria-haspopup="true"
            title="Notifications"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
          </button>

          {notificationsOpen && (
            <div className="notification-menu">
              <div className="notification-menu-heading">
                <div>
                  <strong>Notifications</strong>
                  <small>Your incident activity</small>
                </div>
                <span className="notification-status-dot" />
              </div>

              <div className="notification-item">
                <span className="notification-empty-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                  </svg>
                </span>

                <div>
                  <strong>You're all caught up</strong>
                  <small>No new notifications at the moment.</small>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="profile-wrapper">
          <button
            type="button"
            className="profile-trigger"
            onClick={toggleProfile}
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            <span className="profile-avatar">{initials}</span>

            <span className="profile-trigger-details">
              <strong>{displayName}</strong>
              <small>{user?.email || 'InferOps Account'}</small>
            </span>

            <svg
              className={`profile-chevron ${profileOpen ? 'is-open' : ''}`}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="m7 10 5 5 5-5" />
            </svg>
          </button>

          {profileOpen && (
            <div className="profile-menu">
              <div className="profile-menu-identity">
                <div className="profile-menu-avatar">{initials}</div>

                <div className="profile-menu-user">
                  <strong>{user?.full_name || 'User Profile'}</strong>
                  <small>{user?.email || 'Loading email...'}</small>
                  <span className="profile-account-status">
                    <span />
                    Account active
                  </span>
                </div>
              </div>

              <div className="profile-menu-details">
                <div>
                  <small>Phone number</small>
                  <p>{user?.phone_number || 'Not connected'}</p>
                </div>

                <div>
                  <small>Email address</small>
                  <p>{user?.email || 'Not available'}</p>
                </div>

                <div>
                  <small>Account created</small>
                  <p>
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : 'Not available'}
                  </p>
                </div>

                <div>
                  <small>Sign-in methods</small>
                  <p>
                    {connectedMethods.length
                      ? connectedMethods.map(formatMethod).join(', ')
                      : 'Not available'}
                  </p>
                </div>
              </div>

              <div className="google-link-section">
                <div className="google-link-heading">
                  <strong>Google account</strong>
                  <span className={googleConnected ? 'is-connected' : ''}>
                    {googleConnected ? 'Connected' : 'Not connected'}
                  </span>
                </div>

                {googleConnected ? (
                  <p className="google-connected-message">
                    Your Google account is linked to InferOps.
                  </p>
                ) : (
                  <>
                    <div
                      className="google-link-button"
                      ref={googleButtonRef}
                    />

                    {googleError && (
                      <p className="login-error">{googleError}</p>
                    )}

                    {googleMessage && (
                      <p className="login-success">{googleMessage}</p>
                    )}
                  </>
                )}
              </div>

              <div className="profile-menu-actions">
                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={openSettings}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" />
                    <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1 0 2Z" />
                  </svg>
                  Workspace settings
                </button>

                <button
                  type="button"
                  className="profile-menu-item logout-button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M10 17l5-5-5-5" />
                    <path d="M15 12H3" />
                    <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
                  </svg>
                  {loggingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
