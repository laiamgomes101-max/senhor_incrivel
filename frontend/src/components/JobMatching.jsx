import { useState, useEffect } from 'react'
import flaskClient from '../api/flaskClient'
import './JobMatching.css'

export default function JobMatching({ candidateProfile, onJobSelect }) {
  const [matchingJobs, setMatchingJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    salary_min: '',
    salary_max: '',
    location: '',
    type: 'all',
    remote: 'all'
  })
  const [sortBy, setSortBy] = useState('match_score')
  const [selectedJob, setSelectedJob] = useState(null)

  useEffect(() => {
    if (candidateProfile) {
      findMatchingJobs()
    }
  }, [candidateProfile])

  const findMatchingJobs = async () => {
    setLoading(true)
    try {
      const response = await flaskClient.post('/api/jobs/match', {
        candidate: candidateProfile,
        filters: filters
      })
      
      setMatchingJobs(response.data.jobs || [])
    } catch (error) {
      console.error('Erro ao buscar vagas compatíveis:', error)
      // Fallback com dados mock
      generateMockJobs()
    } finally {
      setLoading(false)
    }
  }

  const generateMockJobs = () => {
    const mockJobs = [
      {
        id: 1,
        title: 'Desenvolvedor Full Stack Senior',
        company: 'Tech Solutions Ltda',
        location: 'Luanda, AO',
        remote: 'hybrid',
        type: 'permanente',
        salary_min: 800000,
        salary_max: 1200000,
        match_score: 92,
        match_reasons: [
          'Experiência em React e Node.js',
          'Formação em Ciência da Computação',
          '5+ anos de experiência relevante'
        ],
        skills_required: ['React', 'Node.js', 'TypeScript', 'AWS'],
        skills_match: ['React', 'Node.js', 'TypeScript'],
        description: 'Buscamos um desenvolvedor full stack para liderar projetos inovadores...',
        posted_date: '2024-01-15',
        applicants_count: 45,
        benefits: ['Plano de saúde', 'Vale-refeição', 'Home office', 'Bonus anual']
      },
      {
        id: 2,
        title: 'Frontend Developer Pleno',
        company: 'Digital Agency',
        location: 'Luanda, AO',
        remote: 'remote',
        type: 'prestacao_de_servicos',
        salary_min: 600000,
        salary_max: 800000,
        match_score: 85,
        match_reasons: [
          'Forte experiência em frontend',
          'Conhecimento em React',
          'Portfólio relevante'
        ],
        skills_required: ['React', 'Vue.js', 'CSS/SASS', 'JavaScript'],
        skills_match: ['React', 'JavaScript'],
        description: 'Agência digital buscando talentoso frontend developer...',
        posted_date: '2024-01-18',
        applicants_count: 23,
        benefits: ['Flexibilidade de horário', 'Home office', 'Plano de carreira']
      },
      {
        id: 3,
        title: 'Software Engineer Backend',
        company: 'Fintech Innovation',
        location: 'Luanda, AO',
        remote: 'office',
        type: 'permanente',
        salary_min: 700000,
        salary_max: 1000000,
        match_score: 78,
        match_reasons: [
          'Experiência com Node.js',
          'Conhecimento em bancos de dados',
          'Background em sistemas financeiros'
        ],
        skills_required: ['Node.js', 'Python', 'PostgreSQL', 'Docker'],
        skills_match: ['Node.js'],
        description: 'Fintech em expansão buscando backend developer...',
        posted_date: '2024-01-20',
        applicants_count: 67,
        benefits: ['Participação nos lucros', 'Seguro vida', 'Gympass', 'Home office']
      }
    ]
    
    setMatchingJobs(mockJobs)
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const applyFilters = () => {
    findMatchingJobs()
  }

  const clearFilters = () => {
    setFilters({
      salary_min: '',
      salary_max: '',
      location: '',
      type: 'all',
      remote: 'all'
    })
    findMatchingJobs()
  }

  const sortedJobs = [...matchingJobs].sort((a, b) => {
    switch (sortBy) {
      case 'match_score':
        return b.match_score - a.match_score
      case 'salary':
        return (b.salary_max || 0) - (a.salary_max || 0)
      case 'recent':
        return new Date(b.posted_date) - new Date(a.posted_date)
      case 'applicants':
        return a.applicants_count - b.applicants_count
      default:
        return 0
    }
  })

  const getMatchColor = (score) => {
    if (score >= 90) return '#22c55e'
    if (score >= 75) return '#eab308'
    if (score >= 60) return '#f97316'
    return '#ef4444'
  }

  const getMatchLabel = (score) => {
    if (score >= 90) return 'Excelente Match'
    if (score >= 75) return 'Bom Match'
    if (score >= 60) return 'Match Moderado'
    return 'Baixo Match'
  }

  const formatSalary = (min, max) => {
    if (!min && !max) return 'A combinar'
    if (!max) return `A partir de Kz ${min.toLocaleString()}`
    if (!min) return `Até Kz ${max.toLocaleString()}`
    return `Kz ${min.toLocaleString()} - ${max.toLocaleString()}`
  }

  const handleJobClick = (job) => {
    setSelectedJob(job)
    if (onJobSelect) {
      onJobSelect(job)
    }
  }

  const handleApply = (job) => {
    // Lógica para se candidatar à vaga
    console.log('Aplicando para vaga:', job.id)
  }

  if (loading) {
    return (
      <div className="job-matching loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h3>Encontrando vagas compatíveis...</h3>
          <p>Analisando seu perfil com milhares de oportunidades</p>
        </div>
      </div>
    )
  }

  return (
    <div className="job-matching">
      <div className="matching-header">
        <div className="header-content">
          <h2>💼 Vagas Recomendadas para Você</h2>
          <p>Baseado no seu perfil, encontramos {matchingJobs.length} vagas compatíveis</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{matchingJobs.length}</span>
            <span className="stat-label">Vagas</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {matchingJobs.filter(j => j.match_score >= 80).length}
            </span>
            <span className="stat-label">Excelentes</span>
          </div>
        </div>
      </div>

      <div className="matching-filters">
        <h3>Filtros</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Salário Mínimo</label>
            <input
              type="number"
              placeholder="R$ 0"
              value={filters.salary_min}
              onChange={(e) => handleFilterChange('salary_min', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Salário Máximo</label>
            <input
              type="number"
              placeholder="R$ 20000"
              value={filters.salary_max}
              onChange={(e) => handleFilterChange('salary_max', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Localização</label>
            <input
              type="text"
              placeholder="Luanda, AO"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Tipo de Contrato</label>
            <select 
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="permanente">Permanente</option>
              <option value="termo_certo">Termo Certo</option>
              <option value="termo_incerto">Termo Incerto</option>
              <option value="prestacao_de_servicos">Prestação de Serviços</option>
              <option value="estagio">Estágio</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Modalidade</label>
            <select 
              value={filters.remote}
              onChange={(e) => handleFilterChange('remote', e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="remote">Remoto</option>
              <option value="hybrid">Híbrido</option>
              <option value="office">Presencial</option>
            </select>
          </div>
        </div>
        
        <div className="filter-actions">
          <button className="apply-filters-btn" onClick={applyFilters}>
            🔍 Aplicar Filtros
          </button>
          <button className="clear-filters-btn" onClick={clearFilters}>
            🔄 Limpar
          </button>
        </div>
      </div>

      <div className="matching-controls">
        <div className="sort-control">
          <label>Ordenar por:</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="match_score">Melhor Match</option>
            <option value="salary">Maior Salário</option>
            <option value="recent">Mais Recentes</option>
            <option value="applicants">Menos Concorrência</option>
          </select>
        </div>
        
        <div className="view-toggle">
          <button className={`view-btn ${true ? 'active' : ''}`}>
            📋 Lista
          </button>
          <button className={`view-btn ${false ? 'active' : ''}`}>
            🗂️ Cards
          </button>
        </div>
      </div>

      <div className="jobs-list">
        {sortedJobs.length === 0 ? (
          <div className="no-jobs">
            <div className="no-jobs-icon">🔍</div>
            <h3>Nenhuma vaga encontrada</h3>
            <p>Tente ajustar os filtros ou complete mais informações no seu perfil</p>
          </div>
        ) : (
          sortedJobs.map((job) => (
            <div key={job.id} className="job-card" onClick={() => handleJobClick(job)}>
              <div className="job-header">
                <div className="job-title-section">
                  <h3>{job.title}</h3>
                  <div className="company-info">
                    <span className="company-name">{job.company}</span>
                    <span className="location">📍 {job.location}</span>
                  </div>
                </div>
                
                <div className="match-score">
                  <div 
                    className="score-circle"
                    style={{ borderColor: getMatchColor(job.match_score) }}
                  >
                    <span 
                      className="score-number"
                      style={{ color: getMatchColor(job.match_score) }}
                    >
                      {job.match_score}%
                    </span>
                  </div>
                  <span className="match-label">{getMatchLabel(job.match_score)}</span>
                </div>
              </div>

              <div className="job-details">
                <div className="job-meta">
                  <span className="salary">💰 {formatSalary(job.salary_min, job.salary_max)}</span>
                  <span className="type">{job.type.toUpperCase()}</span>
                  <span className="remote">
                    {job.remote === 'remote' ? '🏠 Remoto' : 
                     job.remote === 'hybrid' ? '🏢 Híbrido' : '🏢 Presencial'}
                  </span>
                </div>
                
                <div className="job-description">
                  <p>{job.description.substring(0, 150)}...</p>
                </div>
                
                <div className="skills-section">
                  <h4>Habilidades Requeridas:</h4>
                  <div className="skills-list">
                    {job.skills_required.map((skill, index) => (
                      <span 
                        key={index}
                        className={`skill-tag ${
                          job.skills_match.includes(skill) ? 'matched' : 'missing'
                        }`}
                      >
                        {skill}
                        {job.skills_match.includes(skill) && ' ✓'}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="match-reasons">
                  <h4>🎯 Por que esta vaga combina com você:</h4>
                  <ul>
                    {job.match_reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="job-footer">
                  <div className="job-stats">
                    <span className="posted-date">
                      📅 {new Date(job.posted_date).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="applicants">
                      👥 {job.applicants_count} candidatos
                    </span>
                  </div>
                  
                  <div className="job-actions">
                    <button className="details-btn">
                      📋 Ver Detalhes
                    </button>
                    <button 
                      className="apply-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApply(job)
                      }}
                    >
                      🚀 Me Candidatar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedJob && (
        <div className="job-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedJob.title}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedJob(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {/* Conteúdo detalhado da vaga */}
              <div className="job-full-details">
                <div className="company-header">
                  <h4>{selectedJob.company}</h4>
                  <p>{selectedJob.location}</p>
                </div>
                
                <div className="job-requirements">
                  <h5>Requisitos</h5>
                  <ul>
                    {selectedJob.skills_required.map((skill, index) => (
                      <li key={index}>{skill}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="job-benefits">
                  <h5>Benefícios</h5>
                  <div className="benefits-list">
                    {selectedJob.benefits.map((benefit, index) => (
                      <span key={index} className="benefit-tag">{benefit}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="apply-modal-btn">
                🚀 Me Candidatar Agora
              </button>
              <button className="save-btn">
                💾 Salvar Vaga
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
