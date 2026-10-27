
// import { useState } from 'react'
import './App.css'

// const incidents = [
//   {
//     id: 'INC-1042',
//     title: 'Backend API response timeout',
//     service: 'inferops-backend',
//     severity: 'High',
//     status: 'Investigating',
//     time: '5 min ago',
//   },
//   {
//     id: 'INC-1041',
//     title: 'Database connection failure',
//     service: 'postgresql',
//     severity: 'Critical',
//     status: 'Open',
//     time: '18 min ago',
//   },
//   {
//     id: 'INC-1040',
//     title: 'Container restart detected',
//     service: 'inferops-worker',
//     severity: 'Medium',
//     status: 'Resolved',
//     time: '42 min ago',
//   },
// ]

// const navigation = [
//   { icon: '▦', label: 'Overview', href: '#overview' },
//   { icon: '⚠', label: 'Incidents', href: '#incidents' },
//   { icon: '⌕', label: 'Root cause analysis', href: '#root-cause-analysis' },
//   { icon: '◈', label: 'Services', href: '#services' },
//   { icon: '▤', label: 'Logs & metrics', href: '#logs-metrics' },
//   { icon: '⚙', label: 'Settings', href: '#settings' },
// ]

// function App() {
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
//   const [theme, setTheme] = useState('dark')
//   const [notificationsOpen, setNotificationsOpen] = useState(false)
//   const [settingsOpen, setSettingsOpen] = useState(false)
//   const [notifications, setNotifications] = useState([
//     {
//       id: 1,
//       title: 'Database connection failure',
//       detail: 'PostgreSQL · Critical incident detected',
//       time: '18 min ago',
//       read: false,
//     },
//     {
//       id: 2,
//       title: 'Backend API response timeout',
//       detail: 'inferops-backend · High severity',
//       time: '5 min ago',
//       read: false,
//     },
//     {
//       id: 3,
//       title: 'Container restart detected',
//       detail: 'inferops-worker · Incident resolved',
//       time: '42 min ago',
//       read: true,
//     },
//   ])

//   const unreadCount = notifications.filter(
//     (notification) => !notification.read,
//   ).length

//   function markAllAsRead() {
//     setNotifications((current) =>
//       current.map((notification) => ({ ...notification, read: true })),
//     )
//   }

//   function toggleTheme() {
//     setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
//   }

//   return (
//     <div className={`dashboard theme-${theme} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
//       <aside className="sidebar">
//         <a className="brand" href="#overview" aria-label="InferOps home" title="InferOps">
//           <span className="brand-mark">I</span>
//           <span className="brand-copy">
//             <strong>InferOps</strong>
//             <small>INTELLIGENT OPERATIONS</small>
//           </span>
//           <button
//             className="sidebar-toggle"
//             type="button"
//             onClick={(event) => {
//               event.preventDefault()
//               setSidebarCollapsed((current) => !current)
//             }}
//             aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
//             title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
//           >
//             {sidebarCollapsed ? '☰' : '◧'}
//           </button>
//         </a>

//         <div className="workspace-label">WORKSPACE</div>

//         <nav className="navigation" aria-label="Main navigation">
//           {navigation.map((item, index) => (
//             <a
//               className={`nav-item ${index === 0 ? 'active' : ''}`}
//               href={item.href}
//               key={item.label}
//               aria-current={index === 0 ? 'page' : undefined}
//               title={sidebarCollapsed ? item.label : undefined}
//             >
//               <span className="nav-icon" aria-hidden="true">{item.icon}</span>
//               <span className="nav-label">{item.label}</span>
//               {item.label === 'Incidents' && (
//                 <span className="nav-count">3</span>
//               )}
//             </a>
//           ))}
//         </nav>

//         <div className="sidebar-bottom">
//           <div className="environment-card" title="Local development environment">
//             <span className="environment-dot" />
//             <div className="sidebar-copy">
//               <strong>Development</strong>
//               <small>Local environment</small>
//             </div>
//           </div>

//           <div className="profile">
//             <div className="profile-avatar">IO</div>
//             <div className="sidebar-copy">
//               <strong>InferOps Admin</strong>
//               <small>Project workspace</small>
//             </div>
//           </div>
//         </div>
//       </aside>

