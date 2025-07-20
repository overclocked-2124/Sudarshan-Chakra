import { useState, useEffect, useRef } from 'react'
import { Target, Crosshair, Clock, Activity, Wifi, WifiOff } from 'lucide-react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import { Vector3 } from 'three'
import { radarAPI } from '../services/api'
import RadarComponents from './RadarComponents'
import './Dashboard.css'

// Radar Grid Component (Half circle for 0-180 degrees)
const RadarGrid = () => {
  const lines = []
  
  // Create concentric semicircles (0-180 degrees)
  for (let i = 1; i <= 5; i++) {
    const radius = i * 20
    const points = []
    for (let j = 0; j <= 32; j++) { // Half the points for semicircle
      const angle = (j / 32) * Math.PI // 0 to π radians (0 to 180 degrees)
      points.push(new Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ))
    }
    lines.push(
      <Line key={`circle-${i}`} points={points} color="#00ff41" lineWidth={1} opacity={0.3} />
    )
  }
  
  // Create radial lines (every 30 degrees from 0 to 180)
  for (let i = 0; i <= 6; i++) {
    const angle = (i / 6) * Math.PI // 0 to π radians
    const points = [
      new Vector3(0, 0, 0),
      new Vector3(Math.cos(angle) * 100, 0, Math.sin(angle) * 100)
    ]
    lines.push(
      <Line key={`radial-${i}`} points={points} color="#00ff41" lineWidth={1} opacity={0.2} />
    )
  }
  
  return <group>{lines}</group>
}

// Topographic Terrain
const Terrain = () => {
  const meshRef = useRef()
  
  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry
      const vertices = geometry.attributes.position.array
      
      // Create height variations for topographic effect
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i]
        const z = vertices[i + 2]
        const distance = Math.sqrt(x * x + z * z)
        const height = Math.sin(distance * 0.1) * 5 + Math.cos(x * 0.05) * 3
        vertices[i + 1] = height
      }
      
      geometry.attributes.position.needsUpdate = true
      geometry.computeVertexNormals()
    }
  }, [])
  
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
      <planeGeometry args={[200, 200, 50, 50]} />
      <meshStandardMaterial
        color="#001100"
        wireframe={true}
        opacity={0.3}
        transparent={true}
      />
    </mesh>
  )
}

// Statistical Marker Component for 3D radar
const StatisticalMarker = ({ distance, label, color, opacity = 0.6 }) => {
  if (distance === Infinity || distance === 0) return null
  
  // Create a circular line at the specified distance
  const points = []
  const radius = distance / 2 // Scale down for visualization
  
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI // 0 to π radians (0 to 180 degrees)
    points.push(new Vector3(
      Math.cos(angle) * radius,
      1,
      Math.sin(angle) * radius
    ))
  }
  
  return (
    <group>
      <Line points={points} color={color} lineWidth={2} opacity={opacity} />
      <Text
        position={[0, 3, radius]}
        fontSize={3}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {`${label}: ${distance.toFixed(1)}cm`}
      </Text>
    </group>
  )
}

