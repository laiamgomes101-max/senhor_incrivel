import { useState, useEffect } from 'react'
import './Analytics.css'

export default function Analytics({ userType = 'candidato', data = {} }) {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadAnalyticsData()
  }, [userType, selectedPeriod])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // Simular carregamento de dados analytics
      const mockData = userType === 'candidato' 
        ? generateCandidateAnalytics() 
        : generateCompanyAnalytics()
      
      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCandidateAnalytics = () => {
    return {
      overview: {
        profileViews: 245,
        profileCompletion: 78,
        applicationsSent: 18,
        interviewsScheduled: 4,
        responseRate: 67,
        avgMatchScore: 72
      },
      applications: {
        total: 18,
        byStatus: {
          pending: 8,
          viewed: 6,
          interviewing: 3,
          rejected: 1
        },
        byType: {
          permanente: 10,
          termo_certo: 6,
          termo_incerto: 4,
          prestacao_de_servicos: 3,
          estagio: 2
        },
        byLocation: {
          'São Paulo': 8,
          'Rio de Janeiro': 4,
          'Remoto': 6
        },
        timeline: [
          { date: '2024-01-01', applications: 2 },
          { date: '2024-01-05', applications: 3 },
          { date: '2024-01-10', applications: 1 },
          { date: '2024-01-15', applications: 4 },
          { date: '2024-01-20', applications: 3 },
          { date: '2024-01-25', applications: 5 }
        ]
      },
      skills: {
        topSkills: [
          { skill: 'React', demand: 85, match: 90 },
          { skill: 'Node.js', demand: 78, match: 75 },
          { skill: 'TypeScript', demand: 72, match: 80 },
          { skill: 'Python', demand: 65, match: 60 },
          { skill: 'AWS', demand: 58, match: 45 }
        ],
        missingSkills: [
          'Docker', 'Kubernetes', 'GraphQL', 'MongoDB', 'Redis'
        ]
      },
      market: {
        avgSalary: 8500,
        marketPosition: 65,
        competitionLevel: 'medium',
        trendingSkills: ['React', 'TypeScript', 'AWS', 'Docker'],
        salaryRange: {
          entry: 4000,
          mid: 8000,
          senior: 15000
        }
      }
    }
  }

  const generateCompanyAnalytics = () => {
    return {
      overview: {
        activeJobs: 12,
        totalApplications: 156,
        avgTimeToHire: 18,
        costPerHire: 3500,
        sourceEffectiveness: {
          linkedin: 35,
          platform: 40,
          referral: 25
        },
        diversityScore: 72
      },
      pipeline: {
        byStage: {
          received: 156,
          screening: 89,
          interviewing: 34,
          offer: 8,
          hired: 4
        },
        conversionRates: {
          screeningToInterview: 38,
          interviewToOffer: 24,
          offerToHire: 50
        },
        avgTimePerStage: {
          screening: 3,
          interviewing: 7,
          offer: 2
        }
      },
      jobs: {
        performance: [
          { title: 'Frontend Developer', applications: 45, hired: 2, timeToHire: 15 },
          { title: 'Backend Developer', applications: 38, hired: 1, timeToHire: 22 },
          { title: 'Full Stack Developer', applications: 67, hired: 1, timeToHire: 18 }
        ],
        byDepartment: {
          'Engineering': 8,
          'Design': 2,
          'Marketing': 2
        }
      },
      candidates: {
        quality: {
          excellent: 15,
          good: 45,
          average: 78,
          poor: 18
        },
        sources: {
          platform: 62,
          linkedin: 54,
          referral: 28,
          direct: 12
        },
        diversity: {
          gender: { male: 65, female: 35 },
          age: { '20-30': 45, '31-40': 78, '41+': 33 }
        }
      }
    }
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('pt-BR').format(num)
  }

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num)
  }

  const getPercentageColor = (value) => {
    if (value >= 80) return '#22c55e'
    if (value >= 60) return '#eab308'
    if (value >= 40) return '#f97316'
    return '#ef4444'
  }

  if (loading) {
    return (
      <div className="analytics loading">
        <div className="loading-spinner"></div>
        <h3>Carregando analytics...</h3>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="analytics empty">
        <div className="empty-icon">📊</div>
        <h3>Dados não disponíveis</h3>
        <p>Tente novamente mais tarde</p>
      </div>
    )
  }

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h2>📊 Analytics - {userType === 'candidato' ? 'Candidato' : 'Empresa'}</h2>
        <div className="period-selector">
          <label>Período:</label>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="1y">Último ano</option>
          </select>
        </div>
      </div>

      <div className="analytics-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Visão Geral
        </button>
        {userType === 'candidato' && (
          <>
            <button 
              className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
              onClick={() => setActiveTab('applications')}
            >
              📋 Candidaturas
            </button>
            <button 
              className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
              onClick={() => setActiveTab('skills')}
            >
              💪 Habilidades
            </button>
            <button 
              className={`tab-btn ${activeTab === 'market' ? 'active' : ''}`}
              onClick={() => setActiveTab('market')}
            >
              🏪 Mercado
            </button>
          </>
        )}
        {userType === 'empresa' && (
          <>
            <button 
              className={`tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('pipeline')}
            >
              🔄 Pipeline
            </button>
            <button 
              className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('jobs')}
            >
              💼 Vagas
            </button>
            <button 
              className={`tab-btn ${activeTab === 'candidates' ? 'active' : ''}`}
              onClick={() => setActiveTab('candidates')}
            >
              👥 Candidatos
            </button>
          </>
        )}
      </div>

      {activeTab === 'overview' && (
        <div className="overview-content">
          <div className="metrics-grid">
            {userType === 'candidato' ? (
              <>
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-icon">👁️</span>
                    <span className="metric-title">Visualizações</span>
                  </div>
                  <div className="metric-value">{formatNumber(analyticsData.overview.profileViews)}</div>
                  <div className="metric-change positive">+12% este mês</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-icon">📊</span>
                    <span className="metric-title">Completude do Perfil</span>
                  </div>
                  <div className="metric-value">{analyticsData.overview.profileCompletion}%</div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${analyticsData.overview.profileCompletion}%`,
                        backgroundColor: getPercentageColor(analyticsData.overview.profileCompletion)
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-icon">📤</span>
                    <span className="metric-title">Candidaturas</span>
                  </div>
                  <div className="metric-value">{analyticsData.overview.applicationsSent}</div>
                  <div className="metric-change positive">+25% este mês</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-icon">🎯</span>
                    <span className="metric-title">Taxa de Resposta</span>
                  </div>
                  <div className="metric-value">{analyticsData.overview.responseRate}%</div>
                  <div className="metric-change negative">-5% este mês</div>
                </div>
              </>
            ) : (
              <>
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-icon">💼</span>
                    <span className="metric-title">Vagas Ativas</span>
                  </div>
                  <div className="metric-value">{analyticsData.overview.activeJobs}</div>
                  <div className="metric-change positive">+2 este mês</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-icon">📨</span>
                    <span className="metric-title">Candidaturas</span>
                  </div>
                  <div className="metric-value">{formatNumber(analyticsData.overview.totalApplications)}</div>
                  <div className="metric-change positive">+18% este mês</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-icon">⏱️</span>
                    <span className="metric-title">Tempo Médio de Contratação</span>
                  </div>
                  <div className="metric-value">{analyticsData.overview.avgTimeToHire} dias</div>
                  <div className="metric-change positive">-3 dias este mês</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-icon">💰</span>
                    <span className="metric-title">Custo por Contratação</span>
                  </div>
                  <div className="metric-value">{formatCurrency(analyticsData.overview.costPerHire)}</div>
                  <div className="metric-change negative">+8% este mês</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'applications' && userType === 'candidato' && (
        <div className="applications-content">
          <div className="applications-stats">
            <div className="stats-grid">
              <div className="stat-item">
                <h4>Total de Candidaturas</h4>
                <div className="stat-value">{analyticsData.applications.total}</div>
              </div>
              <div className="stat-item">
                <h4>Taxa de Sucesso</h4>
                <div className="stat-value">
                  {Math.round((analyticsData.applications.byStatus.interviewing / analyticsData.applications.total) * 100)}%
                </div>
              </div>
            </div>
          </div>

          <div className="status-breakdown">
            <h4>Status das Candidaturas</h4>
            <div className="status-bars">
              {Object.entries(analyticsData.applications.byStatus).map(([status, count]) => (
                <div key={status} className="status-item">
                  <div className="status-info">
                    <span className="status-label">{getStatusLabel(status)}</span>
                    <span className="status-count">{count}</span>
                  </div>
                  <div className="status-bar">
                    <div 
                      className="status-fill"
                      style={{ 
                        width: `${(count / analyticsData.applications.total) * 100}%`,
                        backgroundColor: getStatusColor(status)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="applications-timeline">
            <h4>Candidaturas ao Longo do Tempo</h4>
            <div className="timeline-chart">
              {analyticsData.applications.timeline.map((item, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-date">
                    {new Date(item.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="timeline-bar">
                    <div 
                      className="timeline-fill"
                      style={{ height: `${(item.applications / 5) * 100}%` }}
                    ></div>
                  </div>
                  <div className="timeline-value">{item.applications}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'skills' && userType === 'candidato' && (
        <div className="skills-content">
          <div className="skills-analysis">
            <h4>Análise de Habilidades</h4>
            <div className="skills-grid">
              {analyticsData.skills.topSkills.map((skill, index) => (
                <div key={index} className="skill-card">
                  <div className="skill-header">
                    <h5>{skill.skill}</h5>
                    <div className="skill-scores">
                      <div className="score-item">
                        <span className="score-label">Demanda</span>
                        <div className="score-bar">
                          <div 
                            className="score-fill demand"
                            style={{ width: `${skill.demand}%` }}
                          ></div>
                        </div>
                        <span className="score-value">{skill.demand}%</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">Match</span>
                        <div className="score-bar">
                          <div 
                            className="score-fill match"
                            style={{ width: `${skill.match}%` }}
                          ></div>
                        </div>
                        <span className="score-value">{skill.match}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="missing-skills">
            <h4>Habilidades em Alta que Você Não Tem</h4>
            <div className="missing-skills-grid">
              {analyticsData.skills.missingSkills.map((skill, index) => (
                <div key={index} className="missing-skill">
                  <span className="skill-name">{skill}</span>
                  <button className="add-skill-btn">Adicionar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'market' && userType === 'candidato' && (
        <div className="market-content">
          <div className="market-overview">
            <div className="market-stats">
              <div className="market-stat">
                <h4>Salário Médio do Mercado</h4>
                <div className="stat-value">{formatCurrency(analyticsData.market.avgSalary)}</div>
                <div className="market-position">
                  <span>Sua posição: </span>
                  <span className="position-value">{analyticsData.market.marketPosition}%</span>
                </div>
              </div>
              
              <div className="salary-range">
                <h4>Range Salarial</h4>
                <div className="range-bars">
                  <div className="range-item">
                    <span>Júnior</span>
                    <div className="range-bar">
                      <div className="range-fill junior"></div>
                    </div>
                    <span>{formatCurrency(analyticsData.market.salaryRange.entry)}</span>
                  </div>
                  <div className="range-item">
                    <span>Pleno</span>
                    <div className="range-bar">
                      <div className="range-fill mid"></div>
                    </div>
                    <span>{formatCurrency(analyticsData.market.salaryRange.mid)}</span>
                  </div>
                  <div className="range-item">
                    <span>Sênior</span>
                    <div className="range-bar">
                      <div className="range-fill senior"></div>
                    </div>
                    <span>{formatCurrency(analyticsData.market.salaryRange.senior)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="trending-skills">
            <h4>Habilidades em Alta</h4>
            <div className="trending-list">
              {analyticsData.market.trendingSkills.map((skill, index) => (
                <div key={index} className="trending-skill">
                  <span className="skill-rank">#{index + 1}</span>
                  <span className="skill-name">{skill}</span>
                  <span className="skill-demand">Alta demanda</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pipeline' && userType === 'empresa' && (
        <div className="pipeline-content">
          <div className="pipeline-overview">
            <h4>Visão Geral do Pipeline</h4>
            <div className="pipeline-stages">
              {Object.entries(analyticsData.pipeline.byStage).map(([stage, count]) => (
                <div key={stage} className="pipeline-stage">
                  <div className="stage-header">
                    <h5>{getStageLabel(stage)}</h5>
                    <span className="stage-count">{count}</span>
                  </div>
                  <div className="stage-bar">
                    <div 
                      className="stage-fill"
                      style={{ 
                        width: `${(count / analyticsData.pipeline.byStage.received) * 100}%`,
                        backgroundColor: getStageColor(stage)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="conversion-rates">
            <h4>Taxas de Conversão</h4>
            <div className="conversion-grid">
              {Object.entries(analyticsData.pipeline.conversionRates).map(([rate, value]) => (
                <div key={rate} className="conversion-item">
                  <span className="conversion-label">{getConversionLabel(rate)}</span>
                  <div className="conversion-bar">
                    <div 
                      className="conversion-fill"
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                  <span className="conversion-value">{value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'jobs' && userType === 'empresa' && (
        <div className="jobs-content">
          <div className="jobs-performance">
            <h4>Performance das Vagas</h4>
            <div className="jobs-table">
              <div className="table-header">
                <span>Vaga</span>
                <span>Candidaturas</span>
                <span>Contratados</span>
                <span>Tempo Médio</span>
              </div>
              {analyticsData.jobs.performance.map((job, index) => (
                <div key={index} className="table-row">
                  <span className="job-title">{job.title}</span>
                  <span>{job.applications}</span>
                  <span>{job.hired}</span>
                  <span>{job.timeToHire} dias</span>
                </div>
              ))}
            </div>
          </div>

          <div className="jobs-by-department">
            <h4>Vagas por Departamento</h4>
            <div className="dept-chart">
              {Object.entries(analyticsData.jobs.byDepartment).map(([dept, count]) => (
                <div key={dept} className="dept-item">
                  <span className="dept-name">{dept}</span>
                  <div className="dept-bar">
                    <div 
                      className="dept-fill"
                      style={{ width: `${(count / 12) * 100}%` }}
                    ></div>
                  </div>
                  <span className="dept-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'candidates' && userType === 'empresa' && (
        <div className="candidates-content">
          <div className="candidates-quality">
            <h4>Qualidade dos Candidatos</h4>
            <div className="quality-chart">
              {Object.entries(analyticsData.candidates.quality).map(([quality, count]) => (
                <div key={quality} className="quality-item">
                  <span className="quality-label">{getQualityLabel(quality)}</span>
                  <div className="quality-bar">
                    <div 
                      className="quality-fill"
                      style={{ 
                        width: `${(count / Object.values(analyticsData.candidates.quality).reduce((a, b) => a + b, 0)) * 100}%`,
                        backgroundColor: getQualityColor(quality)
                      }}
                    ></div>
                  </div>
                  <span className="quality-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="candidates-sources">
            <h4>Fontes de Candidatos</h4>
            <div className="sources-chart">
              {Object.entries(analyticsData.candidates.sources).map(([source, count]) => (
                <div key={source} className="source-item">
                  <span className="source-label">{getSourceLabel(source)}</span>
                  <div className="source-bar">
                    <div 
                      className="source-fill"
                      style={{ width: `${(count / Object.values(analyticsData.candidates.sources).reduce((a, b) => a + b, 0)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="source-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions
function getStatusLabel(status) {
  const labels = {
    pending: 'Pendente',
    viewed: 'Visualizado',
    interviewing: 'Entrevistando',
    rejected: 'Rejeitado'
  }
  return labels[status] || status
}

function getStatusColor(status) {
  const colors = {
    pending: '#f97316',
    viewed: '#3b82f6',
    interviewing: '#22c55e',
    rejected: '#ef4444'
  }
  return colors[status] || '#6b7280'
}

function getStageLabel(stage) {
  const labels = {
    received: 'Recebidas',
    screening: 'Triagem',
    interviewing: 'Entrevista',
    offer: 'Oferta',
    hired: 'Contratados'
  }
  return labels[stage] || stage
}

function getStageColor(stage) {
  const colors = {
    received: '#3b82f6',
    screening: '#f97316',
    interviewing: '#eab308',
    offer: '#22c55e',
    hired: '#22c55e'
  }
  return colors[stage] || '#6b7280'
}

function getConversionLabel(rate) {
  const labels = {
    screeningToInterview: 'Triagem → Entrevista',
    interviewToOffer: 'Entrevista → Oferta',
    offerToHire: 'Oferta → Contratação'
  }
  return labels[rate] || rate
}

function getQualityLabel(quality) {
  const labels = {
    excellent: 'Excelente',
    good: 'Bom',
    average: 'Médio',
    poor: 'Fraco'
  }
  return labels[quality] || quality
}

function getQualityColor(quality) {
  const colors = {
    excellent: '#22c55e',
    good: '#3b82f6',
    average: '#f97316',
    poor: '#ef4444'
  }
  return colors[quality] || '#6b7280'
}

function getSourceLabel(source) {
  const labels = {
    platform: 'Plataforma',
    linkedin: 'LinkedIn',
    referral: 'Indicação',
    direct: 'Direto'
  }
  return labels[source] || source
}
