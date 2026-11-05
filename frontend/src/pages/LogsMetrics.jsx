
import { useCallback, useEffect, useState } from 'react'

const DEMO_API_URL = 'http://127.0.0.1:8001'

// Request Monitoring Graph
function RequestMonitoringChart({ history }) {
  const width = 900
  const height = 380
  const padding = { top: 30, right: 35, bottom: 75, left: 85 }

  const series = [
    { key: 'request_count', label: 'Total Requests', color: '#22d3ee' },
    { key: 'success_count', label: 'Successful (2xx)', color: '#22c55e' },
    { key: 'client_error_count', label: 'Client Errors (4xx)', color: '#f59e0b' },
    { key: 'server_error_count', label: 'Server Errors (5xx)', color: '#ef4444' },
  ]

  const validHistory = history.filter(
    (item) =>
      item.timestamp &&
      Number.isFinite(new Date(item.timestamp).getTime())
  )

  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(
    1,
    ...validHistory.flatMap((item) =>
      series.map((line) => Number(item[line.key] ?? 0))
    )
  )

  const minTime = validHistory.length
    ? Math.min(...validHistory.map((item) => new Date(item.timestamp).getTime()))
    : 0
  const maxTime = validHistory.length
    ? Math.max(...validHistory.map((item) => new Date(item.timestamp).getTime()))
    : 0

  const x = (timestamp) =>
    padding.left +
    (maxTime === minTime
      ? plotWidth / 2
      : ((new Date(timestamp).getTime() - minTime) / (maxTime - minTime)) * plotWidth)

  const y = (value) =>
    padding.top + plotHeight - (Number(value) / maxValue) * plotHeight

  const yTicks = Array.from({ length: 5 }, (_, index) =>
    (maxValue * index) / 4
  )

  const xIndices = validHistory.length
    ? [...new Set([0, Math.floor((validHistory.length - 1) / 2), validHistory.length - 1])]
    : []

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })

  const latest = validHistory[validHistory.length - 1]

  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <h2>Request Monitoring</h2>
          <p className="page-description">
            Total, successful and failed application requests per minute.
          </p>
        </div>
      </div>

      {validHistory.length === 0 ? (
        <div className="empty-state">
          <p>No request history available yet. Generate some application traffic.</p>
        </div>
      ) : (
        <>
          <div className="request-chart-container" style={{ width: '100%', overflow: 'visible' }}>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label="Request monitoring chart showing total, successful, client-error and server-error requests"
              style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}
            >
              {yTicks.map((value, index) => {
                const yPosition = y(value)
                return (
                  <g key={index}>
                    <line
                      x1={padding.left}
                      y1={yPosition}
                      x2={width - padding.right}
                      y2={yPosition}
                      stroke="#64748b"
                      strokeOpacity="0.35"
                      strokeDasharray="5 5"
                    />
                    <text
                      x={padding.left - 12}
                      y={yPosition + 4}
                      textAnchor="end"
                      fill="#cbd5e1"
                      fontSize="13"
                    >
                      {Number(value.toFixed(1))}
                    </text>
                  </g>
                )
              })}

              <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={height - padding.bottom}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
              <line
                x1={padding.left}
                y1={height - padding.bottom}
                x2={width - padding.right}
                y2={height - padding.bottom}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />

              {xIndices.map((index) => (
                <g key={index}>
                  <line
                    x1={x(validHistory[index].timestamp)}
                    y1={height - padding.bottom}
                    x2={x(validHistory[index].timestamp)}
                    y2={height - padding.bottom + 6}
                    stroke="#cbd5e1"
                  />
                  <text
                    x={x(validHistory[index].timestamp)}
                    y={height - padding.bottom + 25}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="12"
                  >
                    {formatTime(validHistory[index].timestamp)}
                  </text>
                </g>
              ))}

              <text
                x={padding.left + plotWidth / 2}
                y={height - 15}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="14"
              >
                Time
              </text>
              <text
                transform={`translate(22 ${padding.top + plotHeight / 2}) rotate(-90)`}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="14"
              >
                Number of requests
              </text>

              {series.map((line) => {
                const points = validHistory.map((item) => ({
                  x: x(item.timestamp),
                  y: y(item[line.key] ?? 0),
                  value: Number(item[line.key] ?? 0),
                  timestamp: item.timestamp,
                }))

                return (
                  <g key={line.key}>
                    <polyline
                      points={points.map((point) => `${point.x},${point.y}`).join(' ')}
                      fill="none"
                      stroke={line.color}
                      strokeWidth="3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {points.map((point, index) => (
                      <circle
                        key={`${line.key}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r="5"
                        fill={line.color}
                        stroke="#111827"
                        strokeWidth="1.5"
                      >
                        <title>
                          {line.label}: {point.value} requests at {formatTime(point.timestamp)}
                        </title>
                      </circle>
                    ))}
                  </g>
                )
              })}
            </svg>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', justifyContent: 'center', marginTop: '14px' }}>
            {series.map((line) => (
              <div key={line.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '13px' }}>
                <span style={{ width: '12px', height: '4px', backgroundColor: line.color, display: 'inline-block' }} />
                <span>{line.label}: <strong>{Number(latest[line.key] ?? 0)}</strong></span>
              </div>
            ))}
          </div>

          <p className="page-description">
            Recorded intervals: {validHistory.length} / 60 minutes
          </p>
        </>
      )}
    </article>
  )
}

function ResponseTimeChart({ history }) {
  const width = 900
  const height = 380
  const padding = { top: 30, right: 35, bottom: 75, left: 90 }

  const series = [
    { key: 'average_response_time_seconds', label: 'Average Response Time', color: '#22d3ee' },
    { key: 'min_response_time_seconds', label: 'Minimum Response Time', color: '#22c55e' },
    { key: 'max_response_time_seconds', label: 'Maximum Response Time', color: '#ef4444' },
  ]

  const validHistory = history.filter(
    (item) =>
      item.timestamp &&
      series.every((line) => Number.isFinite(Number(item[line.key])))
  )

  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(
    0.001,
    ...validHistory.flatMap((item) =>
      series.map((line) => Number(item[line.key]))
    )
  )

  const minTime = validHistory.length
    ? Math.min(...validHistory.map((item) => new Date(item.timestamp).getTime()))
    : 0
  const maxTime = validHistory.length
    ? Math.max(...validHistory.map((item) => new Date(item.timestamp).getTime()))
    : 0

  const x = (timestamp) =>
    padding.left +
    (maxTime === minTime
      ? plotWidth / 2
      : ((new Date(timestamp).getTime() - minTime) / (maxTime - minTime)) * plotWidth)

  const y = (value) =>
    padding.top + plotHeight - (Number(value) / maxValue) * plotHeight

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })

  const yTicks = Array.from({ length: 5 }, (_, index) =>
    (maxValue * index) / 4
  )
  const xIndices = validHistory.length
    ? [...new Set([0, Math.floor((validHistory.length - 1) / 2), validHistory.length - 1])]
    : []
  const latest = validHistory[validHistory.length - 1]

  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <h2>Response-Time Monitoring</h2>
          <p className="page-description">
            Average, minimum and maximum application response time per minute.
          </p>
        </div>
      </div>

      {validHistory.length === 0 ? (
        <div className="empty-state">
          <p>No response-time history available yet.</p>
        </div>
      ) : (
        <>
          <div style={{ width: '100%', overflow: 'visible' }}>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label="Response time chart showing average, minimum and maximum response time"
              style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}
            >
              {yTicks.map((value, index) => {
                const yPosition = y(value)
                return (
                  <g key={index}>
                    <line
                      x1={padding.left}
                      y1={yPosition}
                      x2={width - padding.right}
                      y2={yPosition}
                      stroke="#64748b"
                      strokeOpacity="0.35"
                      strokeDasharray="5 5"
                    />
                    <text
                      x={padding.left - 12}
                      y={yPosition + 4}
                      textAnchor="end"
                      fill="#cbd5e1"
                      fontSize="13"
                    >
                      {value.toFixed(3)}
                    </text>
                  </g>
                )
              })}

              <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={height - padding.bottom}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
              <line
                x1={padding.left}
                y1={height - padding.bottom}
                x2={width - padding.right}
                y2={height - padding.bottom}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />

              {xIndices.map((index) => (
                <g key={index}>
                  <line
                    x1={x(validHistory[index].timestamp)}
                    y1={height - padding.bottom}
                    x2={x(validHistory[index].timestamp)}
                    y2={height - padding.bottom + 6}
                    stroke="#cbd5e1"
                  />
                  <text
                    x={x(validHistory[index].timestamp)}
                    y={height - padding.bottom + 25}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="12"
                  >
                    {formatTime(validHistory[index].timestamp)}
                  </text>
                </g>
              ))}

              <text
                x={padding.left + plotWidth / 2}
                y={height - 15}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="14"
              >
                Time
              </text>
              <text
                transform={`translate(22 ${padding.top + plotHeight / 2}) rotate(-90)`}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="14"
              >
                Response time (seconds)
              </text>

              {series.map((line) => {
                const points = validHistory.map((item) => ({
                  x: x(item.timestamp),
                  y: y(item[line.key]),
                  value: Number(item[line.key]),
                  timestamp: item.timestamp,
                }))

                return (
                  <g key={line.key}>
                    <polyline
                      points={points.map((point) => `${point.x},${point.y}`).join(' ')}
                      fill="none"
                      stroke={line.color}
                      strokeWidth="3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {points.map((point, index) => (
                      <circle
                        key={`${line.key}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r="5"
                        fill={line.color}
                        stroke="#111827"
                        strokeWidth="1.5"
                      >
                        <title>
                          {line.label}: {point.value.toFixed(6)} seconds at {formatTime(point.timestamp)}
                        </title>
                      </circle>
                    ))}
                  </g>
                )
              })}
            </svg>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', justifyContent: 'center', marginTop: '14px' }}>
            {series.map((line) => (
              <div key={line.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '13px' }}>
                <span style={{ width: '12px', height: '4px', backgroundColor: line.color, display: 'inline-block' }} />
                <span>{line.label}: <strong>{Number(latest[line.key]).toFixed(6)} s</strong></span>
              </div>
            ))}
          </div>

          <p className="page-description">
            Recorded intervals: {validHistory.length} / 60 minutes
          </p>
        </>
      )}
    </article>
  )
}

