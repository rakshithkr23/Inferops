
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

const STORAGE_KEY = 'inferops.settings.v1'

const defaultSettings = {
  theme: 'dark',
  compactMode: false,
  reducedMotion: false,
}

function readSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings
  } catch {
    return defaultSettings
  }
}

function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [preferences, setPreferences] = useState(readSettings)
  const location = useLocation()

  const pageTitles = {
    '/': 'Overview',
    '/incidents': 'Incidents',
    '/root-cause-analysis': 'Root Cause Analysis',
    '/services': 'Services',
    '/logs-metrics': 'Logs & Metrics',
    '/feedback': 'Feedback',
    '/settings': 'Settings',
  }

  const pageTitle = pageTitles[location.pathname] || 'Overview'

  useEffect(() => {
    function handleSettingsUpdate(event) {
      setPreferences({
        ...defaultSettings,
        ...event.detail,
      })
    }

    window.addEventListener(
      'inferops:settings-updated',
      handleSettingsUpdate
    )

    return () => {
      window.removeEventListener(
        'inferops:settings-updated',
        handleSettingsUpdate
      )
    }
  }, [])

  function toggleTheme() {
    setPreferences((current) => {
      const updated = {
        ...current,
        theme: current.theme === 'dark' ? 'light' : 'dark',
      }

      try {
        const saved = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || '{}'
        )

        const merged = { ...saved, ...updated }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))

        window.dispatchEvent(
          new CustomEvent('inferops:settings-updated', {
            detail: merged,
          })
        )
      } catch {
        // Keep the theme usable even if browser storage is unavailable.
      }

      return updated
    })
  }

  return (
    <div
      className={[
        'dashboard',
        `theme-${preferences.theme}`,
        sidebarCollapsed ? 'sidebar-collapsed' : '',
        preferences.compactMode ? 'compact-mode' : '',
        preferences.reducedMotion ? 'reduced-motion' : '',
      ].filter(Boolean).join(' ')}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((current) => !current)}
      />

      <main className="main-content">
        <Topbar
          theme={preferences.theme}
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
