
import { useEffect, useState } from 'react'
import { useSearchParams} from 'react-router-dom'
import { apiFetch } from '../config'

function formatRelativeTime(dateValue) {
  if (!dateValue) return '—'

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) return '—'

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`

  return `${Math.floor(seconds / 86400)} days ago`
}

function formatLabel(value) {
  if (!value) return 'Unknown'

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

const SETTINGS_KEY = 'inferops.settings.v1'

function readIncidentPreferences() {
  const defaults = {
    autoRefresh: true,
    refreshInterval: '30',
    minimumSeverity: 'all',
    browserNotifications: false,
  }

  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'),
    }
  } catch {
    return defaults
  }
}

function Incidents() {
  const [searchParams] = useSearchParams()
  const searchQuery = (searchParams.get('q') || '').trim().toLowerCase()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [preferences, setPreferences] = useState(readIncidentPreferences)

  useEffect(() => {
  let active = true
  let firstFetch = true
  let requestInProgress = false
  let previousIncidentIds = new Set()

  async function fetchIncidents() {
    if (requestInProgress) return

    requestInProgress = true

    try {
      if (firstFetch && active) {
        setLoading(true)
      }

      const response = await apiFetch(`/incidents`)

      if (!response.ok) {
        throw new Error(`Failed to load incidents (${response.status})`)
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        throw new Error('Unexpected incident data received from the backend.')
      }

      if (!active) return

      const mappedIncidents = data.map((incident) => ({
        id: incident.id,
        displayId: `INC-${incident.id}`,
        title: incident.title,
        service: incident.service_name || 'Unknown',
        severity: formatLabel(incident.severity),
        status: (incident.status || 'OPEN').toUpperCase(),
        time: formatRelativeTime(incident.created_at),
        description: incident.description || 'No description available.',
      }))

      const currentIds = new Set(mappedIncidents.map((item) => item.id))

      // Notify only about incidents appearing after the initial load.
      if (
        !firstFetch &&
        preferences.browserNotifications &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        const severityRank = {
          low: 1,
          medium: 2,
          high: 3,
          critical: 4,
        }

        const minimumRank =
          severityRank[preferences.minimumSeverity] || 0

        mappedIncidents
          .filter((incident) => {
            const isNew = !previousIncidentIds.has(incident.id)
            const meetsSeverity =
              (severityRank[incident.severity.toLowerCase()] || 0) >= minimumRank

            return isNew && meetsSeverity
          })
          .forEach((incident) => {
            new Notification(`New incident: ${incident.displayId}`, {
              body: `${incident.title} · ${incident.severity} · ${incident.service}`,
              tag: `inferops-incident-${incident.id}`,
            })
          })
      }

      previousIncidentIds = currentIds
      firstFetch = false

      setIncidents(mappedIncidents)
      setError('')
    } catch (err) {
      if (active) {
        setError(err.message || 'Unable to load incidents.')
      }
    } finally {
      requestInProgress = false

      if (active) {
        setLoading(false)
      }
    }
  }

  fetchIncidents()

  const interval = preferences.autoRefresh
    ? setInterval(fetchIncidents, Number(preferences.refreshInterval) * 1000)
    : null

  return () => {
    active = false

    if (interval) {
      clearInterval(interval)
    }
  }
}, [
  preferences.autoRefresh,
  preferences.refreshInterval,
  preferences.browserNotifications,
  preferences.minimumSeverity,
])

useEffect(() => {
  function handleSettingsUpdate() {
    setPreferences(readIncidentPreferences())
  }

  window.addEventListener('inferops:settings-updated', handleSettingsUpdate)

  return () => {
    window.removeEventListener(
      'inferops:settings-updated',
      handleSettingsUpdate
    )
  }
}, [])

  async function updateIncidentStatus(incidentId, newStatus) {
    const currentIncident = incidents.find(
      (incident) => incident.id === incidentId
    )

    if (!currentIncident || currentIncident.status === newStatus) return

    try {
      setUpdatingId(incidentId)
      setError('')

      const response = await apiFetch(
        `/incidents/${incidentId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      )

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.detail || 'Failed to update incident status.')
      }

      const updatedIncident = await response.json()

      setIncidents((current) =>
        current.map((incident) =>
          incident.id === incidentId
            ? {
                ...incident,
                status: (updatedIncident.status || newStatus).toUpperCase(),
              }
            : incident
        )
      )
    } catch (err) {
      setError(err.message || 'Unable to update incident status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const openCount = incidents.filter(
    (item) => item.status === 'OPEN'
  ).length

  const criticalCount = incidents.filter(
    (item) => item.severity === 'Critical'
  ).length

  const resolvedCount = incidents.filter(
    (item) => item.status === 'RESOLVED'
  ).length

const severityRank = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
}

