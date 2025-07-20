import { useState, useEffect } from 'react'
import { Target, Crosshair, Clock, Activity, Wifi, WifiOff } from 'lucide-react'
import { radarAPI } from '../services/api'
import './Dashboard.css'

const Dashboard = () => {
  const [radarData, setRadarData] = useState({
    angle: 0,
    distance: 0,
    timestamp: Date.now() / 1000
  })
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch data from MongoDB
  const fetchRadarData = async () => {
    try {
      const data = await radarAPI.getLatest()
      setRadarData({
        angle: data.angle,
        distance: data.distance,
        timestamp: data.timestamp
      })
      setIsConnected(true)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch radar data:', err)
      setError('Failed to connect to radar system')
      setIsConnected(false)
      
      // Use fallback simulated data if API fails
      setRadarData(prev => ({
        angle: Math.random() * 180, // 0-180 degree range
        distance: Math.random() * 100 + 10, // 10-110 cm
        timestamp: Date.now() / 1000
      }))
    } finally {
      setIsLoading(false)
    }
  }

  // Check backend health
  const checkHealth = async () => {
    try {
      await radarAPI.health()
      setIsConnected(true)
      setError(null)
    } catch (err) {
      setIsConnected(false)
      setError('Backend server unavailable')
    }
  }

  // Initialize data and set up periodic updates
  useEffect(() => {
    // Initial data fetch
    fetchRadarData()
    
    // Check health initially
    checkHealth()
    
    // Set up periodic updates every 15 seconds
    const dataInterval = setInterval(fetchRadarData, 15000)
    
    // Health check every 30 seconds
    const healthInterval = setInterval(checkHealth, 30000)
    
    return () => {
      clearInterval(dataInterval)
      clearInterval(healthInterval)
    }
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

  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <h2>INITIALIZING RADAR SYSTEM...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">TACTICAL RADAR CONTROL CENTER</h1>
        <div className="system-status-header">
          <div className="connection-status">
            {isConnected ? (
              <><Wifi className="status-icon online" /> CONNECTED</>
            ) : (
              <><WifiOff className="status-icon offline" /> DISCONNECTED</>
            )}
          </div>
          <div className="threat-level" style={{ borderColor: threat.color }}>
            <span style={{ color: threat.color }}>THREAT LEVEL: {threat.level}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error} - Using simulated data</span>
        </div>
      )}

      <div className="radar-cards">
        <div className="radar-card angle-card">
          <div className="card-header">
            <Crosshair className="card-icon" />
            <h3>TARGET BEARING</h3>
          </div>
          <div className="card-body">
            <div className="main-value">{radarData.angle.toFixed(1)}°</div>
            <div className="card-subtitle">Azimuth Angle (0-180°)</div>
            <div className="angle-indicator">
              <div 
                className="angle-pointer" 
                style={{ transform: `rotate(${radarData.angle}deg)` }}
              ></div>
              <div className="angle-scale">
                <span className="scale-mark" style={{ left: '0%' }}>0°</span>
                <span className="scale-mark" style={{ left: '50%' }}>90°</span>
                <span className="scale-mark" style={{ left: '100%' }}>180°</span>
              </div>
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
            <div className="main-value">{radarData.distance.toFixed(1)}</div>
            <div className="card-subtitle">Centimeters</div>
            <div className="distance-bar">
              <div 
                className="distance-fill" 
                style={{ 
                  width: `${Math.min(parseFloat(radarData.distance), 100)}%`,
                  backgroundColor: threat.color
                }}
              ></div>
              <div className="distance-scale">
                <span className="scale-value">0 cm</span>
                <span className="scale-value">50 cm</span>
                <span className="scale-value">100 cm</span>
              </div>
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
            <div className="card-subtitle">System Time (Updates every 15s)</div>
            <div className="pulse-indicator">
              <div className={`pulse-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
            </div>
          </div>
          <div className="card-footer">
            <Activity className="footer-icon" />
            <span>{isConnected ? 'REAL-TIME' : 'SIMULATED'}</span>
          </div>
        </div>
      </div>

      <div className="tactical-grid">
        <div className="grid-section system-status">
          <h3>SYSTEM STATUS</h3>
          <div className="status-items">
            <div className="status-item">
              <span className="status-label">RADAR ARRAY</span>
              <span className={`status-value ${isConnected ? 'online' : 'offline'}`}>
                {isConnected ? 'OPERATIONAL' : 'OFFLINE'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">TRACKING SYSTEM</span>
              <span className={`status-value ${isConnected ? 'online' : 'offline'}`}>
                {isConnected ? 'ACTIVE' : 'STANDBY'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">DATA LINK</span>
              <span className={`status-value ${isConnected ? 'online' : 'offline'}`}>
                {isConnected ? 'SECURE' : 'DISCONNECTED'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">UPDATE RATE</span>
              <span className="status-value online">15 SECONDS</span>
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
              <span className="mission-label">RANGE</span>
              <span className="mission-value">0-180°</span>
            </div>
            <div className="mission-item">
              <span className="mission-label">PRECISION</span>
              <span className="mission-value">±1 CM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
