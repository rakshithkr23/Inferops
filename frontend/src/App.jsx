
import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom'

import './App.css'
import { API_URL } from './config'

import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Incidents from './pages/Incidents.jsx'
import RootCauseAnalysis from './pages/RootCauseAnalysis.jsx'
import Services from './pages/Services.jsx'
import LogsMetrics from './pages/LogsMetrics.jsx'
import Feedback from './pages/Feedback.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/Login.jsx'

function ProtectedRoute() {
  const [authenticated, setAuthenticated] = useState(null)

  useEffect(() => {
    let active = true

    async function checkAuthentication() {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: 'include',
        })

        if (active) {
          setAuthenticated(response.ok)
        }
      } catch {
        if (active) {
          setAuthenticated(false)
        }
      }
    }

    checkAuthentication()

    return () => {
      active = false
    }
  }, [])

  if (authenticated === null) {
    return (
      <div className="auth-loading">
        <p>Checking authentication...</p>
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="incidents" element={<Incidents />} />
            <Route
              path="root-cause-analysis"
              element={<RootCauseAnalysis />}
            />
            <Route path="services" element={<Services />} />
            <Route path="logs-metrics" element={<LogsMetrics />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="settings" element={<Settings />} />
            <Route
              path="*"
              element={<h2 className="page-section">Page not found</h2>}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
