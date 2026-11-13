
import { useEffect, useState } from 'react'
import { Outlet, useLocation  } from 'react-router-dom'
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
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPath, setMenuPath] = useState(location.pathname)

  // Close the menu whenever the route changes.
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname)
    setMenuOpen(false)
  }
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
    // Close the menu with the Escape key.
  useEffect(() => {
    if (!menuOpen) return undefined

    function handleEscape(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('keydown', handleEscape)

    return () => document.removeEventListener('keydown', handleEscape)
  }, [menuOpen])

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
        menuOpen ? 'menu-open' : '',
        preferences.compactMode ? 'compact-mode' : '',
        preferences.reducedMotion ? 'reduced-motion' : '',
      ].filter(Boolean).join(' ')}
    >
      <Sidebar
        open={menuOpen}
        onToggle={() => setMenuOpen((current) => !current)}
        onClose={() => setMenuOpen(false)}
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
