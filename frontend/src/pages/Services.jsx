
import { useState } from 'react'

const services = [
  {
    id: 'backend',
    name: 'InferOps Backend',
    category: 'CORE SERVICE',
    description: 'The main API that powers InferOps.',
    purpose:
      'Handles application requests and connects incident detection, monitoring, database operations and root cause analysis.',
    responsibilities: [
      'Receives API requests from the dashboard.',
      'Processes and manages incident records.',
      'Connects monitoring data with incident detection.',
      'Provides information to the RCA engine.',
    ],
    technology: ['Python', 'FastAPI'],
    status: 'Configured',
    statusClass: 'success',
    icon: '⚙️',
  },
  {
    id: 'database',
    name: 'PostgreSQL',
    category: 'DATA STORAGE',
    description: 'Stores incident information and historical records.',
    purpose:
      'Maintains the information InferOps needs to track incidents and learn from previous failures.',
    responsibilities: [
      'Stores detected incidents.',
      'Maintains historical incident records.',
      'Stores RCA feedback.',
      'Supports vector similarity search through pgvector.',
    ],
    technology: ['PostgreSQL', 'pgvector'],
    status: 'Configured',
    statusClass: 'success',
    icon: '🗄️',
  },
  {
    id: 'ai',
    name: 'AI Analysis Engine',
    category: 'INTELLIGENCE',
    description: 'Helps identify possible incident root causes.',
    purpose:
      'Uses historical incident information and AI to analyze problems and suggest possible corrective actions.',
    responsibilities: [
      'Finds similar historical incidents.',
      'Uses retrieved information as analysis context.',
      'Generates probable root causes.',
      'Suggests recommended corrective actions.',
    ],
    technology: ['RAG', 'LangGraph', 'Gemini'],
    status: 'Integration to verify',
    statusClass: 'warning',
    icon: '🧠',
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    category: 'CONTAINER ORCHESTRATION',
    description: 'Manages application containers and workloads.',
    purpose:
      'Runs containerized applications and provides workload information that can help identify deployment and runtime problems.',
    responsibilities: [
      'Runs application workloads.',
      'Manages container deployments.',
      'Provides workload health information.',
      'Helps identify unhealthy workloads.',
    ],
    technology: ['Docker', 'Kubernetes'],
    status: 'Live status pending',
    statusClass: 'warning',
    icon: '☸️',
  },
]

function Services() {
  const [selectedService, setSelectedService] = useState('backend')

  const selected = services.find(
    (service) => service.id === selectedService
  )

  const configuredCount = services.filter(
    (service) => service.status === 'Configured'
  ).length

  return (
    <section className="page-section services-page">

      {/* Page heading */}
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">INFRASTRUCTURE</p>
          <h1>Service Observatory</h1>
          <p className="page-description">
            Explore the services that power InferOps and understand
            the role of each component.
          </p>
        </div>

        <span className="demo-badge">SERVICE DIRECTORY</span>
      </div>

      {/* Summary */}
      <div className="stats-grid services-stats">
        <article className="stat-card">
          <span>Registered services</span>
          <strong>{services.length}</strong>
          <p>Core components in InferOps</p>
        </article>

        <article className="stat-card">
          <span>Configured components</span>
          <strong>{configuredCount}</strong>
          <p>Marked as configured</p>
        </article>

        <article className="stat-card">
          <span>Live health monitoring</span>
          <strong className="services-stat-text">
            Not connected
          </strong>
          <p>Live health checks are not available here</p>
        </article>
      </div>

      {/* Service directory */}
      <div className="panel services-directory">

        <div className="panel-header">
          <div>
            <h2>Service Directory</h2>
            <p className="page-description">
              Select a service to explore its purpose and responsibilities.
            </p>
          </div>
          <span className="demo-badge">
            {services.length} COMPONENTS
          </span>
        </div>

        <div className="services-explorer">

          {/* Service list */}
          <div className="services-list">
            {services.map((service, index) => (
              <button
                type="button"
                key={service.id}
                className={`service-item ${
                  selectedService === service.id ? 'active' : ''
                }`}
                onClick={() => setSelectedService(service.id)}
                aria-pressed={selectedService === service.id}
              >
                <span className="service-item-number">
                  0{index + 1}
                </span>

                <span className="service-item-icon">
                  {service.icon}
                </span>

                <span className="service-item-content">
                  <strong>{service.name}</strong>
                  <small>{service.category}</small>
                </span>

                <span className="service-item-arrow">→</span>
              </button>
            ))}
          </div>

          {/* Selected service details */}
          <article className="service-detail" key={selected.id}>

            <div className="service-detail-header">
              <div className="service-detail-icon">
                {selected.icon}
              </div>

              <span className={`status-badge ${selected.statusClass}`}>
                {selected.status}
              </span>
            </div>

            <p className="eyebrow">{selected.category}</p>

            <h2>{selected.name}</h2>

            <p className="service-detail-summary">
              {selected.description}
            </p>

            <div className="service-detail-section">
              <h3>What does this service do?</h3>
              <p>{selected.purpose}</p>
            </div>

            <div className="service-detail-section">
              <h3>Main responsibilities</h3>

              <ul className="service-responsibilities">
                {selected.responsibilities.map((item) => (
                  <li key={item}>
                    <span>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="service-detail-section">
              <h3>Technologies used</h3>

              <div className="service-tech-list">
                {selected.technology.map((technology) => (
                  <span key={technology}>
                    {technology}
                  </span>
                ))}
              </div>
            </div>

          </article>
        </div>
      </div>

      {/* Information note */}
      <div className="services-information">
        <span>ⓘ</span>
        <p>
          This page describes the configured components of InferOps.
          The displayed statuses are configuration labels, not
          real-time service health results.
        </p>
      </div>

    </section>
  )
}

export default Services
