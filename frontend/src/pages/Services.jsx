
const services = [
  {
    name: 'InferOps Backend',
    description: 'FastAPI incident management and RCA API',
    technology: 'FastAPI',
    status: 'Configured',
    statusClass: 'success',
  },
  {
    name: 'PostgreSQL',
    description: 'Incident records and historical data storage',
    technology: 'PostgreSQL',
    status: 'Configured',
    statusClass: 'success',
  },
  {
    name: 'AI Analysis Engine',
    description: 'AI-assisted incident analysis and recommendations',
    technology: 'LangGraph + Gemini',
    status: 'Integration to verify',
    statusClass: 'warning',
  },
  {
    name: 'Kubernetes',
    description: 'Container orchestration and workload status',
    technology: 'Kubernetes',
    status: 'Live status pending',
    statusClass: 'warning',
  },
]

function Services() {
  return (
    <section className="page-section">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">INFRASTRUCTURE</p>
          <h1>Services</h1>
          <p className="page-description">
            Review the services and infrastructure used by InferOps.
          </p>
        </div>
        <span className="demo-badge">INITIAL VIEW</span>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span>Listed services</span>
          <strong>{services.length}</strong>
        </article>
        <article className="stat-card">
          <span>Configured components</span>
          <strong>
            {services.filter((service) => service.status === 'Configured').length}
          </strong>
        </article>
        <article className="stat-card">
          <span>Live health checks</span>
          <strong>Not connected</strong>
        </article>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Service inventory</h2>
            <p className="page-description">
              Component overview; status labels are not live health checks.
            </p>
          </div>
        </div>

        <div className="service-grid">
          {services.map((service) => (
            <article className="service-card" key={service.name}>
              <div className="service-card-top">
                <div className="service-icon" aria-hidden="true">
                  {service.name === 'PostgreSQL'
                    ? '▤'
                    : service.name === 'Kubernetes'
                      ? '◈'
                      : service.name === 'AI Analysis Engine'
                        ? '✳'
                        : '⌘'}
                </div>
                <span className={`status-badge ${service.statusClass}`}>
                  {service.status}
                </span>
              </div>

              <h3>{service.name}</h3>
              <p>{service.description}</p>

              <div className="service-technology">
                <span>Technology</span>
                <strong>{service.technology}</strong>
              </div>
            </article>
          ))}
        </div>
      </div>

      <p className="page-note">
        This page currently displays a service inventory. We will connect actual
        health checks and Kubernetes status after the dashboard pages are ready.
      </p>
    </section>
  )
}

export default Services
