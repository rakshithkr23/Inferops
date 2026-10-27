const incidents = [
  {
    id: 'INC-1042',
    title: 'Backend API response timeout',
    service: 'inferops-backend',
    severity: 'High',
    status: 'Investigating',
    time: '5 min ago',
  },
  {
    id: 'INC-1041',
    title: 'Database connection failure',
    service: 'postgresql',
    severity: 'Critical',
    status: 'Open',
    time: '18 min ago',
  },
  {
    id: 'INC-1040',
    title: 'Container restart detected',
    service: 'inferops-worker',
    severity: 'Medium',
    status: 'Resolved',
    time: '42 min ago',
  },
]

function Home() {
  return (
    <div className="home-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">OPERATIONS CENTER</p>
          <h1>Overview</h1>
          <p className="page-description">
            Monitor incidents, investigate failures, and understand root causes.
          </p>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Incident summary">
        <article className="metric-card">
          <div className="metric-top">
            <span>Total incidents</span>
            <span className="metric-icon purple">▦</span>
          </div>
          <div className="metric-value">24</div>
          <p className="metric-note">Recorded in this demo</p>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>Open incidents</span>
            <span className="metric-icon orange">⚠</span>
          </div>
          <div className="metric-value">08</div>
          <p className="metric-note">Require attention</p>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>Critical incidents</span>
            <span className="metric-icon red">!</span>
          </div>
          <div className="metric-value">02</div>
          <p className="metric-note">High-priority events</p>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>Services monitored</span>
            <span className="metric-icon green">◈</span>
          </div>
          <div className="metric-value">05</div>
          <p className="metric-note">Sample service inventory</p>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel incidents-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent incidents</h2>
              <p>Latest events across your services</p>
            </div>
            <a href="#/incidents">
              View all <span aria-hidden="true">→</span>
            </a>
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
                  <tr key={incident.id}>
                    <td>
                      <strong className="incident-title">
                        {incident.title}
                      </strong>
                      <span className="incident-id">{incident.id}</span>
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
        </article>

        <article className="panel rca-panel">
          <div className="panel-heading">
            <div>
              <h2>AI root cause analysis</h2>
              <p>Investigation assistant</p>
            </div>
            <span className="ai-icon" aria-hidden="true">✳</span>
          </div>

          <div className="rca-illustration" aria-hidden="true">
            <div className="rca-orbit orbit-one" />
            <div className="rca-orbit orbit-two" />
            <div className="rca-core">✳</div>
            <span className="orbit-node node-one">⌕</span>
            <span className="orbit-node node-two">▤</span>
            <span className="orbit-node node-three">◈</span>
          </div>

          <h3>Turn incidents into insights</h3>
          <p className="rca-description">
            Investigate failures and review root cause recommendations
            supported by incident evidence.
          </p>

          <a className="secondary-button" href="#/root-cause-analysis">
            Explore RCA <span aria-hidden="true">→</span>
          </a>

          <p className="demo-note">
            <span className="status-dot" />
            Demo interface · Backend integration pending
          </p>
        </article>
      </section>

      <footer className="dashboard-footer">
        <span>
          InferOps <span className="footer-divider">/</span> Incident intelligence
        </span>
        <span>Development preview</span>
      </footer>
    </div>
  )
}

export default Home
