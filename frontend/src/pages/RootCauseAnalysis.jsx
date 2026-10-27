
import { useState } from 'react'

function RootCauseAnalysis() {
  const [form, setForm] = useState({
    incident_type: 'Database connectivity',
    service_name: 'inferops-backend',
    severity: 'high',
    description: '',
  })

  const [result, setResult] = useState(null)
  const [feedbackChoice, setFeedbackChoice] = useState(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleAnalyze(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    setFeedbackChoice(null)
    setFeedbackError('')
    setFeedbackLoading(false)

    try {
      const response = await fetch('http://localhost:8000/rca/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'RCA analysis failed. Please check the backend logs.',
        )
      }

      if (!data.rca_id) {
        throw new Error(
          'The backend did not return an RCA result ID. Please check the backend.',
        )
      }

      console.log('InferOps RCA API response:', data)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Could not connect to the InferOps backend.')
    } finally {
      setLoading(false)
    }
  }

  async function handleFeedback(feedbackType) {
    if (
      !result?.rca_id ||
      feedbackLoading ||
      feedbackChoice !== null
    ) {
      return
    }

    setFeedbackLoading(true)
    setFeedbackError('')

    try {
      const response = await fetch('http://localhost:8000/rca/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rca_id: result.rca_id,
          feedback_type: feedbackType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Could not save feedback.',
        )
      }

      setFeedbackChoice(feedbackType)
      console.log('InferOps RCA feedback saved:', data)
    } catch (err) {
      setFeedbackError(
        err.message || 'Could not connect to the feedback API.',
      )
    } finally {
      setFeedbackLoading(false)
    }
  }

  const analysis = result?.analysis

  return (
    <section className="page-section">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">INVESTIGATION</p>
          <h1>Root Cause Analysis</h1>
          <p className="page-description">
            Submit an incident to the InferOps backend and review its analysis.
          </p>
        </div>

        <span className="demo-badge">
          {result ? 'LIVE API RESULT' : 'API CONNECTED'}
        </span>
      </div>

      <article className="panel">
        <div className="panel-header">
          <h2>Incident details</h2>
        </div>

        <form onSubmit={handleAnalyze}>
          <div className="form-grid">
            <label>
              Incident type
              <input
                name="incident_type"
                value={form.incident_type}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Service name
              <input
                name="service_name"
                value={form.service_name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Severity
              <select
                name="severity"
                value={form.severity}
                onChange={handleChange}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>

            <label className="form-full-width">
              Incident description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the symptoms, errors, or recent changes..."
                rows={4}
                required
              />
            </label>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Analyzing incident...' : 'Analyze incident'}
          </button>
        </form>
      </article>

      {error && (
        <article className="panel">
          <h2>Analysis failed</h2>
          <p role="alert">{error}</p>
        </article>
      )}

      {analysis && (
        <>
          <div className="stats-grid">
            <article className="stat-card">
              <span>Service</span>
              <strong>
                {result.incident?.service_name ?? form.service_name}
              </strong>
            </article>

            <article className="stat-card">
              <span>Severity</span>
              <strong>{result.incident?.severity ?? form.severity}</strong>
            </article>

            <article className="stat-card">
              <span>Confidence</span>
              <strong>{analysis.confidence}</strong>
            </article>

            <article className="stat-card">
              <span>AI model</span>
              <strong>{result.model}</strong>
            </article>
          </div>

          <article className="panel rca-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">PROBABLE ROOT CAUSE</p>
                <h2>Analysis result</h2>
              </div>

              <span className="severity-badge high">
                {analysis.confidence} confidence
              </span>
            </div>

            <p>{analysis.probable_root_cause}</p>
          </article>

          <div className="two-column-grid">
            <article className="panel">
              <div className="panel-header">
                <h2>Evidence</h2>
              </div>

              {analysis.evidence?.length ? (
                <ul className="detail-list">
                  {analysis.evidence.map((item, index) => (
                    <li key={`${index}-${item}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No evidence returned.</p>
              )}
            </article>

            <article className="panel">
              <div className="panel-header">
                <h2>Recommended actions</h2>
              </div>

              {analysis.recommended_actions?.length ? (
                <ol className="detail-list">
                  {analysis.recommended_actions.map((item, index) => (
                    <li key={`${index}-${item}`}>{item}</li>
                  ))}
                </ol>
              ) : (
                <p>No recommended actions returned.</p>
              )}
            </article>
          </div>

          <article className="panel">
            <div className="panel-header">
              <h2>Limitations</h2>
            </div>

            {analysis.limitations?.length ? (
              <ul className="detail-list">
                {analysis.limitations.map((item, index) => (
                  <li key={`${index}-${item}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No limitations returned.</p>
            )}
          </article>

          <p className="page-note">
            Results are returned by the InferOps backend. Review the evidence
            before acting on a proposed root cause.
          </p>

          <article className="panel">
            <div className="panel-header">
              <h2>Was this RCA useful?</h2>
            </div>

            <p>
              Your feedback helps us evaluate the quality of AI-generated
              root cause predictions.
            </p>

            <div className="feedback-actions">
              <button
                type="button"
                onClick={() => handleFeedback('positive')}
                disabled={feedbackLoading || feedbackChoice !== null}
              >
                {feedbackLoading ? 'Saving feedback...' : '👍 Helpful'}
              </button>

              <button
                type="button"
                onClick={() => handleFeedback('negative')}
                disabled={feedbackLoading || feedbackChoice !== null}
              >
                {feedbackLoading ? 'Saving feedback...' : '👎 Not helpful'}
              </button>
            </div>

            {feedbackChoice && (
              <p role="status">
                Thank you! Your feedback has been saved.
              </p>
            )}

            {feedbackError && (
              <p role="alert">{feedbackError}</p>
            )}
          </article>
        </>
      )}
    </section>
  )
}

export default RootCauseAnalysis