//       <main className="main-content" id="overview">
//         <header className="topbar">
//           <div className="topbar-left">
//             <button
//               className="icon-button mobile-menu-button"
//               type="button"
//               onClick={() => setSidebarCollapsed((current) => !current)}
//               aria-label="Toggle sidebar"
//               title="Toggle sidebar"
//             >
//               ☰
//             </button>
//             <div className="breadcrumb">
//               Workspace <span>/</span> Overview
//             </div>
//           </div>

//           <div className="topbar-right">
//             <span className="demo-badge">DEMO DATA</span>

//             <button
//               className="icon-button theme-toggle"
//               type="button"
//               onClick={toggleTheme}
//               aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
//               title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
//             >
//               {theme === 'dark' ? '☀' : '☾'}
//             </button>

//             <div className="popover-container">
//               <button
//                 className="icon-button notification-button"
//                 type="button"
//                 onClick={() => {
//                   setNotificationsOpen((current) => !current)
//                   setSettingsOpen(false)
//                 }}
//                 aria-label={`Notifications, ${unreadCount} unread`}
//                 aria-expanded={notificationsOpen}
//                 title="Notifications"
//               >
//                 ♧
//                 {unreadCount > 0 && (
//                   <span className="notification-count">{unreadCount}</span>
//                 )}
//               </button>

//               {notificationsOpen && (
//                 <section className="popover-panel notification-panel">
//                   <div className="popover-heading">
//                     <div>
//                       <h3>Notifications</h3>
//                       <p>{unreadCount} unread notifications</p>
//                     </div>
//                     <button
//                       className="text-button"
//                       type="button"
//                       onClick={markAllAsRead}
//                     >
//                       Mark all read
//                     </button>
//                   </div>

//                   <div className="notification-list">
//                     {notifications.map((notification) => (
//                       <button
//                         className={`notification-item ${notification.read ? 'is-read' : 'is-unread'}`}
//                         key={notification.id}
//                         type="button"
//                         onClick={() => {
//                           setNotifications((current) =>
//                             current.map((item) =>
//                               item.id === notification.id
//                                 ? { ...item, read: true }
//                                 : item,
//                             ),
//                           )
//                         }}
//                       >
//                         <span className="notification-dot" />
//                         <span className="notification-content">
//                           <strong>{notification.title}</strong>
//                           <small>{notification.detail}</small>
//                           <small>{notification.time}</small>
//                         </span>
//                       </button>
//                     ))}
//                   </div>

//                   <p className="popover-footnote">
//                     Sample notifications · Backend integration pending
//                   </p>
//                 </section>
//               )}
//             </div>

//             <div className="popover-container">
//               <button
//                 className="profile-trigger"
//                 type="button"
//                 onClick={() => {
//                   setSettingsOpen((current) => !current)
//                   setNotificationsOpen(false)
//                 }}
//                 aria-expanded={settingsOpen}
//                 title="Profile and settings"
//               >
//                 <span className="profile-avatar">IO</span>
//                 <span className="profile-trigger-label">Admin</span>
//                 <span aria-hidden="true">⌄</span>
//               </button>

//               {settingsOpen && (
//                 <section className="popover-panel settings-panel" id="settings">
//                   <div className="popover-heading">
//                     <div>
//                       <h3>Settings</h3>
//                       <p>Dashboard preferences</p>
//                     </div>
//                   </div>

//                   <div className="setting-row">
//                     <div>
//                       <strong>Appearance</strong>
//                       <small>{theme === 'dark' ? 'Dark theme' : 'Light theme'}</small>
//                     </div>
//                     <button
//                       className="secondary-button compact-button"
//                       type="button"
//                       onClick={toggleTheme}
//                     >
//                       Change
//                     </button>
//                   </div>

//                   <div className="setting-row">
//                     <div>
//                       <strong>Notifications</strong>
//                       <small>In-app notification preview</small>
//                     </div>
//                     <span className="setting-status">Enabled</span>
//                   </div>

//                   <div className="settings-footer">
//                     InferOps · Local development preview
//                   </div>
//                 </section>
//               )}
//             </div>
//           </div>
//         </header>