function LogsMetrics() {
  const [logs, setLogs] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [metricsHistory, setMetricsHistory] = useState([])
  const [systemMetrics, setSystemMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch logs, aggregate metrics, and time-series history
  const loadObservabilityData = useCallback(async () => {
    const [logsResponse, metricsResponse, historyResponse, systemResponse] =
      await Promise.all([
        fetch(`${DEMO_API_URL}/logs`),
        fetch(`${DEMO_API_URL}/metrics`),
        fetch(`${DEMO_API_URL}/metrics/history`),
	fetch(`${DEMO_API_URL}/system/metrics`),
      ])

    if (!logsResponse.ok || !metricsResponse.ok || !historyResponse.ok || !systemResponse.ok) {
      throw new Error(
        'Unable to retrieve logs or metrics from the demo application.'
      )
    }

    const [logsData, metricsData, historyData, systemData] = await Promise.all([
      logsResponse.json(),
      metricsResponse.json(),
      historyResponse.json(),
      systemResponse.json(),
    ])

    return { logsData, metricsData, historyData, systemData }
  }, [])

  // Refresh data after the initial page load
  const fetchObservabilityData = useCallback(async () => {
    try {
      const { logsData, metricsData, historyData, systemData } =
        await loadObservabilityData()

      setLogs(logsData.logs ?? [])
      setMetrics(metricsData)
      setMetricsHistory(historyData)
      setSystemMetrics(systemData)
      setError('')
    } catch (err) {
      setError(
        err.message || 'Failed to connect to the demo application.'
      )
    } finally {
      setLoading(false)
    }
  }, [loadObservabilityData])

  // Refresh button handler
  const handleRefresh = useCallback(() => {
    setLoading(true)
    setError('')
    fetchObservabilityData()
  }, [fetchObservabilityData])

  // Initial data loading
  useEffect(() => {
    let cancelled = false

    loadObservabilityData()
      .then(({ logsData, metricsData, historyData, systemData }) => {
        if (cancelled) return

        setLogs(logsData.logs ?? [])
        setMetrics(metricsData)
        setMetricsHistory(historyData)
	setSystemMetrics(systemData)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.message || 'Failed to connect to the demo application.'
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [loadObservabilityData])

  return (
    <section className="page-section">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">OBSERVABILITY</p>
          <h1>Logs &amp; Metrics</h1>
          <p className="page-description">
           Live application logs and operational metrics from InferOps Demo.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="empty-state">
          <p>{error}</p>
        </div>
      )}

      {/* Summary metrics */}
      <div className="stats-grid">
        <article className="stat-card">
          <span>Total requests</span>
          <strong>{metrics?.total_requests ?? '—'}</strong>
        </article>

        <article className="stat-card">
          <span>HTTP errors</span>
          <strong>{metrics?.error_count ?? '—'}</strong>
        </article>

        <article className="stat-card">
          <span>Error rate</span>
          <strong>
            {metrics ? `${metrics.error_rate_percent}%` : '—'}
          </strong>
        </article>

        <article className="stat-card">
          <span>Average response time</span>
          <strong>
            {metrics
              ? `${metrics.average_response_time_seconds}s`
              : '—'}
          </strong>
        </article>
	  <article className="stat-card">
  <span>CPU usage</span>
  <strong>
    {systemMetrics
      ? `${systemMetrics.cpu_usage_percent}%`
      : '—'}
  </strong>
</article>

<article className="stat-card">
  <span>Memory usage</span>
  <strong>
    {systemMetrics
      ? `${systemMetrics.memory_usage_percent}%`
      : '—'}
  </strong>
</article>
      </div>

      {/* Request monitoring graph */}
      <RequestMonitoringChart history={metricsHistory} />
      <ResponseTimeChart history={metricsHistory} />

      {/* Recent application logs */}
      <article className="panel">
        <div className="panel-header">
          <div>
            <h2>Recent application logs</h2>
            <p className="page-description">
              Latest {logs.length} captured application log entries.
            </p>
          </div>
        </div>

        {loading && logs.length === 0 ? (
          <div className="empty-state">
            <p>Loading application logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <p>No application logs available.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="incident-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Level</th>
                  <th>Logger</th>
                  <th>Message</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log, index) => (
                  <tr key={`${log.timestamp}-${index}`}>
                    <td>{log.timestamp}</td>
                    <td>
                      <span
                        className={`severity-badge ${log.level.toLowerCase()}`}
                      >
                        {log.level}
                      </span>
                    </td>
                    <td>{log.logger}</td>
                    <td>{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {/* HTTP metrics overview */}
      <article className="panel">
        <div className="panel-header">
          <div>
            <h2>HTTP metrics overview</h2>
            <p className="page-description">
              Request statistics collected by the demo application.
            </p>
          </div>
        </div>

        {metrics ? (
          <div className="stats-grid">
            {Object.entries(metrics.http_status_counts ?? {}).map(
              ([status, count]) => (
                <article className="stat-card" key={status}>
                  <span>HTTP {status} responses</span>
                  <strong>{count}</strong>
                </article>
              )
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p>
              {loading ? 'Loading metrics...' : 'Metrics unavailable.'}
            </p>
          </div>
        )}
      </article>

      <p className="page-note">
        Logs and HTTP metrics are collected by the InferOps demo application.
        Metrics are held in memory and reset when the application restarts.
      </p>
    </section>
  )
}

export default LogsMetrics
