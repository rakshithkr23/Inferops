
import { useEffect, useState } from 'react'
import { apiFetch } from '../config'

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
    icon: '☸️',
  },
]

function Services() {
  const [selectedService, setSelectedService] = useState('backend')
  const [healthData, setHealthData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [healthError, setHealthError] = useState('')

  async function fetchHealth() {
    try {
      const response = await apiFetch('/services/health')

      if (!response.ok) {
        throw new Error(`Health check failed (${response.status})`)
      }

      const data = await response.json()
      setHealthData(data)
      setHealthError('')
    } catch (error) {
      setHealthError(error.message || 'Unable to fetch service health.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()

    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const liveServices = healthData?.services || []

  const configuredCount = liveServices.filter(
    (service) => service.configured
  ).length

  const healthyCount = liveServices.filter(
    (service) => service.status === 'healthy'
  ).length

  const selected = services.find(
    (service) => service.id === selectedService
  )

  const selectedHealth = liveServices.find(
    (service) => service.id === selectedService
  )

  function getStatusLabel(status) {
    if (status === 'healthy') return 'Healthy'
    if (status === 'unhealthy') return 'Unhealthy'
    return 'Not verified'
  }
  function getBadgeClass(status) {
    if (status === 'healthy') return 'success'
    if (status === 'unhealthy') return 'danger'
    return 'warning'
  }

  function getStatusClass(status) {
    if (status === 'healthy') return 'is-healthy'
    if (status === 'unhealthy') return 'is-unhealthy'
    return 'is-not-verified'
  }

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

        <div>
          <span className="demo-badge">SERVICE DIRECTORY</span>
          <button
            type="button"
            className="secondary-button"
            onClick={fetchHealth}
            disabled={loading}
          >
            {loading ? 'Checking...' : '↻ Refresh'}
          </button>
        </div>
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
          <strong>
            {healthData ? configuredCount : '—'}
          </strong>
          <p>Components with configuration detected</p>
        </article>

        <article className="stat-card">
          <span>Healthy services</span>
          <strong>
            {healthData ? healthyCount : '—'}
          </strong>
          <p>
            {loading && !healthData
              ? 'Checking service health...'
              : 'Confirmed by backend health checks'}
          </p>
        </article>
      </div>

      {/* Health check messages */}
      {healthError && (
        <div className="services-information">
          <span>⚠</span>
          <p>
            Unable to retrieve live service health: {healthError}
          </p>
        </div>
      )}

      {/* Service directory */}
      <div className="panel services-directory">

        <div className="panel-header">
          <div>
            <h2>Service Directory</h2>
            <p className="page-description">
              Select a service to explore its purpose and responsibilities.
            </p>
            <div className="service-status-legend">
              <span><i className="service-status-dot is-healthy" /> Healthy</span>
              <span><i className="service-status-dot is-unhealthy" /> Unhealthy</span>
              <span><i className="service-status-dot is-not-verified" /> Not verified</span>
            </div>
          </div>

          <span className="demo-badge">
            {services.length} COMPONENTS
          </span>
        </div>

        <div className="services-explorer">

          {/* Service list */}
          <div className="services-list">
            {services.map((service, index) => {
              const liveStatus = liveServices.find(
                (item) => item.id === service.id
              )

              return (
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

                 

                  {liveStatus && (
                    <span
                      className={`service-status-dot ${getStatusClass(liveStatus.status)}`}
                      title={getStatusLabel(liveStatus.status)}
                      aria-label={getStatusLabel(liveStatus.status)}
                  />
                  )}
                </button>
              )
            })}
          </div>

          {/* Selected service details */}
          <article className="service-detail" key={selected.id}>

            <div className="service-detail-header">
              <div className="service-detail-icon">
                {selected.icon}
              </div>

              {loading && !selectedHealth ? (
                <span className="status-badge warning">
                  Checking...
                </span>
              ) : (
                <span
                  className={`status-badge ${
                    getBadgeClass(selectedHealth?.status)
                  }`}
                >
                  {selectedHealth
                    ? getStatusLabel(selectedHealth.status)
                    : 'Unavailable'}
                </span>
              )}
            </div>

            <p className="eyebrow">{selected.category}</p>

            <h2>{selected.name}</h2>

            <p className="service-detail-summary">
              {selected.description}
            </p>

            {/* Live health information */}
            <div className="service-detail-section">
              <h3>Live Health Information</h3>

              {selectedHealth ? (
                <>
                  <p>{selectedHealth.message}</p>
                  <p>
                    <strong>Configuration:</strong>{' '}
                    {selectedHealth.configured
                      ? 'Available'
                      : 'Not configured'}
                  </p>
                  <p>
                    <strong>Last checked:</strong>{' '}
                    {selectedHealth.checked_at
                      ? new Date(
                          selectedHealth.checked_at
                        ).toLocaleString()
                      : 'Not available'}
                  </p>
                </>
              ) : (
                <p>
                  {healthError
                    ? 'Live health information could not be retrieved.'
                    : 'Waiting for the backend health check.'}
                </p>
              )}
            </div>

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
          Service health is retrieved from the InferOps backend.
          PostgreSQL is checked using a live test query. Gemini and
          Kubernetes display their configuration status and are marked
          as not verified until live connectivity checks are implemented.
          Health information refreshes every 30 seconds.
        </p>
      </div>

    </section>
  )
}

export default Services

