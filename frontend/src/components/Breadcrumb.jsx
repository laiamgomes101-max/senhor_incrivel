import { Link, useLocation } from 'react-router-dom'
import './Breadcrumb.css'

export default function Breadcrumb({ items = [] }) {
  if (!items || items.length === 0) return null

  return (
    <nav className="breadcrumb" aria-label="Navegação de localização">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link to="/app" className="breadcrumb-link">
            <span className="breadcrumb-icon">⌂</span>
            Home
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            <span className="breadcrumb-separator">/</span>
            {item.href ? (
              <Link to={item.href} className="breadcrumb-link">
                {item.label}
              </Link>
            ) : (
              <span className="breadcrumb-current">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
