
const logEntries = [
  {
    time: '10:42:15',
    level: 'ERROR',
    service: 'inferops-backend',
    message: 'Sample: database connection failed',
  },
  {
    time: '10:41:52',
    level: 'WARN',
    service: 'inferops-backend',
    message: 'Sample: request latency exceeded threshold',
  },
  {
    time: '10:40:18',
    level: 'INFO',
    service: 'inferops-backend',
    message: 'Sample: application started',
  },
]

function LogsMetrics() {
  return (
    <section className="page-section">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">OBSERVABILITY</p>
          <h1>Logs &amp; Metrics</h1>
          <p className="page-description">
            Inspect application events and operational indicators.
          </p>
        </div>
        <span className="demo-badge">SAMPLE DATA</span>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span>Displayed log entries</span>
          <strong>{logEntries.length}</strong>
        </article>
        <article className="stat-card">
          <span>Error entries</span>
          <strong>{logEntries.filter((log) => log.level === 'ERROR').length}</strong>
        </article>
        <article className="stat-card">
          <span>Metrics collection</span>
          <strong>Not connected</strong>
        </article>
      </div>

      <article className="panel">
        <div className="panel-header">
          <div>
            <h2>Recent application logs</h2>
            <p className="page-description">
              Illustrative entries for the initial dashboard layout.
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="incident-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Level</th>
                <th>Service</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {logEntries.map((log, index) => (
                <tr key={`${log.time}-${index}`}>
                  <td>{log.time}</td>
                  <td>
                    <span className={`severity-badge ${log.level.toLowerCase()}`}>
                      {log.level}
                    </span>
                  </td>
                  <td>{log.service}</td>
                  <td>{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className="panel metrics-placeholder">
        <div className="panel-header">
          <div>
            <h2>Metrics overview</h2>
            <p className="page-description">
              Live charts will be added when metrics data is connected.
            </p>
          </div>
        </div>
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">▤</span>
          <h3>No live metrics connected</h3>
          <p>
            CPU usage, memory consumption, request latency, and error rates
            will appear here after metrics integration.
          </p>
        </div>
      </div>

      <p className="page-note">
        These logs are examples, not real application logs. This page does not
        yet collect logs or metrics from Docker or Kubernetes.
      </p>
    </section>
  )
}

export default LogsMetrics
