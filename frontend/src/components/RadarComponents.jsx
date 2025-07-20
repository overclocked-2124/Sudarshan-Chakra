import { useState, useEffect } from 'react'
import { radarAPI } from '../services/api'
import './RadarComponents.css'

const RadarComponents = () => {
  const [radarData, setRadarData] = useState({
    angle: 0,
    distance: 0,
    timestamp: Date.now() / 1000
  })
  const [isConnected, setIsConnected] = useState(false)
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
      
      // Use fallback simulated data
      setRadarData(prev => ({
        angle: Math.random() * 180,
        distance: Math.random() * 100 + 10,
        timestamp: Date.now() / 1000
      }))
    }
  }

  useEffect(() => {
    fetchRadarData()
    const interval = setInterval(fetchRadarData, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="radar-components">
      <div className="component-section radar-transmitter">
        <h3>RADAR TRANSMITTER</h3>
        <div className="component-items">
          <div className="component-item">
            <span className="component-label">FREQUENCY BAND</span>
            <span className="component-value">X-BAND (8-12 GHz)</span>
          </div>
          <div className="component-item">
            <span className="component-label">POWER OUTPUT</span>
            <span className="component-value">1.2 MW</span>
          </div>
          <div className="component-item">
            <span className="component-label">PULSE WIDTH</span>
            <span className="component-value">0.5 μs</span>
          </div>
          <div className="component-item">
            <span className="component-label">PRF</span>
            <span className="component-value">2 KHz</span>
          </div>
        </div>
      </div>

      <div className="component-section radar-receiver">
        <h3>RADAR RECEIVER</h3>
        <div className="component-items">
          <div className="component-item">
            <span className="component-label">SENSITIVITY</span>
            <span className="component-value">-120 dBm</span>
          </div>
          <div className="component-item">
            <span className="component-label">NOISE FIGURE</span>
            <span className="component-value">3.5 dB</span>
          </div>
          <div className="component-item">
            <span className="component-label">BANDWIDTH</span>
            <span className="component-value">2 MHz</span>
          </div>
          <div className="component-item">
            <span className="component-label">DYNAMIC RANGE</span>
            <span className="component-value">80 dB</span>
          </div>
        </div>
      </div>

      <div className="component-section antenna-array">
        <h3>ANTENNA ARRAY</h3>
        <div className="component-items">
          <div className="component-item">
            <span className="component-label">ARRAY TYPE</span>
            <span className="component-value">PHASED ARRAY</span>
          </div>
          <div className="component-item">
            <span className="component-label">ELEMENTS</span>
            <span className="component-value">2048</span>
          </div>
          <div className="component-item">
            <span className="component-label">BEAM WIDTH</span>
            <span className="component-value">1.2° x 1.5°</span>
          </div>
          <div className="component-item">
            <span className="component-label">GAIN</span>
            <span className="component-value">42 dBi</span>
          </div>
        </div>
      </div>

      <div className="component-section signal-processor">
        <h3>SIGNAL PROCESSOR</h3>
        <div className="component-items">
          <div className="component-item">
            <span className="component-label">PROCESSOR TYPE</span>
            <span className="component-value">FPGA + GPU</span>
          </div>
          <div className="component-item">
            <span className="component-label">PROCESSING SPEED</span>
            <span className="component-value">10 GFLOPS</span>
          </div>
          <div className="component-item">
            <span className="component-label">MEMORY</span>
            <span className="component-value">32 GB DDR5</span>
          </div>
          <div className="component-item">
            <span className="component-label">LATENCY</span>
            <span className="component-value">&lt; 10 ms</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RadarComponents
