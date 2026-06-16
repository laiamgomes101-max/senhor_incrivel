import './LoadingSkeleton.css'

export default function LoadingSkeleton({ type = 'card', count = 1 }) {
  if (type === 'card') {
    return (
      <div className="skeleton-wrapper">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-text skeleton-title"></div>
            <div className="skeleton skeleton-text skeleton-subtitle"></div>
            <div className="skeleton skeleton-text" style={{ width: '90%' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'table-row') {
    return (
      <div className="skeleton-table-row">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-cell">
            <div className="skeleton skeleton-text"></div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'profile') {
    return (
      <div className="skeleton-profile">
        <div className="skeleton skeleton-avatar"></div>
        <div className="skeleton skeleton-text skeleton-title"></div>
        <div className="skeleton skeleton-text skeleton-subtitle"></div>
        <div className="skeleton skeleton-text" style={{ width: '70%' }}></div>
      </div>
    )
  }

  if (type === 'image') {
    return <div className="skeleton skeleton-image"></div>
  }

  return null
}
