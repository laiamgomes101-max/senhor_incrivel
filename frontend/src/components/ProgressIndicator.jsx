import { useState, useEffect } from 'react'
import './ProgressIndicator.css'

export default function ProgressIndicator({ 
  userType = 'candidato', 
  data = {}, 
  showDetails = true 
}) {
  const [progress, setProgress] = useState(0)
  const [sections, setSections] = useState([])

  useEffect(() => {
    calculateProgress()
  }, [data, userType])

  const calculateProgress = () => {
    if (userType === 'candidato') {
      const candidateSections = [
        {
          name: 'Informações Básicas',
          icon: '👤',
          items: [
            { label: 'Nome', completed: !!data.nome, weight: 15 },
            { label: 'Headline', completed: !!data.headline, weight: 15 },
            { label: 'Localização', completed: !!data.localizacao, weight: 10 },
            { label: 'Sobre', completed: !!data.sobre, weight: 10 }
          ]
        },
        {
          name: 'Foto de Perfil',
          icon: '📸',
          items: [
            { label: 'Foto profissional', completed: !!data.foto_url, weight: 10 }
          ]
        },
        {
          name: 'Disponibilidade',
          icon: '📅',
          items: [
            { label: 'Status de disponibilidade', completed: !!data.disponibilidade, weight: 10 }
          ]
        },
        {
          name: 'Habilidades',
          icon: '💪',
          items: [
            { label: 'Habilidades técnicas', completed: !!(data.curriculo?.habilidades?.length > 0), weight: 10 }
          ]
        },
        {
          name: 'Experiência',
          icon: '💼',
          items: [
            { label: 'Experiência profissional', completed: !!(data.curriculo?.experiencia?.length > 0), weight: 10 }
          ]
        },
        {
          name: 'Educação',
          icon: '🎓',
          items: [
            { label: 'Formação acadêmica', completed: !!(data.curriculo?.educacao?.length > 0), weight: 10 }
          ]
        },
        {
          name: 'Idiomas',
          icon: '🌍',
          items: [
            { label: 'Idiomas', completed: !!(data.curriculo?.idiomas?.length > 0), weight: 10 }
          ]
        }
      ]

      const totalWeight = candidateSections.reduce(
        (sum, section) => sum + section.items.reduce((s, item) => s + item.weight, 0),
        0
      )
      const completedWeight = candidateSections.reduce(
        (sum, section) => sum + section.items.reduce((s, item) => s + (item.completed ? item.weight : 0), 0),
        0
      )

      const normalizedSections = candidateSections.map((section) => ({
        ...section,
        completed: section.items.every((item) => item.completed)
      }))

      setProgress(Math.round((completedWeight / totalWeight) * 100))
      setSections(normalizedSections)
    } else if (userType === 'empresa') {
      const companySections = [
        {
          name: 'Informações Básicas',
          icon: '🏢',
          items: [
            { label: 'Nome da empresa', completed: !!data.nome, weight: 15 },
            { label: 'Setor de atuação', completed: !!data.setor, weight: 15 },
            { label: 'Localização', completed: !!data.localizacao, weight: 10 },
            { label: 'Logo/Identidade', completed: !!data.logo_url, weight: 10 }
          ]
        },
        {
          name: 'Descrição',
          icon: '📝',
          items: [
            { label: 'Descrição da empresa', completed: !!data.sobre, weight: 15 }
          ]
        },
        {
          name: 'Website',
          icon: '🌐',
          items: [
            { label: 'Site oficial', completed: !!data.site_url, weight: 10 }
          ]
        },
        {
          name: 'Vagas Ativas',
          icon: '📋',
          items: [
            { label: 'Vagas publicadas', completed: !!(data.vagas?.length > 0), weight: 20 }
          ]
        }
      ]

      const totalWeight = companySections.reduce(
        (sum, section) => sum + section.items.reduce((s, item) => s + item.weight, 0),
        0
      )
      const completedWeight = companySections.reduce(
        (sum, section) => sum + section.items.reduce((s, item) => s + (item.completed ? item.weight : 0), 0),
        0
      )

      const normalizedSections = companySections.map((section) => ({
        ...section,
        completed: section.items.every((item) => item.completed)
      }))

      setProgress(Math.round((completedWeight / totalWeight) * 100))
      setSections(normalizedSections)
    }
  }

  const getProgressColor = () => {
    if (progress >= 80) return '#22c55e'
    if (progress >= 60) return '#eab308'
    if (progress >= 40) return '#f97316'
    return '#ef4444'
  }

  const getProgressMessage = () => {
    if (progress >= 80) return 'Excelente! Seu perfil está quase completo.'
    if (progress >= 60) return 'Bom progresso! Continue preenchendo seu perfil.'
    if (progress >= 40) return 'Perfil parcialmente completo. Adicione mais informações.'
    return 'Perfil incompleto. Complete as informações básicas.'
  }

  return (
    <div className="progress-indicator">
      <div className="progress-header">
        <div className="progress-info">
          <h3>Completude do Perfil</h3>
          <p className="progress-message">{getProgressMessage()}</p>
        </div>
        <div className="progress-circle">
          <div 
            className="progress-fill"
            style={{ 
              background: `conic-gradient(${getProgressColor()} ${progress * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
              transform: `rotate(-90deg)`
            }}
          >
            <div className="progress-center">
              <span className="progress-percentage">{progress}%</span>
            </div>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="progress-details">
          <h4>Detalhes por Seção</h4>
          <div className="sections-grid">
            {sections.map((section, index) => (
              <div 
                key={index}
                className={`section-item ${section.completed ? 'completed' : 'incomplete'}`}
              >
                <div className="section-header">
                  <span className="section-icon">{section.icon}</span>
                  <div className="section-info">
                    <h5>{section.name}</h5>
                    <span className="section-weight">{section.weight}%</span>
                  </div>
                  <div className={`section-status ${section.completed ? 'completed' : 'incomplete'}`}>
                    {section.completed ? '✓' : '○'}
                  </div>
                </div>
                
                <div className="section-items">
                  {section.items.map((item, itemIndex) => (
                    <div 
                      key={itemIndex}
                      className={`item ${item.completed ? 'completed' : 'incomplete'}`}
                    >
                      <span className="item-status">
                        {item.completed ? '✓' : '○'}
                      </span>
                      <span className="item-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
