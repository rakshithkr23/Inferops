
import { useState } from 'react'
import { apiFetch } from '../config'

function Feedback() {
  const [rating, setRating] = useState(0)
  const [category, setCategory] = useState('RCA quality')
  const [comments, setComments] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (rating === 0) {
      setMessage('Please select a rating before submitting.')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      const response = await apiFetch('/rca/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rca_id: crypto.randomUUID(),
          feedback_type: 'positive',
          rating,
          category,
          comments: comments.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to save feedback.')
      }

      setMessage('Thank you! Your feedback has been saved.')
      setRating(0)
      setCategory('RCA quality')
      setComments('')
    } catch (error) {
      setMessage(`Unable to save feedback: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-section feedback-page">

      <div className="page-heading-row">
        <div>
          <p className="eyebrow">PRODUCT IMPROVEMENT</p>
          <h1>Feedback</h1>
          <p className="page-description">
            Your insights help make incident analysis more useful and reliable.
          </p>
        </div>
        <span className="demo-badge">DATABASE CONNECTED</span>
      </div>

      {/* Full-width RCA improvement section */}
      <article className="panel feedback-hero">
        <div className="feedback-hero-content">
          <div className="feedback-hero-icon" aria-hidden="true">
            <span>✦</span>
          </div>

          <div className="feedback-hero-text">
            <p className="eyebrow">YOUR INPUT MATTERS</p>
            <h2>Help Improve RCA</h2>
            <p>
              Every incident tells a story. Your feedback helps us improve
              how InferOps identifies root causes, presents supporting
              evidence, and recommends corrective actions.
            </p>
          </div>
        </div>

        <div className="feedback-benefits">
          <div className="feedback-benefit-card">
            <div className="feedback-benefit-icon" aria-hidden="true">
              <span>◎</span>
            </div>
            <div>
              <h3>Better Root Cause Analysis</h3>
              <p>
                Help improve the relevance and clarity of AI-generated
                root cause explanations.
              </p>
            </div>
          </div>

          <div className="feedback-benefit-card">
            <div className="feedback-benefit-icon" aria-hidden="true">
              <span>⌕</span>
            </div>
            <div>
              <h3>Clearer Evidence</h3>
              <p>
                Share whether the logs, metrics, and incident details
                support the analysis.
              </p>
            </div>
          </div>

          <div className="feedback-benefit-card">
            <div className="feedback-benefit-icon" aria-hidden="true">
              <span>↗</span>
            </div>
            <div>
              <h3>More Useful Recommendations</h3>
              <p>
                Help us make suggested actions more practical for
                troubleshooting incidents.
              </p>
            </div>
          </div>
        </div>

        <div className="feedback-hero-note">
          <span aria-hidden="true">ⓘ</span>
          Your feedback is used to evaluate and improve the InferOps
          experience. AI recommendations do not automatically modify
          your infrastructure.
        </div>
      </article>

      {/* Full-width feedback form */}
      <article className="panel feedback-form-panel">
        <div className="feedback-form-heading">
          <div>
            <p className="eyebrow">SHARE YOUR EXPERIENCE</p>
            <h2>Submit Feedback</h2>
            <p>
              Tell us what worked well and where we can do better.
            </p>
          </div>
        </div>

        <form className="feedback-form" onSubmit={handleSubmit}>

          <fieldset className="rating-field">
            <legend>How would you rate your experience?</legend>

            <div className="rating-options">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`rating-button ${rating >= value ? 'selected' : ''}`}
                  onClick={() => setRating(value)}
                  aria-pressed={rating === value}
                  aria-label={`${value} out of 5 stars`}
                >
                  ★
                </button>
              ))}
            </div>

            <p className="feedback-rating-hint">
              {rating === 0
                ? 'Select a star rating to get started.'
                : rating === 5
                  ? 'Excellent! Thank you for your rating.'
                  : rating >= 4
                    ? 'Great! Thanks for sharing your experience.'
                    : rating >= 3
                      ? 'Thanks. Your feedback helps us improve.'
                      : 'We appreciate your honest feedback.'}
            </p>
          </fieldset>

          <div className="feedback-form-fields">
            <div className="feedback-field">
              <label htmlFor="feedback-category">
                Feedback category
              </label>

              <select
                id="feedback-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option>RCA quality</option>
                <option>Evidence accuracy</option>
                <option>Recommendations</option>
                <option>Dashboard usability</option>
                <option>Bug report</option>
                <option>Other</option>
              </select>
            </div>

            <div className="feedback-field">
              <label htmlFor="feedback-comments">
                Your comments
              </label>

              <textarea
                id="feedback-comments"
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                placeholder="Tell us what worked well, what was confusing, or what you would like to improve..."
                rows={6}
                maxLength={2000}
              />

              <p className="character-count">
                {comments.length}/2000 characters
              </p>
            </div>
          </div>

          <div className="feedback-submit-row">
            <p className="feedback-submit-note">
              <span aria-hidden="true">🔒</span>
              Your feedback helps us improve InferOps.
            </p>

            <button
              className="primary-button feedback-submit-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit feedback'}
              {!submitting && <span aria-hidden="true"> →</span>}
            </button>
          </div>

          {message && (
            <p className="form-message" role="status">
              {message}
            </p>
          )}

        </form>
      </article>

    </section>
  )
}

export default Feedback
