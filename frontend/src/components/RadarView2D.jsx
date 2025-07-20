import { useState, useEffect, useRef } from 'react'
import { radarAPI } from '../services/api'
import './RadarView2D.css'

const RadarView2D = ({ radarData, isConnected, recentData = [] }) => {
  const canvasRef = useRef(null)
  const [allData, setAllData] = useState([])

  // Fetch all radar data for statistics
  const fetchAllData = async () => {
    try {
      const response = await radarAPI.getAll(1, 100) // Get more data for better statistics
      if (response.data) {
        setAllData(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch all radar data:', err)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const centerX = canvas.width / 2
    const centerY = canvas.height - 20
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.4

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set styles
    ctx.strokeStyle = '#00ff41'
    ctx.fillStyle = '#00ff41'
    ctx.font = '12px Orbitron, monospace'

    // Draw concentric circles
    for (let i = 1; i <= 5; i++) {
      const radius = (maxRadius / 5) * i
      ctx.globalAlpha = 0.3
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, Math.PI, 0)
      ctx.stroke()

      // Distance labels
      ctx.globalAlpha = 0.6
      ctx.fillText(`${(i * 20).toFixed(0)}cm`, centerX - 15, centerY - radius - 5)
    }

    // Draw angle lines
    for (let i = 0; i <= 6; i++) {
      const angle = (i / 6) * Math.PI
      const x = centerX + Math.cos(angle) * maxRadius
      const y = centerY - Math.sin(angle) * maxRadius
      
      ctx.globalAlpha = 0.2
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.stroke()

      // Angle labels
      const labelX = centerX + Math.cos(angle) * (maxRadius + 20)
      const labelY = centerY - Math.sin(angle) * (maxRadius + 20)
      ctx.globalAlpha = 0.8
      ctx.fillText(`${(180 - i * 30)}°`, labelX - 10, labelY + 5)
    }

    // Draw recent data points (faded)
    recentData.forEach((data, index) => {
      const angle = ((180 - data.angle) * Math.PI) / 180
      const distance = (data.distance / 100) * maxRadius
      const x = centerX + Math.cos(angle) * distance
      const y = centerY - Math.sin(angle) * distance

      ctx.globalAlpha = 0.3 + (index / recentData.length) * 0.4
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Draw current target (bright)
    if (radarData) {
      const angle = ((180 - radarData.angle) * Math.PI) / 180
      const distance = (radarData.distance / 100) * maxRadius
      const x = centerX + Math.cos(angle) * distance
      const y = centerY - Math.sin(angle) * distance

      // Target dot
      ctx.globalAlpha = 1
      ctx.fillStyle = '#ff0080'
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, 2 * Math.PI)
      ctx.fill()

      // Sweep line
      ctx.strokeStyle = '#ff0080'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.stroke()

      // Target info
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px Orbitron, monospace'
      ctx.fillText(`${radarData.distance.toFixed(1)}cm`, x + 10, y - 10)
    }

    // Center dot
    ctx.globalAlpha = 1
    ctx.fillStyle = '#00ff41'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI)
    ctx.fill()

  }, [radarData, recentData, allData])

  return (
    <div className="radar-view-2d">
      <canvas
        ref={canvasRef}
        width={400}
        height={250}
        className="radar-canvas-2d"
      />
      <div className="radar-status-2d">
        <div className={`status-indicator-2d ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'LIVE' : 'SIM'}
        </div>
      </div>
    </div>
  )
}

export default RadarView2D
