import './StatusBadge.css'

export default function StatusBadge({ 
  status, 
  size = 'md',
  variant = 'default',
  icon = null,
  className = ''
}) {
  const statusMap = {
    // Aplicação
    'aprovado': { label: 'Aprovado', color: 'success', icon: '✓' },
    'rejeitado': { label: 'Rejeitado', color: 'error', icon: '✕' },
    'em_analise': { label: 'Em Análise', color: 'warning', icon: '⏳' },
    'entrevista': { label: 'Entrevista', color: 'info', icon: '📞' },
    'pendente': { label: 'Pendente', color: 'warning', icon: '⏳' },
    
    // Vaga
    'ativa': { label: 'Ativa', color: 'success', icon: '✓' },
    'fechada': { label: 'Fechada', color: 'error', icon: '✕' },
    'pausa': { label: 'Pausada', color: 'warning', icon: '⏸' },
    
    // Usuário
    'ativo': { label: 'Ativo', color: 'success', icon: '🟢' },
    'inativo': { label: 'Inativo', color: 'error', icon: '🔴' },
    'bloqueado': { label: 'Bloqueado', color: 'error', icon: '🚫' },
  }

  const statusInfo = statusMap[status] || { 
    label: status, 
    color: 'default',
    icon: '◯'
  }

  const displayIcon = icon || statusInfo.icon

  return (
    <span 
      className={`badge badge-${statusInfo.color} badge-${size} badge-${variant} ${className}`}
      title={statusInfo.label}
    >
      <span className="badge-icon">{displayIcon}</span>
      <span className="badge-label">{statusInfo.label}</span>
    </span>
  )
}
