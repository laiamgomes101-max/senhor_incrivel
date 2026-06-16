import './EmptyState.css'

export default function EmptyState({ 
  icon = '📭',
  title = 'Nada aqui',
  description = 'Não há dados para exibir no momento.',
  action = null,
  image = null
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-content">
        {image ? (
          <img src={image} alt={title} className="empty-state-image" />
        ) : (
          <div className="empty-state-icon">{icon}</div>
        )}
        
        <h3 className="empty-state-title">{title}</h3>
        
        <p className="empty-state-description">{description}</p>

        {action && (
          <div className="empty-state-action">
            {typeof action === 'string' ? (
              <p>{action}</p>
            ) : (
              action
            )}
          </div>
        )}
      </div>
    </div>
  )
}
