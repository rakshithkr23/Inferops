
import { useCallback, useEffect, useState } from 'react'
import { API_URL } from '../config'

const STORAGE_KEY = 'inferops.settings.v1'

const defaultSettings = {
  browserNotifications: false,
  minimumSeverity: 'all',
  autoRefresh: true,
  refreshInterval: '30',
  theme: 'dark',
  compactMode: false,
  reducedMotion: false,
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : { ...defaultSettings }
  } catch {
    return { ...defaultSettings }
  }
}

function Settings() {
  const [settings, setSettings] = useState(loadSettings)
  const [message, setMessage] = useState('')

  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined'
      ? Notification.permission
      : 'unsupported'
  )

  const [systemStatus, setSystemStatus] = useState({
    backend: 'Checking...',
    database: 'Checking...',
  })

  const [lastChecked, setLastChecked] = useState(null)
  const [isChecking, setIsChecking] = useState(false)

  // Synchronize settings when another component changes preferences.
  useEffect(() => {
    function handleSettingsUpdate(event) {
      if (!event.detail) return

      setSettings((current) => ({
        ...current,
        ...event.detail,
      }))
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

  const checkSystemStatus = useCallback(async () => {
    setIsChecking(true)

    async function checkEndpoint(path, expectedStatus) {
      const response = await fetch(`${API_URL}${path}`, {
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok || data.status !== expectedStatus) {
        throw new Error('Service unavailable')
      }

      return 'Connected'
    }

    try {
      const [backend, database] = await Promise.allSettled([
        checkEndpoint('/health', 'ok'),
        checkEndpoint('/db-test', 'success'),
      ])

      setSystemStatus({
        backend:
          backend.status === 'fulfilled'
            ? backend.value
            : 'Unavailable',

        database:
          database.status === 'fulfilled'
            ? database.value
            : 'Unavailable',
      })

      setLastChecked(new Date().toLocaleString())
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    checkSystemStatus()
  }, [checkSystemStatus])

  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }))

    setMessage('')
  }

  async function enableBrowserNotifications() {
    if (!('Notification' in window)) {
      setNotificationPermission('unsupported')
      setMessage('This browser does not support notifications.')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === 'granted') {
        updateSetting('browserNotifications', true)
        setMessage('Browser notification permission granted.')
      } else {
        updateSetting('browserNotifications', false)
        setMessage('Browser notification permission was not granted.')
      }
    } catch {
      setMessage('Unable to request notification permission.')
    }
  }

  function handleSave(event) {
    event.preventDefault()

    try {
      // Preserve any preferences stored by other dashboard components.
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '{}'
      )

      const updatedSettings = {
        ...defaultSettings,
        ...saved,
        ...settings,
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedSettings)
      )

      setSettings(updatedSettings)

      window.dispatchEvent(
        new CustomEvent('inferops:settings-updated', {
          detail: updatedSettings,
        })
      )

      setMessage('Your preferences have been saved successfully.')
    } catch {
      setMessage('Unable to save preferences in this browser.')
    }
  }

  return (
    <section className="page-section settings-page">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">SYSTEM CONFIGURATION</p>
          <h1>Settings</h1>
          <p className="page-description">
            Manage InferOps preferences, dashboard behavior and application
            configuration.
          </p>
        </div>

        <span className="demo-badge">SYSTEM PREFERENCES</span>
      </div>

      <form onSubmit={handleSave} className="settings-form">

        <article className="panel settings-panel">
          <div className="panel-header">
            <div>
              <h2>Alert Preferences</h2>
              <p className="page-description">
                Configure how incident alerts should be handled.
              </p>
            </div>
            <span className="settings-icon">!</span>
          </div>

          <div className="setting-row">
            <div>
              <strong>Browser notifications</strong>
              <small>
                Allow the browser to display notifications for detected incidents.
              </small>
              <small>
                Permission status: {notificationPermission}
              </small>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                if (settings.browserNotifications) {
                  updateSetting('browserNotifications', false)
                  setMessage(
                    'Browser notifications disabled. Save preferences to apply.'
                  )
                } else {
                  enableBrowserNotifications()
                }
              }}
            >
              {settings.browserNotifications
                ? 'Disable notifications'
                : 'Enable notifications'}
            </button>
          </div>

          <div className="setting-row">
            <div>
              <strong>Minimum incident severity</strong>
              <small>
                Choose the minimum severity to display in the incident list.
              </small>
            </div>

            <select
              value={settings.minimumSeverity}
              onChange={(event) =>
                updateSetting('minimumSeverity', event.target.value)
              }
            >
              <option value="all">All severities</option>
              <option value="low">Low and above</option>
              <option value="medium">Medium and above</option>
              <option value="high">High and above</option>
              <option value="critical">Critical only</option>
            </select>
          </div>

          <div className="setting-row">
            <div>
              <strong>Email notifications</strong>
              <small>
                Email delivery requires a configured backend email service.
              </small>
            </div>

            <span className="settings-status">Not configured</span>
          </div>
        </article>

        <article className="panel settings-panel">
          <div className="panel-header">
            <div>
              <h2>Dashboard Preferences</h2>
              <p className="page-description">
                Control how the dashboard displays incident information.
              </p>
            </div>
            <span className="settings-icon">▦</span>
          </div>

          <label className="setting-row">
            <div>
              <strong>Automatic incident refresh</strong>
              <small>
                Automatically refresh incident records while viewing the
                Incidents page.
              </small>
            </div>

            <input
              type="checkbox"
              checked={settings.autoRefresh}
              onChange={(event) =>
                updateSetting('autoRefresh', event.target.checked)
              }
            />
          </label>

          <div className="setting-row">
            <div>
              <strong>Refresh interval</strong>
              <small>
                Select how frequently incident records should be refreshed.
              </small>
            </div>

            <select
              value={settings.refreshInterval}
              onChange={(event) =>
                updateSetting('refreshInterval', event.target.value)
              }
              disabled={!settings.autoRefresh}
            >
              <option value="15">15 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
            </select>
          </div>
        </article>

        <article className="panel settings-panel">
          <div className="panel-header">
            <div>
              <h2>AI & RCA Configuration</h2>
              <p className="page-description">
                View the AI models and retrieval technologies configured in
                InferOps.
              </p>
            </div>
            <span className="settings-icon">AI</span>
          </div>

          <div className="settings-info-grid">
            <div className="settings-info-item">
              <small>AI analysis model</small>
              <strong>Gemini 3.6 Flash</strong>
              <span>gemini-3.6-flash</span>
            </div>

            <div className="settings-info-item">
              <small>Embedding model</small>
              <strong>MiniLM L6 v2</strong>
              <span>all-MiniLM-L6-v2</span>
            </div>

            <div className="settings-info-item">
              <small>Vector database</small>
              <strong>PostgreSQL + pgvector</strong>
              <span>Similarity search</span>
            </div>

            <div className="settings-info-item">
              <small>RCA workflow</small>
              <strong>LangGraph</strong>
              <span>Incident analysis workflow</span>
            </div>

            <div className="settings-info-item">
              <small>Embedding dimensions</small>
              <strong>384</strong>
              <span>Vector representation</span>
            </div>

            <div className="settings-info-item">
              <small>Historical retrieval</small>
              <strong>Up to 3 incidents</strong>
              <span>Similarity-based retrieval</span>
            </div>
          </div>

          <p className="page-note">
            AI model configuration is managed by the backend. These values
            are informational and cannot be changed from this page.
          </p>
        </article>

        <article className="panel settings-panel">
          <div className="panel-header">
            <div>
              <h2>Appearance & Accessibility</h2>
              <p className="page-description">
                Customize the dashboard viewing experience.
              </p>
            </div>
            <span className="settings-icon">◐</span>
          </div>

          <div className="setting-row">
            <div>
              <strong>Dashboard theme</strong>
              <small>
                Choose your preferred dashboard color scheme.
              </small>
            </div>

            <select
              value={settings.theme}
              onChange={(event) =>
                updateSetting('theme', event.target.value)
              }
            >
              <option value="dark">Dark theme</option>
              <option value="light">Light theme</option>
            </select>
          </div>

          <label className="setting-row">
            <div>
              <strong>Compact dashboard layout</strong>
              <small>
                Use a more compact layout to display more information.
              </small>
            </div>

            <input
              type="checkbox"
              checked={settings.compactMode}
              onChange={(event) =>
                updateSetting('compactMode', event.target.checked)
              }
            />
          </label>

          <label className="setting-row">
            <div>
              <strong>Reduce animations</strong>
              <small>
                Reduce interface movement and transition effects.
              </small>
            </div>

            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(event) =>
                updateSetting('reducedMotion', event.target.checked)
              }
            />
          </label>
        </article>

        <article className="panel settings-panel">
          <div className="panel-header">
            <div>
              <h2>System Information</h2>
              <p className="page-description">
                Live status of your InferOps application and its services.
              </p>
            </div>
            <span className="settings-icon">⌘</span>
          </div>

          <div className="system-status-list">
            <div className="system-status-item">
              <div>
                <strong>Frontend Application</strong>
                <span>Inferops web dashboard</span>
              </div>
              <span className="system-status-connected">Running</span>
            </div>

            <div className="system-status-item">
              <div>
                <strong>Backend API</strong>
                <span>FastAPI service · Port 8002</span>
              </div>
              <span
                className={
                  systemStatus.backend === 'Connected'
                    ? 'system-status-connected'
                    : systemStatus.backend === 'Checking...'
                      ? 'system-status-checking'
                      : 'system-status-error'
                }
              >
                {systemStatus.backend}
              </span>
            </div>

            <div className="system-status-item">
              <div>
                <strong>PostgreSQL Database</strong>
                <span>Backend database connection</span>
              </div>
              <span
                className={
                  systemStatus.database === 'Connected'
                    ? 'system-status-connected'
                    : systemStatus.database === 'Checking...'
                      ? 'system-status-checking'
                      : 'system-status-error'
                }
              >
                {systemStatus.database}
              </span>
            </div>
          </div>

          <div className="system-status-footer">
            <span>
              Last checked: {lastChecked || 'Not checked yet'}
            </span>

            <button
              type="button"
              className="system-refresh-button"
              onClick={checkSystemStatus}
              disabled={isChecking}
            >
              {isChecking ? 'Checking...' : 'Refresh status'}
            </button>
          </div>
        </article>

        <div className="settings-actions">
          <button className="primary-button" type="submit">
            Save preferences
          </button>
        </div>

        {message && (
          <p className="form-message" role="status">
            {message}
          </p>
        )}
      </form>

      <p className="page-note">
        Preferences are saved locally in this browser. Browser incident
        notifications are checked while the Incidents page is open.
        Email notifications require a backend email service.
      </p>
    </section>
  )
}

export default Settings
