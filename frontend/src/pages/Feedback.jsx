
import { useState } from 'react'
import { API_URL } from '../config'

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
      const response = await fetch(`${API_URL}/rca/feedback`, {
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
    <section className="page-section">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">PRODUCT IMPROVEMENT</p>
          <h1>Feedback</h1>
          <p className="page-description">
            Share your experience with InferOps incident analysis.
          </p>
        </div>
        <span className="demo-badge">DATABASE CONNECTED</span>
      </div>

      <div className="two-column-grid">
        <article className="panel feedback-intro">
          <h2>Help improve InferOps</h2>
          <p>
            Your feedback can help us improve incident investigation,
            evidence presentation, and AI-generated recommendations.
          </p>

          <div className="feedback-benefit">
            <span aria-hidden="true">✓</span>
            Rate the RCA experience
          </div>
          <div className="feedback-benefit">
            <span aria-hidden="true">✓</span>
            Report missing or unclear evidence
          </div>
          <div className="feedback-benefit">
            <span aria-hidden="true">✓</span>
            Suggest improvements
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Submit feedback</h2>
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
            </fieldset>

            <label htmlFor="feedback-category">Feedback category</label>
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

            <label htmlFor="feedback-comments">Comments</label>
            <textarea
              id="feedback-comments"
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              placeholder="Tell us what worked or what could be improved..."
              rows={5}
              maxLength={2000}
            />

            <p className="character-count">
              {comments.length}/2000 characters
            </p>

            <button
              className="primary-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit feedback'}
            </button>

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}
          </form>
        </article>
      </div>
    </section>
  )
}

export default Feedback