// Target Marker
const TargetMarker = ({ angle, distance, isActive, opacity = 1.0, color = '#00ff41' }) => {
  // Convert angle to radians and calculate position (flipped orientation)
  const angleRad = ((180 - angle) * Math.PI) / 180 // Flip the angle
  const x = Math.cos(angleRad) * (distance / 2) // Scale down distance for visualization
  const z = Math.sin(angleRad) * (distance / 2)
  
  return (
    <group position={[x, 2, z]}>
      <mesh>
        <cylinderGeometry args={[2, 0, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 0.5 : 0.2}
          transparent={true}
          opacity={opacity}
        />
      </mesh>
      
      {/* Pulsing effect for active targets */}
      {isActive && (
        <mesh>
          <sphereGeometry args={[4, 16, 16]} />
          <meshStandardMaterial 
            color={color} 
            transparent={true} 
            opacity={0.3 * opacity}
            wireframe={true}
          />
        </mesh>
      )}
      
      <Text
        position={[0, 10, 0]}
        fontSize={4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {`${distance.toFixed(1)}cm`}
      </Text>
    </group>
  )
}

const Dashboard = () => {
  const [radarData, setRadarData] = useState({
    angle: 0,
    distance: 0,
    timestamp: Date.now() / 1000
  })
  const [recentData, setRecentData] = useState([])
  const [allData, setAllData] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sessionStartTime] = useState(Date.now())
  const [lastRadarValue, setLastRadarValue] = useState(null) // Track last value to detect changes
  const [pingStats, setPingStats] = useState({
    sessionPings: 0,
    dailyPings: 0,
    previousRanges: [], // Only show last 5 changed values
    previousBearings: [], // Only show last 5 changed bearing values
    averageRange: 0,
    minRange: Infinity,
    maxRange: 0,
    allTimeAverage: 0,
    allTimeMin: Infinity,
    allTimeMax: 0
  })

  // Update ping statistics with MongoDB data - only count new values
  const updatePingStats = (newDistance, newAngle, allMongoData = []) => {
    // Check if this is a new value (different from last recorded value)
    const isNewValue = lastRadarValue === null || 
                      Math.abs(newDistance - lastRadarValue.distance) > 0.1 || // Allow small tolerance for distance
                      Math.abs(newAngle - lastRadarValue.angle) > 1.0 || // Allow small tolerance for angle
                      Math.abs(Date.now() / 1000 - lastRadarValue.timestamp) > 30 // Or if more than 30 seconds passed
    
    if (!isNewValue) {
      return // Don't count recurring values
    }
    
    // Update last radar value
    setLastRadarValue({ distance: newDistance, angle: newAngle, timestamp: Date.now() / 1000 })
    
    setPingStats(prev => {
      const newPreviousRanges = [...prev.previousRanges, newDistance].slice(-5) // Keep only last 5 changed values
      const newPreviousBearings = [...prev.previousBearings, newAngle].slice(-5) // Keep only last 5 changed bearing values
      const averageRange = newPreviousRanges.reduce((sum, range) => sum + range, 0) / newPreviousRanges.length
      
      // Calculate all-time statistics from MongoDB
      let allTimeAverage = 0
      let allTimeMin = Infinity
      let allTimeMax = 0
      
      if (allMongoData.length > 0) {
        const allDistances = allMongoData.map(d => d.distance)
        allTimeAverage = allDistances.reduce((sum, d) => sum + d, 0) / allDistances.length
        allTimeMin = Math.min(...allDistances)
        allTimeMax = Math.max(...allDistances)
      }
      
      return {
        sessionPings: prev.sessionPings + 1, // Only increment for new values
        dailyPings: prev.dailyPings + 1,
        previousRanges: newPreviousRanges, // Only last 5 changed values
        previousBearings: newPreviousBearings, // Only last 5 changed bearing values
        averageRange: averageRange,
        minRange: Math.min(prev.minRange, newDistance),
        maxRange: Math.max(prev.maxRange, newDistance),
        allTimeAverage,
        allTimeMin,
        allTimeMax
      }
    })
  }

  // Fetch all data for statistics
  const fetchAllData = async () => {
    try {
      const response = await radarAPI.getAll(1, 500) // Get more data for statistics
      if (response.data) {
        setAllData(response.data)
        return response.data
      }
    } catch (err) {
      console.error('Failed to fetch all radar data:', err)
    }
    return []
  }

  // Fetch latest data from MongoDB
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
      
      // Fetch all data and update statistics
      const allMongoData = await fetchAllData()
      updatePingStats(data.distance, data.angle, allMongoData)
    } catch (err) {
      console.error('Failed to fetch radar data:', err)
      setError('Failed to connect to radar system')
      setIsConnected(false)
      
      // Use fallback simulated data if API fails
      const simulatedDistance = Math.random() * 100 + 10
      const simulatedAngle = Math.random() * 180
      setRadarData(prev => ({
        angle: simulatedAngle, // 0-180 degree range
        distance: simulatedDistance, // 10-110 cm
        timestamp: Date.now() / 1000
      }))
      updatePingStats(simulatedDistance, simulatedAngle, [])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch recent data for 3D visualization
  const fetchRecentData = async () => {
    try {
      const data = await radarAPI.getRecent()
      setRecentData(data || [])
    } catch (err) {
      console.error('Failed to fetch recent radar data:', err)
      // Use fallback data if API fails
      setRecentData([
        { angle: 45, distance: 60, timestamp: Date.now() / 1000 - 40 },
        { angle: 90, distance: 45, timestamp: Date.now() / 1000 - 30 },
        { angle: 135, distance: 75, timestamp: Date.now() / 1000 - 20 },
        { angle: 60, distance: 55, timestamp: Date.now() / 1000 - 10 },
        { angle: Math.random() * 180, distance: Math.random() * 100 + 10, timestamp: Date.now() / 1000 }
      ])
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
    fetchRecentData()
    
    // Check health initially
    checkHealth()
    
    // Set up periodic updates every 10 seconds
    const dataInterval = setInterval(() => {
      fetchRadarData()
      fetchRecentData()
    }, 10000)
    
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
            <div className="bearing-radar-container">
              <div className="bearing-radar">
                <div className="radar-background">
                  <div className="radar-grid">
                    {/* Create angle markers */}
                    {[0, 30, 60, 90, 120, 150, 180].map(angle => (
                      <div 
                        key={angle}
                        className="angle-marker" 
                        style={{ 
                          transform: `rotate(${angle}deg)`,
                          left: '50%',
                          top: '50%',
                          transformOrigin: '0 0'
                        }}
                      >
                        <span className="angle-label" style={{ transform: `rotate(${-angle}deg)` }}>
                          {angle}°
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="radar-sweep-line" 
                       style={{ transform: `rotate(${180 - radarData.angle}deg)` }}>
                  </div>
                  <div className="target-dot" 
                       style={{ 
                         transform: `rotate(${180 - radarData.angle}deg) translateX(60px)`,
                         transformOrigin: '0 0'
                       }}>
                  </div>
                  <div className="radar-center"></div>
                </div>
              </div>
              <div className="bearing-display">
                <div className="bearing-segments">
                  {[0, 30, 60, 90, 120, 150, 180].map(segmentAngle => (
                    <div 
                      key={segmentAngle}
                      className={`bearing-segment ${Math.abs(radarData.angle - segmentAngle) < 15 ? 'active' : ''}`}
                      style={{ 
                        background: Math.abs(radarData.angle - segmentAngle) < 15 ? '#00ff41' : 'rgba(0, 255, 65, 0.2)'
                      }}
                    >
                      {segmentAngle}°
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Previous bearings chart */}
            {pingStats.previousBearings.length > 0 && (
              <div className="previous-bearings">
                <div className="bearings-label">Last 5 Changed Bearings:</div>
                <div className="bearings-chart">
                  {pingStats.previousBearings.map((bearing, index) => (
                    <div
                      key={index}
                      className="bearing-bar"
                      style={{
                        height: `${(bearing / 180) * 40}px`,
                        backgroundColor: index === pingStats.previousBearings.length - 1 ? '#00ff41' : 'rgba(0, 255, 65, 0.5)'
                      }}
                      title={`${bearing.toFixed(1)}°`}
                    ></div>
                  ))}
                </div>
              </div>
            )}
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
            
            {/* Previous pings statistics */}
            <div className="ping-statistics">
              <div className="stat-row">
                <span className="stat-label">AVG:</span>
                <span className="stat-value">{pingStats.allTimeAverage > 0 ? pingStats.allTimeAverage.toFixed(1) : '0.0'} cm</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">MIN:</span>
                <span className="stat-value">{pingStats.allTimeMin === Infinity ? '0.0' : pingStats.allTimeMin.toFixed(1)} cm</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">MAX:</span>
                <span className="stat-value">{pingStats.allTimeMax > 0 ? pingStats.allTimeMax.toFixed(1) : '0.0'} cm</span>
              </div>
            </div>
            
            {/* Previous ranges chart */}
            {pingStats.previousRanges.length > 0 && (
              <div className="previous-ranges">
                <div className="ranges-label">Last 5 Changed Values:</div>
                <div className="ranges-chart">
                  {pingStats.previousRanges.map((range, index) => (
                    <div
                      key={index}
                      className="range-bar"
                      style={{
                        height: `${(range / 100) * 40}px`,
                        backgroundColor: index === pingStats.previousRanges.length - 1 ? '#00ff41' : 'rgba(0, 255, 65, 0.5)'
                      }}
                      title={`${range.toFixed(1)} cm`}
                    ></div>
                  ))}
                </div>
              </div>
            )}
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
            <div className="card-subtitle">System Time (Updates every 10s)</div>
            
            {/* Ping count statistics */}
            <div className="ping-counts">
              <div className="count-row">
                <span className="count-label">Session Pings:</span>
                <span className="count-value">{pingStats.sessionPings}</span>
              </div>
              <div className="count-row">
                <span className="count-label">Daily Pings:</span>
                <span className="count-value">{pingStats.dailyPings}</span>
              </div>
              <div className="count-row">
                <span className="count-label">Session Time:</span>
                <span className="count-value">
                  {Math.floor((Date.now() - sessionStartTime) / 60000)}m {Math.floor(((Date.now() - sessionStartTime) % 60000) / 1000)}s
                </span>
              </div>
            </div>
            
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

      <div className="tactical-3d-display">
        <h2 className="display-title">3D TACTICAL RADAR DISPLAY</h2>
        <div className="radar-canvas-dashboard">
          <Canvas camera={{ position: [40, 40, 40], fov: 75 }}>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ff41" />
            
            {/* Terrain */}
            <Terrain />
            
            {/* Radar Grid */}
            <RadarGrid />
            
            {/* Recent Target Markers from MongoDB (last 5 points) */}
            {recentData.map((data, index) => {
              const isNewest = index === recentData.length - 1
              return (
                <TargetMarker
                  key={`recent-${index}`}
                  angle={data.angle}
                  distance={data.distance}
                  isActive={isNewest}
                  opacity={isNewest ? 1.0 : 0.6 - (recentData.length - index - 1) * 0.1}
                  color={isNewest ? '#ff0080' : '#00ff41'}
                />
              )
            })}
            
            {/* Main Target Marker (current/latest) */}
            <TargetMarker
              angle={radarData.angle}
              distance={radarData.distance}
              isActive={true}
              color="#ff0000"
            />
            
            {/* Center marker */}
            <mesh position={[0, 1, 0]}>
              <cylinderGeometry args={[1, 1, 2]} />
              <meshStandardMaterial color="#00ff41" emissive="#00ff41" emissiveIntensity={0.3} />
            </mesh>
            
            {/* Angle markers (flipped orientation) */}
            <Text position={[-100, 5, 0]} fontSize={6} color="#00ff41">0°</Text>
            <Text position={[0, 5, 100]} fontSize={6} color="#00ff41">90°</Text>
            <Text position={[100, 5, 0]} fontSize={6} color="#00ff41">180°</Text>
            
            <OrbitControls enableZoom={true} enablePan={true} />
          </Canvas>
        </div>
      </div>

      <div className="radar-components-section">
        <h2 className="components-title">RADAR SYSTEM COMPONENTS</h2>
        <RadarComponents />
      </div>
    </div>
  )
}

export default Dashboard
