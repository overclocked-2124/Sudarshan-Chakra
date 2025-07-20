import { Link, useLocation } from 'react-router-dom'
import { Radar, Shield, Target, Lock } from 'lucide-react'
import './Navbar.css'

const Navbar = () => {
  const location = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Shield className="brand-icon" />
          <span className="brand-text">SUDARSHAN CHAKRA</span>
          <span className="classification">CLASSIFIED</span>
        </div>
        
        <div className="navbar-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <Target className="nav-icon" />
            DASHBOARD
          </Link>
          <Link 
            to="/classified" 
            className={`nav-link ${location.pathname === '/classified' ? 'active' : ''}`}
          >
            <Lock className="nav-icon" />
            CLASSIFIED
          </Link>
        </div>

        <div className="navbar-status">
          <div className="status-indicator online"></div>
          <span className="status-text">SYSTEM ONLINE</span>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
