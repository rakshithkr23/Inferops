
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

const settingsSections = [
  {
    id: 'alerts',
    number: '01',
    title: 'Alert Preferences',
    description: 'Notifications and incident severity',
  },
  {
    id: 'dashboard',
    number: '02',
    title: 'Dashboard Preferences',
    description: 'Dashboard behavior and display',
  },
  {
    id: 'ai',
    number: '03',
    title: 'AI & RCA Configuration',
    description: 'Analysis and retrieval configuration',
  },
  {
    id: 'appearance',
    number: '04',
    title: 'Appearance & Accessibility',
    description: 'Theme and viewing preferences',
  },
  {
    id: 'overview',
    number: '05',
    title: 'System Overview',
    description: 'Product information and roadmap',
  },
]

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
  const [activeSection, setActiveSection] = useState('alerts')
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

  function renderAlertPreferences() {
    return (
      <>
        <div className="settings-section-heading">
          <div>
            <p className="settings-section-eyebrow">NOTIFICATIONS</p>
            <h2>Alert Preferences</h2>
            <p>
              Configure how incident notifications and severity levels
              are handled across your workspace.
            </p>
          </div>
        </div>

        <div className="settings-detail-card">
          <div className="settings-detail-heading">
            <div>
              <h3>Notification delivery</h3>
              <p>Manage how this browser receives incident alerts.</p>
            </div>
          </div>

          <div className="settings-control-row">
            <div className="settings-control-copy">
              <strong>Browser notifications</strong>
              <small>
                Allow InferOps to display browser notifications for
                detected incidents.
              </small>
              <small className="settings-permission">
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

          <div className="settings-control-row">
            <div className="settings-control-copy">
              <strong>Email notifications</strong>
              <small>
                Email delivery requires a configured backend email service.
              </small>
            </div>

            <span className="settings-readonly-status">
              Not configured
            </span>
          </div>
        </div>

        <div className="settings-detail-card">
          <div className="settings-detail-heading">
            <div>
              <h3>Incident severity</h3>
              <p>
                Select the minimum severity to display in the incident list.
              </p>
            </div>
          </div>

          <div className="settings-control-row">
            <div className="settings-control-copy">
              <strong>Minimum incident severity</strong>
              <small>
                Incidents below the selected level will be excluded from
                the filtered incident view.
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
        </div>
      </>
    )
  }

  function renderDashboardPreferences() {
    return (
      <>
        <div className="settings-section-heading">
          <div>
            <p className="settings-section-eyebrow">WORKSPACE DISPLAY</p>
            <h2>Dashboard Preferences</h2>
            <p>
              Adjust how operational information is refreshed and presented
              in your dashboard.
            </p>
          </div>
        </div>

        <div className="settings-detail-card">
          <div className="settings-detail-heading">
            <div>
              <h3>Data refresh behavior</h3>
              <p>Control automatic incident data updates.</p>
            </div>
          </div>

          <label className="settings-control-row">
            <div className="settings-control-copy">
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

          <div className="settings-control-row">
            <div className="settings-control-copy">
              <strong>Refresh interval</strong>
              <small>
                Choose how frequently incident records should be refreshed.
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
        </div>
      </>
    )
  }

  function renderAIConfiguration() {
    return (
      <>
        <div className="settings-section-heading">
          <div>
            <p className="settings-section-eyebrow">ANALYSIS SERVICES</p>
            <h2>AI & RCA Configuration</h2>
            <p>
              Review the models and incident retrieval configuration
              currently used by InferOps.
            </p>
          </div>
        </div>

        <div className="settings-detail-card">
          <div className="settings-detail-heading">
            <div>
              <h3>Analysis configuration</h3>
              <p>
                Current AI and retrieval configuration.
              </p>
            </div>

            <span className="settings-readonly-status">
              Read only
            </span>
          </div>

          <div className="settings-config-grid">
            <div className="settings-config-item">
              <small>AI analysis model</small>
              <strong>Gemini 3.6 Flash</strong>
              <span>gemini-3.6-flash</span>
            </div>

            <div className="settings-config-item">
              <small>Embedding model</small>
              <strong>MiniLM L6 v2</strong>
              <span>all-MiniLM-L6-v2</span>
            </div>

            <div className="settings-config-item">
              <small>Vector database</small>
              <strong>PostgreSQL + pgvector</strong>
              <span>Similarity search</span>
            </div>

            <div className="settings-config-item">
              <small>RCA workflow</small>
              <strong>LangGraph</strong>
              <span>Incident analysis workflow</span>
            </div>

            <div className="settings-config-item">
              <small>Embedding dimensions</small>
              <strong>384</strong>
              <span>Vector representation</span>
            </div>

            <div className="settings-config-item">
              <small>Historical retrieval</small>
              <strong>Up to 3 incidents</strong>
              <span>Similarity-based retrieval</span>
            </div>
          </div>

          <p className="settings-information-note">
            AI model configuration is managed by the backend. These values
            are informational and cannot be changed from this page.
          </p>
        </div>
      </>
    )
  }

  function renderAppearancePreferences() {
    return (
      <>
        <div className="settings-section-heading">
          <div>
            <p className="settings-section-eyebrow">PERSONALIZATION</p>
            <h2>Appearance & Accessibility</h2>
            <p>
              Customize the interface to suit your viewing preferences
              and accessibility needs.
            </p>
          </div>
        </div>

        <div className="settings-detail-card">
          <div className="settings-detail-heading">
            <div>
              <h3>Appearance</h3>
              <p>Choose how InferOps looks on your device.</p>
            </div>
          </div>

          <div className="settings-control-row">
            <div className="settings-control-copy">
              <strong>Dashboard theme</strong>
              <small>
                Select a preferred color scheme for the application.
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
              <option value="system">System default</option>
            </select>
          </div>

          <label className="settings-control-row">
            <div className="settings-control-copy">
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

          <label className="settings-control-row">
            <div className="settings-control-copy">
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
        </div>
      </>
    )
  }

  function renderSystemOverview() {
    return (
      <>
        <div className="settings-overview-hero">
          <div className="settings-overview-brand">
            <span className="settings-overview-symbol">✳</span>

            <div>
              <p className="settings-section-eyebrow">
                PRODUCT INFORMATION
              </p>
              <h2>InferOps</h2>
              <p>
                AI-Driven DevOps Incident Detection & Root Cause Analysis
                System
              </p>
            </div>
          </div>
	     <div className="settings-overview-version">
            <small>Product version</small>
            <strong>0.1.0</strong>
            <small>To be confirmed</small>
          </div>
           <div className="settings-overview-block">
          <div className="settings-overview-heading">
            <span>01</span>
            <h3>About the Platform</h3>
          </div>
	    </div>

          <div className="settings-overview-prose">
            <p>
              Modern applications rarely run as a single service. They
              depend on connected components, databases and infrastructure
              that must work together. When one part fails, the visible
              symptom does not always reveal what caused the problem.
              Engineers may need to move between application logs,
              monitoring information and deployment events before they
              can understand what happened.
            </p>

            <p>
              InferOps is designed to bring those investigation details
              together. It examines available incident information,
              identifies relevant operational evidence and uses
              previously recorded incidents to provide additional
              context. The aim is to help engineers move beyond simply
              seeing that a service has failed and get a clearer picture
              of why it may have happened.
            </p>
          </div>
        </div>

        <div className="settings-overview-block">
          <div className="settings-overview-heading">
            <span>02</span>
            <h3>Core Capabilities</h3>
          </div>

          <div className="settings-capability-grid">
            <article className="settings-capability-card">
              <span className="settings-capability-number">01</span>
              <h4>Incident Detection</h4>
              <p>
                Identifies potential operational issues from available
                application and infrastructure information.
              </p>
            </article>

            <article className="settings-capability-card">
              <span className="settings-capability-number">02</span>
              <h4>Root Cause Analysis</h4>
              <p>
                Examines incident details and supporting evidence to
                suggest possible causes of system failures.
              </p>
            </article>

            <article className="settings-capability-card">
              <span className="settings-capability-number">03</span>
              <h4>Historical Incident Intelligence</h4>
              <p>
                Finds related past incidents and uses their information
                to provide useful investigation context.
              </p>
            </article>

            <article className="settings-capability-card">
              <span className="settings-capability-number">04</span>
              <h4>Log & Metrics Analysis</h4>
              <p>
                Helps engineers examine operational signals and
                understand unusual application behavior.
              </p>
            </article>

            <article className="settings-capability-card">
              <span className="settings-capability-number">05</span>
              <h4>Service Monitoring</h4>
              <p>
                Provides visibility into service conditions and
                helps identify issues affecting availability.
              </p>
            </article>

            <article className="settings-capability-card">
              <span className="settings-capability-number">06</span>
              <h4>RCA Feedback</h4>
              <p>
                Allows users to review analysis results and provide
                feedback on the usefulness of investigations.
              </p>
            </article>
          </div>
        </div>

        <div className="settings-overview-block">
          <div className="settings-overview-heading">
            <span>03</span>
            <h3>Production Roadmap & Future Scope</h3>
          </div>

          <div className="settings-roadmap-content">
            <p>
              InferOps is being developed with the aim of becoming a
              practical incident investigation platform for software
              engineering teams. The immediate focus is on making
              incident detection dependable, improving the quality of
              root cause analysis and using historical incident
              information to support investigations. Further development
              will focus on correlating events across connected services
              so that engineers can understand how one failure affects
              another. Additional monitoring sources and integrations
              with commonly used engineering tools can extend the
              information available during an investigation. The platform
              can also evolve to provide more detailed incident
              prioritization and service dependency visibility. In the
              longer term, predictive analysis may help identify patterns
              that often appear before a service failure. Remediation
              recommendations could give engineers practical guidance
              when responding to recurring issues. These improvements
              are intended to make InferOps useful throughout the
              incident lifecycle, from the first indication of a problem
              to investigation and resolution.
            </p>
          </div>
        </div>

        <div className="settings-overview-health">
          <div className="settings-overview-health-heading">
            <div>
              <h3>Application Connectivity</h3>
              <p>Current connection checks for essential services.</p>
            </div>

            <button
              type="button"
              className="system-refresh-button"
              onClick={checkSystemStatus}
              disabled={isChecking}
            >
              {isChecking ? 'Checking...' : 'Refresh status'}
            </button>
          </div>

          <div className="settings-health-grid">
            <div className="settings-health-item">
              <span className="settings-health-label">Backend API</span>
              <strong
                className={
                  systemStatus.backend === 'Connected'
                    ? 'is-connected'
                    : systemStatus.backend === 'Checking...'
                      ? 'is-checking'
                      : 'is-unavailable'
                }
              >
                <span className="settings-health-dot" />
                {systemStatus.backend}
              </strong>
            </div>

            <div className="settings-health-item">
              <span className="settings-health-label">Database</span>
              <strong
                className={
                  systemStatus.database === 'Connected'
                    ? 'is-connected'
                    : systemStatus.database === 'Checking...'
                      ? 'is-checking'
                      : 'is-unavailable'
                }
              >
                <span className="settings-health-dot" />
                {systemStatus.database}
              </strong>
            </div>
          </div>

          <p className="settings-last-checked">
            Last checked: {lastChecked || 'Not checked yet'}
          </p>
        </div>

        <div className="settings-overview-footer">
          <span>© 2026 InferOps. All rights reserved.</span>
          <span>InferOps <i>·</i> System Overview</span>
        </div>
      </>
    )
  }

  function renderActiveSection() {
    switch (activeSection) {
      case 'alerts':
        return renderAlertPreferences()

      case 'dashboard':
        return renderDashboardPreferences()

      case 'ai':
        return renderAIConfiguration()

      case 'appearance':
        return renderAppearancePreferences()

      case 'overview':
        return renderSystemOverview()

      default:
        return renderAlertPreferences()
    }
  }

  const isOverview = activeSection === 'overview'

  return (
    <section className="page-section settings-page">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">WORKSPACE CONFIGURATION</p>
          <h1>Settings</h1>
          <p className="page-description">
            Manage your InferOps workspace preferences and application
            configuration.
          </p>
        </div>

        {!isOverview && (
          <button
            type="button"
            className="primary-button settings-save-button"
            onClick={handleSave}
          >
            Save preferences
          </button>
        )}
      </div>

      <div className="settings-workspace">
        <nav
          className="settings-navigation"
          aria-label="Settings sections"
        >
          <div className="settings-navigation-heading">
            <span>CONFIGURATION</span>
          </div>

          {settingsSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`settings-navigation-item ${
                activeSection === section.id ? 'active' : ''
              }`}
              onClick={() => {
                setActiveSection(section.id)
                setMessage('')
              }}
              aria-current={
                activeSection === section.id ? 'page' : undefined
              }
            >
              <span className="settings-navigation-number">
                {section.number}
              </span>

              <span className="settings-navigation-copy">
                <strong>{section.title}</strong>
                <small>{section.description}</small>
              </span>

              <span className="settings-navigation-arrow">›</span>
            </button>
          ))}

          <div className="settings-navigation-note">
            <span className="settings-navigation-note-dot" />
            <span>Preferences are stored in this browser.</span>
          </div>
        </nav>

        <form
          className="settings-main-panel"
          onSubmit={handleSave}
        >
          <div className="settings-main-content">
            {renderActiveSection()}
          </div>

          {!isOverview && (
            <div className="settings-main-footer">
              <span>
                Changes are saved when you select Save preferences.
              </span>

              <button
                type="submit"
                className="primary-button"
              >
                Save changes
              </button>
            </div>
          )}

          {message && !isOverview && (
            <p className="form-message settings-feedback" role="status">
              {message}
            </p>
          )}
        </form>
      </div>
    </section>
  )
}

export default Settings
