import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

function Login() {
  const navigate = useNavigate()
  const googleButtonRef = useRef(null)

  const [mode, setMode] = useState('login')
  const [loginMethod, setLoginMethod] = useState('phone')

  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Google Sign-In initialization
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    if (!clientId) return

    let active = true

    const initializeGoogleLogin = () => {
      if (!active || !window.google?.accounts?.id) return

      if (!googleButtonRef.current) return

      window.google.accounts.id.initialize({
        client_id: clientId,

        callback: async (response) => {
          setLoading(true)
          setError('')
          setSuccess('')

          try {
            const result = await fetch(`${API_URL}/auth/google`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                credential: response.credential,
              }),
            })

            const data = await result.json()

            if (!result.ok) {
              throw new Error(data.detail || 'Google sign-in failed.')
            }

            navigate('/', { replace: true })
          } catch (err) {
            setError(err.message || 'Unable to sign in with Google.')
          } finally {
            setLoading(false)
          }
        },
      })

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'signin_with',
          width: 280,
        },
      )
    }

    if (window.google?.accounts?.id) {
      initializeGoogleLogin()
    } else {
      let script = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]',
      )

      if (!script) {
        script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }

      script.addEventListener('load', initializeGoogleLogin)

      return () => {
        active = false
        script.removeEventListener('load', initializeGoogleLogin)
      }
    }

    return () => {
      active = false
    }
  }, [navigate])

  useEffect(() => {
  let active = true

  async function checkExistingSession() {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      })

      if (active && response.ok) {
        navigate('/', { replace: true })
      }
    } catch (error) {
      console.error('Session check failed:', error)
    }
  }

  checkExistingSession()

  return () => {
    active = false
  }
}, [navigate])

  // Login submission
  async function handleLogin(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!identifier.trim() || !password) {
      setError('Please enter your login details.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed.')
      }

      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  // Registration submission
  async function handleRegistration(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (
      !fullName.trim() ||
      !phoneNumber.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('Please complete all registration fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          email: email.trim(),
          password,
          confirm_password: confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed.')
      }

      setIdentifier(phoneNumber.trim())
      setLoginMethod('phone')
      setPassword('')
      setConfirmPassword('')
      setMode('login')

      setSuccess(
        'Registration successful! Please sign in using your phone number and password.',
      )
    } catch (err) {
      setError(err.message || 'Unable to create your account.')
    } finally {
      setLoading(false)
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
    setSuccess('')
    setPassword('')
    setConfirmPassword('')
  }

  function switchLoginMethod(method) {
    setLoginMethod(method)
    setIdentifier('')
    setError('')
    setSuccess('')
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1>Inferops</h1>

        <p className="login-subtitle">
          AI-Driven DevOps Incident Detection & Root Cause Analysis
        </p>

        {mode === 'login' ? (
          <>
            <h2>Welcome back</h2>

            <p>Sign in to access your Inferops dashboard.</p>

            <div className="auth-tabs">
              <button
                type="button"
                className={loginMethod === 'phone' ? 'active' : ''}
                onClick={() => switchLoginMethod('phone')}
              >
                Phone
              </button>

              <button
                type="button"
                className={loginMethod === 'email' ? 'active' : ''}
                onClick={() => switchLoginMethod('email')}
              >
                Email
              </button>
            </div>

            <form onSubmit={handleLogin}>
              <div className="auth-form-group">
                <label htmlFor="login-identifier">
                  {loginMethod === 'phone'
                    ? 'Phone Number'
                    : 'Email Address'}
                </label>

                <input
                  id="login-identifier"
                  type={loginMethod === 'phone' ? 'tel' : 'email'}
                  value={identifier}
                  onChange={(event) =>
                    setIdentifier(event.target.value)
                  }
                  placeholder={
                    loginMethod === 'phone'
                      ? 'Enter your phone number'
                      : 'Enter your email address'
                  }
                  autoComplete={
                    loginMethod === 'phone'
                      ? 'tel'
                      : 'email'
                  }
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="login-password">
                  Password
                </label>

                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                className="auth-submit-button"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
              >
                Create Account
              </button>
            </p>
          </>
        ) : (
          <>
            <h2>Create your account</h2>

            <p>Register to get started with Inferops.</p>

            <form onSubmit={handleRegistration}>
              <div className="auth-form-group">
                <label htmlFor="register-name">
                  Full Name
                </label>

                <input
                  id="register-name"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={20}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="register-phone">
                  Phone Number
                </label>

                <input
                  id="register-phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) =>
                    setPhoneNumber(event.target.value)
                  }
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  maxLength={12}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="register-email">
                  Email Address
                </label>

                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email address"
                  autoComplete="email"
                  maxLength={30}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="register-password">
                  Password
                </label>

                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Create a password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={80}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="register-confirm-password">
                  Confirm Password
                </label>

                <input
                  id="register-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                className="auth-submit-button"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
              >
                Sign In
              </button>
            </p>
          </>
        )}

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="login-success" role="status">
            {success}
          </p>
        )}

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div
          className="google-login-button"
          ref={googleButtonRef}
        />

        {loading && (
          <p className="auth-loading-text">
            Please wait...
          </p>
        )}
      </section>
    </main>
  )
}

export default Login