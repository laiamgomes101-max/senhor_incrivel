import { useState, useEffect } from 'react'
import flaskClient from '../api/flaskClient'
import './ResumeAssistant.css'

export default function ResumeAssistant({ candidateData, onAnalysisComplete }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [activeTab, setActiveTab] = useState('analysis')

  useEffect(() => {
    if (candidateData) {
      analyzeResume()
    }
  }, [candidateData])

  const analyzeResume = async () => {
    setIsAnalyzing(true)
    try {
      // Enviar dados do candidato para análise IA
      const response = await flaskClient.post('/api/curriculos/ia/analyze-profile', {
        profile: candidateData
      })
      
      const result = response.data
      setAnalysis(result.analysis)
      setSuggestions(result.suggestions)
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result)
      }
    } catch (error) {
      console.error('Erro ao analisar currículo:', error)
      // Fallback para análise simulada
      generateMockAnalysis()
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateMockAnalysis = () => {
    const mockAnalysis = {
      overall_score: 72,
      strengths: [
        'Experiência relevante em tecnologia',
        'Bom conjunto de habilidades técnicas',
        'Formação acadêmica sólida'
      ],
      weaknesses: [
        'Descrição de experiências muito concisa',
        'Faltam métricas e resultados quantificáveis',
        'Perfil incompleto em algumas seções'
      ],
      sections: {
        personal_info: { score: 85, feedback: 'Informações básicas completas' },
        experience: { score: 65, feedback: 'Adicione mais detalhes e métricas' },
        education: { score: 90, feedback: 'Formação bem documentada' },
        skills: { score: 70, feedback: 'Boas habilidades, mas pode expandir' },
        languages: { score: 60, feedback: 'Adicione mais idiomas se possível' }
      }
    }

    const mockSuggestions = [
      {
        type: 'improvement',
        section: 'experience',
        priority: 'high',
        title: 'Adicione métricas quantificáveis',
        description: 'Em vez de "Melhorei o desempenho", use "Aumentei o desempenho em 35% através de otimizações"',
        example: '• Gerenciei equipe de 5 pessoas\n• Reduzi custos em 20% implementando novas ferramentas\n• Lancei 3 produtos que geraram R$ 2M em receita'
      },
      {
        type: 'keyword',
        section: 'skills',
        priority: 'medium',
        title: 'Adicione habilidades em alta demanda',
        description: 'Baseado nas vagas atuais, estas habilidades são procuradas:',
        keywords: ['React', 'Node.js', 'Python', 'AWS', 'Docker', 'TypeScript']
      },
      {
        type: 'format',
        section: 'personal_info',
        priority: 'low',
        title: 'Melhore sua headline',
        description: 'Sua headline atual é genérica. Torne-a mais específica:',
        example: 'Desenvolvedor Full Stack com 5 anos de experiência em React e Node.js, especializado em aplicações escaláveis'
      }
    ]

    setAnalysis(mockAnalysis)
    setSuggestions(mockSuggestions)
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#eab308'
    if (score >= 40) return '#f97316'
    return '#ef4444'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excelente'
    if (score >= 60) return 'Bom'
    if (score >= 40) return 'Regular'
    return 'Precisa Melhorar'
  }

  const applySuggestion = (suggestion) => {
    // Lógica para aplicar a sugestão ao formulário
    if (onAnalysisComplete) {
      onAnalysisComplete({
        type: 'apply_suggestion',
        suggestion
      })
    }
  }

  if (isAnalyzing) {
    return (
      <div className="resume-assistant loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h3>Analisando seu currículo...</h3>
          <p>Estamos usando IA para identificar oportunidades de melhoria</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="resume-assistant empty">
        <div className="empty-content">
          <div className="empty-icon">🤖</div>
          <h3>Assistente de Currículo IA</h3>
          <p>Complete seu perfil para receber sugestões personalizadas</p>
          <button className="analyze-btn" onClick={analyzeResume}>
            Analisar Perfil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="resume-assistant">
      <div className="assistant-header">
        <div className="header-content">
          <h3>🤖 Assistente de Currículo IA</h3>
          <p>Sugestões personalizadas para otimizar seu perfil</p>
        </div>
        <div className="overall-score">
          <div 
            className="score-circle"
            style={{ borderColor: getScoreColor(analysis.overall_score) }}
          >
            <span 
              className="score-number"
              style={{ color: getScoreColor(analysis.overall_score) }}
            >
              {analysis.overall_score}
            </span>
          </div>
          <span className="score-label">{getScoreLabel(analysis.overall_score)}</span>
        </div>
      </div>

      <div className="assistant-tabs">
        <button 
          className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          📊 Análise
        </button>
        <button 
          className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          💡 Sugestões
        </button>
        <button 
          className={`tab-btn ${activeTab === 'keywords' ? 'active' : ''}`}
          onClick={() => setActiveTab('keywords')}
        >
          🔍 Keywords
        </button>
      </div>

      {activeTab === 'analysis' && (
        <div className="analysis-content">
          <div className="analysis-summary">
            <div className="strengths-weaknesses">
              <div className="strengths">
                <h4>✅ Pontos Fortes</h4>
                <ul>
                  {analysis.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
              
              <div className="weaknesses">
                <h4>⚠️ Pontos a Melhorar</h4>
                <ul>
                  {analysis.weaknesses.map((weakness, index) => (
                    <li key={index}>{weakness}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="sections-analysis">
            <h4>Análise por Seção</h4>
            <div className="sections-grid">
              {Object.entries(analysis.sections).map(([section, data]) => (
                <div key={section} className="section-card">
                  <div className="section-header">
                    <h5>{getSectionLabel(section)}</h5>
                    <div className="section-score">
                      <div 
                        className="score-bar"
                        style={{ 
                          width: `${data.score}%`,
                          backgroundColor: getScoreColor(data.score)
                        }}
                      ></div>
                      <span>{data.score}%</span>
                    </div>
                  </div>
                  <p className="section-feedback">{data.feedback}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="suggestions-content">
          <div className="suggestions-list">
            {suggestions.length === 0 ? (
              <p>Nenhuma sugestão disponível no momento.</p>
            ) : (
              suggestions.map((suggestion, index) => (
                <div key={index} className={`suggestion-card priority-${suggestion.priority}`}>
                  <div className="suggestion-header">
                    <span className={`priority-badge ${suggestion.priority}`}>
                      {suggestion.priority === 'high' ? '🔴 Alta' : 
                       suggestion.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                    </span>
                    <h5>{suggestion.title}</h5>
                  </div>
                  
                  <div className="suggestion-content">
                    <p>{suggestion.description}</p>
                    
                    {suggestion.example && (
                      <div className="suggestion-example">
                        <h6>Exemplo:</h6>
                        <pre>{suggestion.example}</pre>
                      </div>
                    )}
                    
                    {suggestion.keywords && (
                      <div className="keywords-suggestion">
                        <h6>Keywords sugeridas:</h6>
                        <div className="keywords-list">
                          {suggestion.keywords.map((keyword, i) => (
                            <span key={i} className="keyword-tag">{keyword}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="suggestion-actions">
                    <button 
                      className="apply-btn"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      Aplicar Sugestão
                    </button>
                    <button className="dismiss-btn">
                      Ignorar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'keywords' && (
        <div className="keywords-content">
          <div className="keywords-analysis">
            <h4>Keywords em Alta no Mercado</h4>
            <p>Baseado em vagas atuais e tendências do mercado</p>
            
            <div className="keywords-categories">
              <div className="keyword-category">
                <h5>💻 Tecnologias</h5>
                <div className="keywords-grid">
                  {['React', 'Node.js', 'Python', 'TypeScript', 'AWS', 'Docker', 'Kubernetes', 'GraphQL'].map(keyword => (
                    <span key={keyword} className="keyword-item hot">{keyword}</span>
                  ))}
                </div>
              </div>
              
              <div className="keyword-category">
                <h5>📊 Habilidades</h5>
                <div className="keywords-grid">
                  {['Leadership', 'Communication', 'Problem Solving', 'Agile', 'Scrum', 'DevOps', 'CI/CD', 'Microservices'].map(keyword => (
                    <span key={keyword} className="keyword-item medium">{keyword}</span>
                  ))}
                </div>
              </div>
              
              <div className="keyword-category">
                <h5>🏢 Setores</h5>
                <div className="keywords-grid">
                  {['Fintech', 'E-commerce', 'Healthcare', 'Education', 'Gaming', 'Social Media', 'IoT', 'AI/ML'].map(keyword => (
                    <span key={keyword} className="keyword-item emerging">{keyword}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="keywords-tips">
            <h4>💡 Dicas para Keywords</h4>
            <ul>
              <li>Inclua keywords específicas da vaga que você está se candidatando</li>
              <li>Use termos técnicos que demonstrem seu conhecimento prático</li>
              <li>Balanceie keywords técnicas com habilidades interpessoais</li>
              <li>Adapte seu perfil para cada tipo de vaga (front-end, back-end, full-stack)</li>
            </ul>
          </div>
        </div>
      )}

      <div className="assistant-footer">
        <button className="reanalyze-btn" onClick={analyzeResume}>
          🔄 Reanalisar Perfil
        </button>
        <button className="export-btn">
          📥 Exportar Análise
        </button>
      </div>
    </div>
  )
}

function getSectionLabel(section) {
  const labels = {
    personal_info: 'Informações Pessoais',
    experience: 'Experiência',
    education: 'Educação',
    skills: 'Habilidades',
    languages: 'Idiomas'
  }
  return labels[section] || section
}
