
import { useState } from 'react'

function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [incidentAlerts, setIncidentAlerts] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState('30')
  const [message, setMessage] = useState('')

  function handleSave(event) {
    event.preventDefault()

    // Settings are currently held in React state only.
    // Persistent storage will be added after the initial dashboard is integrated.
    setMessage('Settings updated for this session. Persistent saving is not connected yet.')
  }

  return (
    <section className="page-section">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">PREFERENCES</p>
          <h1>Settings</h1>
          <p className="page-description">
            Configure dashboard behavior and incident notifications.
          </p>
        </div>
        <span className="demo-badge">LOCAL SETTINGS</span>
      </div>

      <form onSubmit={handleSave} className="settings-form">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Notifications</h2>
              <p className="page-description">
                Choose which notification preferences to enable.
              </p>
            </div>
          </div>

          <label className="setting-row">
            <span>
              <strong>Incident alerts</strong>
              <small>Show notifications for new incidents.</small>
            </span>
            <input
              type="checkbox"
              checked={incidentAlerts}
              onChange={(event) => setIncidentAlerts(event.target.checked)}
            />
          </label>

          <label className="setting-row">
            <span>
              <strong>Email notifications</strong>
              <small>Email delivery requires a configured backend service.</small>
            </span>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(event) => setEmailNotifications(event.target.checked)}
            />
          </label>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Dashboard behavior</h2>
              <p className="page-description">
                Set the preferred refresh behavior for future live data.
              </p>
            </div>
          </div>

          <label className="setting-row">
            <span>
              <strong>Automatic refresh preference</strong>
              <small>Enable automatic refresh when live data is integrated.</small>
            </span>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(event) => setAutoRefresh(event.target.checked)}
            />
          </label>

          <div className="setting-row">
            <span>
              <strong>Refresh interval</strong>
              <small>Preferred interval for future live data refreshes.</small>
            </span>
            <select
              value={refreshInterval}
              onChange={(event) => setRefreshInterval(event.target.value)}
            >
              <option value="15">15 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
            </select>
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
        These preferences are currently held in memory and reset when the
        dashboard reloads. Email delivery, persistent settings, and live
        refresh are not connected yet.
      </p>
    </section>
  )
}

export default Settings
