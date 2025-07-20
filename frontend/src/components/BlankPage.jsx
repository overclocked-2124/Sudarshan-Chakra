import './BlankPage.css'

const BlankPage = () => {
  return (
    <div className="blank-page">
      <div className="blank-header">
        <h1 className="blank-title">CLASSIFIED OPERATIONS</h1>
        <div className="access-denied">
          <span className="access-text">ACCESS RESTRICTED</span>
          <div className="clearance-level">CLEARANCE LEVEL 6 REQUIRED</div>
        </div>
      </div>
      
      <div className="blank-content">
        <div className="restricted-area">
          <div className="warning-symbol">⚠️</div>
          <h2>UNAUTHORIZED ACCESS DETECTED</h2>
          <p>This section contains classified intelligence data.</p>
          <p>Please contact your commanding officer for access authorization.</p>
          
          <div className="security-notice">
            <div className="notice-item">
              <span className="notice-label">SECURITY PROTOCOL:</span>
              <span className="notice-value">LEVEL OMEGA</span>
            </div>
            <div className="notice-item">
              <span className="notice-label">CLASSIFICATION:</span>
              <span className="notice-value">TOP SECRET//NOFORN</span>
            </div>
            <div className="notice-item">
              <span className="notice-label">MONITORING:</span>
              <span className="notice-value">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlankPage
