import './Toast.css'
import { useEffect } from 'react'

export default function Toast({ 
  message, 
  type = 'info', 
  onClose, 
  duration = 4000,
  icon = null 
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ⓘ'
  }

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{icon || icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button 
        className="toast-close" 
        onClick={onClose}
        aria-label="Fechar notificação"
      >
        ✕
      </button>
    </div>
  )
}
