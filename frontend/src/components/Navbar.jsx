import { Link, useLocation } from 'react-router-dom'
import { Radar, Shield, Target, Lock, Menu, X } from 'lucide-react'
import { useState } from 'react'
import './Navbar.css'

const Navbar = () => {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Shield className="brand-icon" />
          <span className="brand-text">SUDARSHAN CHAKRA</span>
          <span className="classification">CLASSIFIED</span>
        </div>
        
        <button className="mobile-menu-toggle" onClick={toggleMenu}>
          {isMenuOpen ? <X className="menu-icon" /> : <Menu className="menu-icon" />}
        </button>

        <div className={`navbar-links ${isMenuOpen ? 'mobile-open' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <Target className="nav-icon" />
            DASHBOARD
          </Link>
          <Link 
            to="/classified" 
            className={`nav-link ${location.pathname === '/classified' ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
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
