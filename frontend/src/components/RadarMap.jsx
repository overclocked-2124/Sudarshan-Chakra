import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import { Vector3 } from 'three'
import './RadarMap.css'

// Radar Grid Component
const RadarGrid = () => {
  const lines = []
  
  // Create concentric circles
  for (let i = 1; i <= 5; i++) {
    const radius = i * 20
    const points = []
    for (let j = 0; j <= 64; j++) {
      const angle = (j / 64) * Math.PI * 2
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
  
  // Create radial lines
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
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
const TargetMarker = ({ angle, distance, isActive }) => {
  const x = Math.cos((angle * Math.PI) / 180) * distance
  const z = Math.sin((angle * Math.PI) / 180) * distance
  
  return (
    <group position={[x, 2, z]}>
      <mesh>
        <cylinderGeometry args={[2, 0, 8]} />
        <meshStandardMaterial
          color={isActive ? "#ff0000" : "#ff8800"}
          emissive={isActive ? "#ff0000" : "#ff8800"}
          emissiveIntensity={0.5}
        />
      </mesh>
      <Text
        position={[0, 10, 0]}
        fontSize={4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {`${distance}m`}
      </Text>
    </group>
  )
}

// Radar Sweep
const RadarSweep = ({ currentAngle }) => {
  const points = [
    new Vector3(0, 0.1, 0),
    new Vector3(
      Math.cos((currentAngle * Math.PI) / 180) * 100,
      0.1,
      Math.sin((currentAngle * Math.PI) / 180) * 100
    )
  ]
  
  return (
    <Line
      points={points}
      color="#00ff41"
      lineWidth={3}
      opacity={0.8}
    />
  )
}

const RadarMap = () => {
  const [radarData, setRadarData] = useState({
    angle: 30.9,
    distance: 80.1,
    timestamp: Date.now() / 1000
  })
  const [sweepAngle, setSweepAngle] = useState(0)
  
  // Simulate radar sweep
  useEffect(() => {
    const interval = setInterval(() => {
      setSweepAngle(prev => (prev + 2) % 360)
    }, 50)
    
    return () => clearInterval(interval)
  }, [])
  
  // Simulate target updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarData(prev => ({
        angle: (Math.random() * 360),
        distance: (Math.random() * 80 + 20),
        timestamp: Date.now() / 1000
      }))
    }, 4000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="radar-map">
      <div className="radar-header">
        <h1>3D TACTICAL RADAR DISPLAY</h1>
        <div className="radar-info">
          <div className="info-item">
            <span className="info-label">SWEEP ANGLE:</span>
            <span className="info-value">{sweepAngle.toFixed(1)}°</span>
          </div>
          <div className="info-item">
            <span className="info-label">TARGET BEARING:</span>
            <span className="info-value">{radarData.angle.toFixed(1)}°</span>
          </div>
          <div className="info-item">
            <span className="info-label">RANGE:</span>
            <span className="info-value">{radarData.distance.toFixed(1)}m</span>
          </div>
        </div>
      </div>
      
      <div className="radar-canvas">
        <Canvas camera={{ position: [50, 50, 50], fov: 75 }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ff41" />
          
          {/* Terrain */}
          <Terrain />
          
          {/* Radar Grid */}
          <RadarGrid />
          
          {/* Radar Sweep */}
          <RadarSweep currentAngle={sweepAngle} />
          
          {/* Target Marker */}
          <TargetMarker
            angle={radarData.angle}
            distance={radarData.distance}
            isActive={true}
          />
          
          {/* Additional static targets */}
          <TargetMarker angle={120} distance={45} isActive={false} />
          <TargetMarker angle={240} distance={65} isActive={false} />
          
          {/* Center marker */}
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[1, 1, 2]} />
            <meshStandardMaterial color="#00ff41" emissive="#00ff41" emissiveIntensity={0.3} />
          </mesh>
          
          <OrbitControls enableZoom={true} enablePan={true} />
        </Canvas>
      </div>
      
      <div className="radar-controls">
        <div className="control-panel">
          <h3>RADAR CONTROLS</h3>
          <div className="control-grid">
            <div className="control-item">
              <span className="control-label">SCAN MODE:</span>
              <span className="control-value active">CONTINUOUS</span>
            </div>
            <div className="control-item">
              <span className="control-label">RANGE:</span>
              <span className="control-value">100M</span>
            </div>
            <div className="control-item">
              <span className="control-label">FREQUENCY:</span>
              <span className="control-value">X-BAND</span>
            </div>
            <div className="control-item">
              <span className="control-label">TARGETS:</span>
              <span className="control-value">3 DETECTED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RadarMap
