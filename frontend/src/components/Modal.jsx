import { useEffect } from 'react'
import './Modal.css'

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer = null,
  size = 'md',
  closeOnEscape = true,
  closeOnBackdropClick = true
}) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, closeOnEscape, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className={`modal modal-${size}`}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button 
            className="modal-close"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
