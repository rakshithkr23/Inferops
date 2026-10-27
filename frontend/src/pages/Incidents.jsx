
const incidents = [
  {
    id: 'INC-1042',
    title: 'Backend API response timeout',
    service: 'inferops-backend',
    severity: 'High',
    status: 'Investigating',
    time: '5 min ago',
    description: 'The backend API is responding slower than expected.',
  },
  {
    id: 'INC-1041',
    title: 'Database connection failure',
    service: 'postgresql',
    severity: 'Critical',
    status: 'Open',
    time: '18 min ago',
    description: 'The application reported a database connection error.',
  },
  {
    id: 'INC-1040',
    title: 'Container restart detected',
    service: 'inferops-worker',
    severity: 'Medium',
    status: 'Resolved',
    time: '42 min ago',
    description: 'A worker container restarted during operation.',
  },
]

function Incidents() {
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
          <p className="metric-note">Sample incident records</p>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>Open</span>
            <span className="metric-icon orange">⚠</span>
          </div>
          <div className="metric-value">
            {incidents.filter((item) => item.status === 'Open').length}
          </div>
          <p className="metric-note">Awaiting investigation</p>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>Critical</span>
            <span className="metric-icon red">!</span>
          </div>
          <div className="metric-value">
            {incidents.filter((item) => item.severity === 'Critical').length}
          </div>
          <p className="metric-note">Highest severity</p>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>Resolved</span>
            <span className="metric-icon green">✓</span>
          </div>
          <div className="metric-value">
            {incidents.filter((item) => item.status === 'Resolved').length}
          </div>
          <p className="metric-note">Marked as resolved</p>
        </article>
      </section>

      <section className="panel incidents-panel">
        <div className="panel-heading">
          <div>
            <h2>All incidents</h2>
            <p>Incident details and current status</p>
          </div>
          <span className="demo-badge">DEMO DATA</span>
        </div>

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
              {incidents.map((incident) => (
                <tr key={incident.id} title={incident.description}>
                  <td>
                    <strong className="incident-title">{incident.title}</strong>
                    <span className="incident-id">{incident.id}</span>
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
                    <span
                      className={`incident-status status-${incident.status.toLowerCase()}`}
                    >
                      {incident.status}
                    </span>
                  </td>
                  <td className="time-cell">{incident.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Incidents
