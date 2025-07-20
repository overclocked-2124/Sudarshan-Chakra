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

// Target Marker
const TargetMarker = ({ angle, distance, isActive, opacity = 1.0, color = '#00ff41' }) => {
  // Convert angle to radians and calculate position
  const angleRad = (angle * Math.PI) / 180
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
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

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
            <div className="angle-indicator">
              <div className="angle-scale-container">
                <div 
                  className="angle-pointer" 
                  style={{ 
                    transform: `rotate(${radarData.angle}deg)`,
                    transformOrigin: 'center bottom'
                  }}
                ></div>
                <div className="angle-scale">
                  <span className="scale-mark" style={{ left: '0%' }}>0°</span>
                  <span className="scale-mark" style={{ left: '25%' }}>45°</span>
                  <span className="scale-mark" style={{ left: '50%' }}>90°</span>
                  <span className="scale-mark" style={{ left: '75%' }}>135°</span>
                  <span className="scale-mark" style={{ left: '100%' }}>180°</span>
                </div>
                <div className="angle-arc"></div>
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
            <div className="card-subtitle">System Time (Updates every 10s)</div>
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
            
            {/* Angle markers */}
            <Text position={[100, 5, 0]} fontSize={6} color="#00ff41">0°</Text>
            <Text position={[0, 5, 100]} fontSize={6} color="#00ff41">90°</Text>
            <Text position={[-100, 5, 0]} fontSize={6} color="#00ff41">180°</Text>
            
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
