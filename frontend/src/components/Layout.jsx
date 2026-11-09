
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

const STORAGE_KEY = 'inferops.settings.v1'

const defaultSettings = {
  theme: 'system',
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

  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // Track operating system theme changes.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event) => setSystemDark(event.matches)

    media.addEventListener('change', onChange)

    return () => media.removeEventListener('change', onChange)
  }, [])

  // Resolve the selected theme.
  const resolvedTheme =
    preferences.theme === 'system'
      ? (systemDark ? 'dark' : 'light')
      : preferences.theme

  // Apply the resolved theme to the document.
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  // Listen for settings changes from the Settings page.
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

  // Toggle between Dark and Light themes.
  function toggleTheme() {
    setPreferences((current) => {
      const updated = {
        ...current,
        theme: resolvedTheme === 'dark' ? 'light' : 'dark',
      }

      try {
        const saved = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || '{}'
        )

        const merged = { ...saved, ...updated }

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(merged)
        )

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
        `theme-${resolvedTheme}`,
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
          theme={resolvedTheme}
          onToggleTheme={toggleTheme}
        />

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
