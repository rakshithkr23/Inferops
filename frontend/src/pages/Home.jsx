
import { Link } from 'react-router-dom'

const capabilities = [
  {
    icon: '◉',
    title: 'Logs & Metrics Monitoring',
    description:
      'Collect and monitor application logs, system metrics, CPU usage, memory usage and service performance.',
    tag: 'Observability',
  },
  {
    icon: '▣',
    title: 'Docker & Kubernetes Monitoring',
    description:
      'Observe container activity, application health and Kubernetes workload status to identify infrastructure issues.',
    tag: 'Infrastructure',
  },
  {
    icon: '⚡',
    title: 'Automatic Incident Detection',
    description:
      'Identify abnormal conditions using monitoring data and predefined detection rules, then record incidents.',
    tag: 'Detection',
  },
  {
    icon: '✳',
    title: 'AI Root Cause Analysis',
    description:
      'Use Gemini to investigate incidents, explain probable causes, examine evidence and recommend corrective actions.',
    tag: 'Artificial Intelligence',
  },
  {
    icon: '⌕',
    title: 'Historical Incident Analysis',
    description:
      'Retrieve similar historical incidents using vector similarity search and pgvector to provide useful context for RCA.',
    tag: 'RAG & pgvector',
  },
  {
    icon: '✓',
    title: 'Incident Management & Feedback',
    description:
      'Review detected incidents, update their status and submit feedback about the quality of RCA results.',
    tag: 'Management',
  },
]

const workflow = [
  {
    number: '01',
    title: 'Monitor',
    description:
      'Collect application logs, system metrics and infrastructure information.',
  },
  {
    number: '02',
    title: 'Detect',
    description:
      'Analyze monitoring information and identify abnormal conditions.',
  },
  {
    number: '03',
    title: 'Investigate',
    description:
      'Retrieve relevant historical incidents and use AI to analyze the evidence.',
  },
  {
    number: '04',
    title: 'Resolve & Improve',
    description:
      'Review recommended actions, manage incident status and provide feedback.',
  },
]

function Home() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-eyebrow">
            AI-POWERED DEVOPS OBSERVABILITY
          </span>

          <h1>
            Understand failures.
            <br />
            <span>Resolve incidents smarter.</span>
          </h1>

          <p className="home-hero-description">
            InferOps is an AI-driven DevOps incident detection and root
            cause analysis system. It brings monitoring, automated
            incident detection and AI-assisted investigation together
            to help engineers understand application failures.
          </p>

          <div className="home-hero-actions">
            <Link to="/incidents" className="home-primary-link">
              View incidents <span aria-hidden="true">→</span>
            </Link>
            <Link to="/logs-metrics" className="home-secondary-link">
              Explore monitoring
            </Link>
          </div>

          <div className="home-tech-line">
            <span>FASTAPI</span>
            <span>DOCKER</span>
            <span>KUBERNETES</span>
            <span>POSTGRESQL</span>
            <span>GEMINI AI</span>
          </div>
        </div>

        <div className="home-hero-visual" aria-label="InferOps incident analysis workflow">
          <div className="home-visual-glow" />
          <div className="home-visual-card">
            <div className="home-visual-header">
              <span className="home-visual-indicator" />
              <span>INFEROPS INTELLIGENCE</span>
              <span className="home-visual-live">SYSTEM</span>
            </div>

            <div className="home-visual-center">
              <div className="home-visual-orbit orbit-outer" />
              <div className="home-visual-orbit orbit-inner" />
              <div className="home-visual-core">✳</div>
              <span className="home-visual-node node-top">LOGS</span>
              <span className="home-visual-node node-left">METRICS</span>
              <span className="home-visual-node node-right">AI</span>
              <span className="home-visual-node node-bottom">RCA</span>
            </div>

            <div className="home-visual-footer">
              <span>Monitor</span>
              <span>→</span>
              <span>Detect</span>
              <span>→</span>
              <span>Analyze</span>
            </div>
          </div>
          <p className="home-visual-caption">
            From application signals to actionable insights
          </p>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-heading">
          <span className="home-eyebrow">WHAT INFEROPS PROVIDES</span>
          <h2>One platform. Multiple capabilities.</h2>
          <p>
            InferOps combines DevOps monitoring, incident management
            and AI-assisted investigation in one application.
          </p>
        </div>

        <div className="home-capability-grid">
          {capabilities.map((item) => (
            <article className="home-capability-card" key={item.title}>
              <div className="home-capability-icon">{item.icon}</div>
              <span className="home-capability-tag">{item.tag}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-workflow-section">
        <div className="home-section-heading">
          <span className="home-eyebrow">HOW IT WORKS</span>
          <h2>From detection to investigation.</h2>
          <p>
            A simple workflow that helps engineers move from identifying
            an issue to understanding why it happened.
          </p>
        </div>

        <div className="home-workflow-grid">
          {workflow.map((step, index) => (
            <article className="home-workflow-card" key={step.number}>
              <div className="home-workflow-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {index !== workflow.length - 1 && (
                <span className="home-workflow-arrow" aria-hidden="true">
                  →
                </span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="home-bottom-section">
        <div>
          <span className="home-eyebrow">BUILT FOR DEVOPS OPERATIONS</span>
          <h2>Better visibility. Clearer investigations.</h2>
          <p>
            Explore the monitoring dashboard and incident records to
            understand how InferOps brings operational information
            together.
          </p>
        </div>
        <Link to="/incidents" className="home-primary-link">
          Go to incidents <span aria-hidden="true">→</span>
        </Link>
      </section>

<footer className="home-footer">
  <div className="home-footer-brand">
    <strong>✳ InferOps</strong>
    <p>
      AI-powered DevOps observability and incident intelligence.
    </p>
  </div>

  <div className="home-footer-platform">
    <h4>Platform</h4>
    <span>Incident Detection</span>
    <span>Root Cause Analysis</span>
    <span>Service Monitoring</span>
  </div>

  <div className="home-footer-resources">
    <h4>Resources</h4>
    <a href="/docs">Documentation</a>
    <a
      href="https://github.com/rakshithkr23/Inferops"
      target="_blank"
      rel="noopener noreferrer"
    >
      GitHub Repository
    </a>
    <a href="/about">About InferOps</a>
  </div>

  <div className="home-footer-bottom">
    <span>© 2026 InferOps. All rights reserved.</span>
    <span>Built with AI & DevOps</span>
  </div>
</footer>
         </main>
  )
}

export default Home
