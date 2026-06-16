import { useState, useRef, useEffect } from 'react'
import './Tooltip.css'

export default function Tooltip({ 
  children, 
  content, 
  position = 'top',
  delay = 500,
  interactive = false 
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState(null)
  const tooltipRef = useRef(null)

  const showTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId)
    setTimeoutId(setTimeout(() => setIsVisible(true), delay))
  }

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId)
    setTimeoutId(setTimeout(() => setIsVisible(false), 100))
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsVisible(false)
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isVisible, timeoutId])

  return (
    <div 
      className="tooltip-container"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      
      {isVisible && (
        <div 
          ref={tooltipRef}
          className={`tooltip tooltip-${position} ${interactive ? 'interactive' : ''}`}
        >
          <div className="tooltip-content">
            <div className="tooltip-header">
              <span className="tooltip-icon">💡</span>
              <span className="tooltip-title">Dica</span>
            </div>
            <div className="tooltip-body">
              {content}
            </div>
            {interactive && (
              <div className="tooltip-footer">
                <button 
                  className="tooltip-close"
                  onClick={() => setIsVisible(false)}
                >
                  Entendido
                </button>
              </div>
            )}
          </div>
          <div className="tooltip-arrow"></div>
        </div>
      )}
    </div>
  )
}
