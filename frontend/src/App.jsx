import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import RadarMap from './components/RadarMap'
import BlankPage from './components/BlankPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/radar" element={<RadarMap />} />
          <Route path="/classified" element={<BlankPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