const minimumSeverityRank =
  severityRank[preferences.minimumSeverity] || 0

const filteredIncidents = incidents.filter((incident) => {
  const meetsSeverity =
    (severityRank[incident.severity.toLowerCase()] || 0) >=
    minimumSeverityRank

  const matchesSearch =
    !searchQuery ||
    [
      incident.displayId,
      incident.title,
      incident.service,
      incident.severity,
      incident.status,
      incident.description,
    ].some((value) =>
      String(value || '').toLowerCase().includes(searchQuery)
    )

  return meetsSeverity && matchesSearch
})

  return (
    <div className="incidents-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">OPERATIONS CENTER</p>
          <h1>Incidents</h1>
          <p className="page-description">
            Review, search, and investigate application incidents.
          </p>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Incident totals">
        <article className="metric-card">
          <div className="metric-top">
            <span>Total listed</span>
            <span className="metric-icon purple">▦</span>
          </div>
          <div className="metric-value">{incidents.length}</div>
          <p className="metric-note">Total recorded incidents</p>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>Open</span>
            <span className="metric-icon orange">⚠</span>
          </div>
          <div className="metric-value">{openCount}</div>
          <p className="metric-note">Awaiting investigation</p>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>Critical</span>
            <span className="metric-icon red">!</span>
          </div>
          <div className="metric-value">{criticalCount}</div>
          <p className="metric-note">Highest severity</p>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>Resolved</span>
            <span className="metric-icon green">✓</span>
          </div>
          <div className="metric-value">{resolvedCount}</div>
          <p className="metric-note">Marked as resolved</p>
        </article>
      </section>

      <section className="panel incidents-panel">
        <div className="panel-heading">
          <div>
            <h2>All incidents</h2>
            <p>Incident details and current status</p>
          </div>
          <span className="demo-badge">
            {loading ? 'LOADING' : error ? 'API ERROR' : 'LIVE DATA'}
          </span>
        </div>

        {error && (
          <p role="alert" className="metric-note">
            {error}
          </p>
        )}

        {loading ? (
          <p className="metric-note">Loading incidents from backend...</p>
        ) : filteredIncidents.length === 0 ? (
          <p className="metric-note">
  {searchQuery
    ? `No incidents match "${searchQuery}" with the selected severity filter.`
    : preferences.minimumSeverity !== 'all'
      ? `No incidents meet the ${preferences.minimumSeverity} severity filter.`
      : 'No incidents found.'}
</p>
        ) : (
          <div className="incident-table-wrap">
            <table className="incident-table">
              <thead>
                <tr>
                  <th>INCIDENT</th>
                  <th>SERVICE</th>
                  <th>SEVERITY</th>
                  <th>STATUS</th>
                  <th>TIME</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} title={incident.description}>
                    <td>
                      <strong className="incident-title">
                        {incident.title}
                      </strong>
                      <span className="incident-id">{incident.displayId}</span>
                      <span className="incident-description">
                        {incident.description}
                      </span>
                    </td>
                    <td>
                      <span className="service-name">{incident.service}</span>
                    </td>
                    <td>
                      <span
                        className={`severity severity-${incident.severity.toLowerCase()}`}
                      >
                        {incident.severity}
                      </span>
                    </td>
                    <td>
                      <select
                        className={`incident-status status-${incident.status.toLowerCase()}`}
                        value={incident.status}
                        disabled={updatingId === incident.id}
                        onChange={(event) =>
                          updateIncidentStatus(incident.id, event.target.value)
                        }
                        aria-label={`Update status for ${incident.displayId}`}
                      >
                        <option value="OPEN">Open</option>
                        <option value="INVESTIGATING">Investigating</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                      {updatingId === incident.id && (
                        <span className="incident-id">Saving...</span>
                      )}
                    </td>
                    <td className="time-cell">{incident.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default Incidents
