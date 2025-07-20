import { useState, useEffect } from 'react'
import { Target, Crosshair, Clock, Activity } from 'lucide-react'
import './Dashboard.css'

const Dashboard = () => {
  const [radarData, setRadarData] = useState({
    angle: 30.9,
    distance: 80.1,
    timestamp: 1753001114.7574248
  })

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarData(prev => ({
        angle: (Math.random() * 360).toFixed(1),
        distance: (Math.random() * 100 + 10).toFixed(1),
        timestamp: Date.now() / 1000
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getThreatLevel = (distance) => {
    if (distance < 30) return { level: 'CRITICAL', color: '#ff0000' }
    if (distance < 60) return { level: 'HIGH', color: '#ff8800' }
    return { level: 'MODERATE', color: '#00ff41' }
  }

  const threat = getThreatLevel(parseFloat(radarData.distance))

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">TACTICAL RADAR CONTROL CENTER</h1>
        <div className="threat-level" style={{ borderColor: threat.color }}>
          <span style={{ color: threat.color }}>THREAT LEVEL: {threat.level}</span>
        </div>
      </div>

      <div className="radar-cards">
        <div className="radar-card angle-card">
          <div className="card-header">
            <Crosshair className="card-icon" />
            <h3>TARGET BEARING</h3>
          </div>
          <div className="card-body">
            <div className="main-value">{radarData.angle}°</div>
            <div className="card-subtitle">Azimuth Angle</div>
            <div className="angle-indicator">
              <div 
                className="angle-pointer" 
                style={{ transform: `rotate(${radarData.angle}deg)` }}
              ></div>
            </div>
          </div>
          <div className="card-footer">
            <Activity className="footer-icon" />
            <span>TRACKING ACTIVE</span>
          </div>
        </div>

        <div className="radar-card distance-card">
          <div className="card-header">
            <Target className="card-icon" />
            <h3>TARGET RANGE</h3>
          </div>
          <div className="card-body">
            <div className="main-value">{radarData.distance}</div>
            <div className="card-subtitle">Meters</div>
            <div className="distance-bar">
              <div 
                className="distance-fill" 
                style={{ 
                  width: `${Math.min(parseFloat(radarData.distance), 100)}%`,
                  backgroundColor: threat.color
                }}
              ></div>
            </div>
          </div>
          <div className="card-footer">
            <Activity className="footer-icon" />
            <span>RANGE CONFIRMED</span>
          </div>
        </div>

        <div className="radar-card timestamp-card">
          <div className="card-header">
            <Clock className="card-icon" />
            <h3>LAST PING</h3>
          </div>
          <div className="card-body">
            <div className="main-value timestamp-value">
              {formatTimestamp(radarData.timestamp)}
            </div>
            <div className="card-subtitle">System Time</div>
            <div className="pulse-indicator">
              <div className="pulse-dot"></div>
            </div>
          </div>
          <div className="card-footer">
            <Activity className="footer-icon" />
            <span>REAL-TIME</span>
          </div>
        </div>
      </div>

      <div className="tactical-grid">
        <div className="grid-section system-status">
          <h3>SYSTEM STATUS</h3>
          <div className="status-items">
            <div className="status-item">
              <span className="status-label">RADAR ARRAY</span>
              <span className="status-value online">OPERATIONAL</span>
            </div>
            <div className="status-item">
              <span className="status-label">TRACKING SYSTEM</span>
              <span className="status-value online">ACTIVE</span>
            </div>
            <div className="status-item">
              <span className="status-label">DATA LINK</span>
              <span className="status-value online">SECURE</span>
            </div>
            <div className="status-item">
              <span className="status-label">POWER GRID</span>
              <span className="status-value online">NOMINAL</span>
            </div>
          </div>
        </div>

        <div className="grid-section mission-info">
          <h3>MISSION PARAMETERS</h3>
          <div className="mission-items">
            <div className="mission-item">
              <span className="mission-label">OPERATION</span>
              <span className="mission-value">SUDARSHAN SHIELD</span>
            </div>
            <div className="mission-item">
              <span className="mission-label">SECTOR</span>
              <span className="mission-value">ALPHA-7</span>
            </div>
            <div className="mission-item">
              <span className="mission-label">CLASSIFICATION</span>
              <span className="mission-value">TOP SECRET</span>
            </div>
            <div className="mission-item">
              <span className="mission-label">CLEARANCE</span>
              <span className="mission-value">LEVEL 5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