//         <section className="page-heading">
//           <div>
//             <p className="eyebrow">OPERATIONS CENTER</p>
//             <h1>Overview</h1>
//             <p className="page-description">
//               Monitor incidents, investigate failures, and understand root causes.
//             </p>
//           </div>
//           <button className="primary-button" type="button">
//             <span aria-hidden="true">＋</span> New incident
//           </button>
//         </section>

//         <section className="metrics-grid" aria-label="Incident summary">
//           <article className="metric-card">
//             <div className="metric-top">
//               <span>Total incidents</span>
//               <span className="metric-icon purple">▦</span>
//             </div>
//             <div className="metric-value">24</div>
//             <p className="metric-note">Recorded in this demo</p>
//           </article>

//           <article className="metric-card">
//             <div className="metric-top">
//               <span>Open incidents</span>
//               <span className="metric-icon orange">⚠</span>
//             </div>
//             <div className="metric-value">08</div>
//             <p className="metric-note">Require attention</p>
//           </article>

//           <article className="metric-card">
//             <div className="metric-top">
//               <span>Critical incidents</span>
//               <span className="metric-icon red">!</span>
//             </div>
//             <div className="metric-value">02</div>
//             <p className="metric-note">High-priority events</p>
//           </article>

//           <article className="metric-card">
//             <div className="metric-top">
//               <span>Services monitored</span>
//               <span className="metric-icon green">◈</span>
//             </div>
//             <div className="metric-value">05</div>
//             <p className="metric-note">Sample service inventory</p>
//           </article>
//         </section>

//         <section className="content-grid">
//           <article className="panel incidents-panel" id="incidents">
//             <div className="panel-heading">
//               <div>
//                 <h2>Recent incidents</h2>
//                 <p>Latest events across your services</p>
//               </div>
//               <a href="#incidents">View all <span aria-hidden="true">→</span></a>
//             </div>

//             <div className="incident-table-wrap">
//               <table className="incident-table">
//                 <thead>
//                   <tr>
//                     <th>INCIDENT</th>
//                     <th>SERVICE</th>
//                     <th>SEVERITY</th>
//                     <th>STATUS</th>
//                     <th>TIME</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {incidents.map((incident) => (
//                     <tr key={incident.id}>
//                       <td>
//                         <strong className="incident-title">{incident.title}</strong>
//                         <span className="incident-id">{incident.id}</span>
//                       </td>
//                       <td>
//                         <span className="service-name">{incident.service}</span>
//                       </td>
//                       <td>
//                         <span className={`severity severity-${incident.severity.toLowerCase()}`}>
//                           {incident.severity}
//                         </span>
//                       </td>
//                       <td>
//                         <span className={`incident-status status-${incident.status.toLowerCase()}`}>
//                           {incident.status}
//                         </span>
//                       </td>
//                       <td className="time-cell">{incident.time}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </article>

//           <article className="panel rca-panel" id="root-cause-analysis">
//             <div className="panel-heading">
//               <div>
//                 <h2>AI root cause analysis</h2>
//                 <p>Investigation assistant</p>
//               </div>
//               <span className="ai-icon">✳</span>
//             </div>

//             <div className="rca-illustration" aria-hidden="true">
//               <div className="rca-orbit orbit-one" />
//               <div className="rca-orbit orbit-two" />
//               <div className="rca-core">✳</div>
//               <span className="orbit-node node-one">⌕</span>
//               <span className="orbit-node node-two">▤</span>
//               <span className="orbit-node node-three">◈</span>
//             </div>

//             <h3>Turn incidents into insights</h3>
//             <p className="rca-description">
//               Analyze incident details, retrieve similar historical events,
//               and review evidence-backed root cause recommendations.
//             </p>
//             <button className="secondary-button" type="button">
//               Explore RCA <span aria-hidden="true">→</span>
//             </button>
//             <p className="demo-note">
//               <span className="status-dot" />
//               Demo interface · Backend integration pending
//             </p>
//           </article>
//         </section>

//         <footer className="dashboard-footer">
//           <span>InferOps <span className="footer-divider">/</span> Incident intelligence</span>
//           <span>Development preview</span>
//         </footer>
//       </main>
//     </div>
//   )
// }

// export default App

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
