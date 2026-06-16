import { useState } from 'react'
import './AvailabilityStatus.css'

const STATUS_OPTIONS = [
  { value: 'disponivel', label: 'Disponível', color: '#22c55e', icon: '·' },
  { value: 'ocupado', label: 'Ocupado', color: '#ef4444', icon: '·' },
  { value: 'open_opportunities', label: 'Aberto a Oportunidades', color: '#3b82f6', icon: '·' },
  { value: 'nao_busca', label: 'Não Buscando', color: '#6b7280', icon: '·' }
]

export default function AvailabilityStatus({ currentStatus, onStatusChange }) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus || 'disponivel')

  const handleStatusChange = (status) => {
    setSelectedStatus(status.value)
    onStatusChange(status.value)
  }

  const currentStatusInfo = STATUS_OPTIONS.find(s => s.value === selectedStatus) || STATUS_OPTIONS[0]

  return (
    <div className="availability-status">
      <div className="status-display">
        <span 
          className="status-indicator" 
          style={{ color: currentStatusInfo.color }}
        >
          {currentStatusInfo.icon}
        </span>
        <span className="status-text">{currentStatusInfo.label}</span>
      </div>
      
      <div className="status-options">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.value}
            type="button"
            className={`status-option ${selectedStatus === status.value ? 'active' : ''}`}
            onClick={() => handleStatusChange(status)}
            style={{
              borderColor: selectedStatus === status.value ? status.color : 'var(--border)',
              backgroundColor: selectedStatus === status.value ? `${status.color}20` : 'var(--bg-secondary)'
            }}
          >
            <span 
              className="status-dot" 
              style={{ backgroundColor: status.color }}
            />
            <span className="status-label">{status.label}</span>
          </button>
        ))}
      </div>
      
      <p className="status-description">
        {selectedStatus === 'disponivel' && 'Você está ativamente buscando oportunidades de trabalho.'}
        {selectedStatus === 'ocupado' && 'Você não está disponível no momento, mas pode receber mensagens.'}
        {selectedStatus === 'open_opportunities' && 'Você está empregado, mas aberto a novas oportunidades.'}
        {selectedStatus === 'nao_busca' && 'Você não está buscando oportunidades ativamente.'}
      </p>
    </div>
  )
}
