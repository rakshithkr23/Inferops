

import './App.css'

import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Incidents from './pages/Incidents.jsx'
import RootCauseAnalysis from './pages/RootCauseAnalysis.jsx'
import Services from './pages/Services.jsx'
import LogsMetrics from './pages/LogsMetrics.jsx'
import Feedback from './pages/Feedback.jsx'
import Settings from './pages/Settings.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
      </Routes>
    </BrowserRouter>
  )
}

export default App
