import { useState, useEffect, useMemo } from 'react'
import './FAQ.css'

const faqData = {
  candidato: [
    {
      id: 1,
      category: 'Perfil',
      question: 'Como completo meu perfil de candidato?',
      answer: 'Preencha todas as seções: informações básicas, foto de perfil, habilidades, experiência, educação e idiomas. Use o indicador de progresso para ver o que falta.',
      tags: ['perfil', 'completar', 'informações'],
      priority: 'high'
    },
    {
      id: 2,
      category: 'Currículo',
      question: 'Como faço upload do meu currículo?',
      answer: 'Vá para a página Upload CV, selecione o arquivo PDF ou DOCX e clique em enviar. O sistema analisará automaticamente suas habilidades e experiência.',
      tags: ['currículo', 'upload', 'arquivo'],
      priority: 'high'
    },
    {
      id: 3,
      category: 'Vagas',
      question: 'Como encontro vagas compatíveis?',
      answer: 'No feed principal, você verá vagas recomendadas baseadas no seu perfil. Use os filtros para refinar por salário, localização e tipo de contrato.',
      tags: ['vagas', 'busca', 'filtros'],
      priority: 'high'
    },
    {
      id: 4,
      category: 'Entrevista',
      question: 'Como me preparo para entrevistas?',
      answer: 'Use o simulador de entrevista disponível, pesquise sobre a empresa, prepare respostas para perguntas comuns e revise seu currículo.',
      tags: ['entrevista', 'preparação', 'simulador'],
      priority: 'medium'
    },
    {
      id: 5,
      category: 'Networking',
      question: 'Como faço networking na plataforma?',
      answer: 'Conecte-se com recrutadores, participe de grupos profissionais, envie mensagens diretas e peça referências a contatos.',
      tags: ['networking', 'contatos', 'grupos'],
      priority: 'medium'
    }
  ],
  empresa: [
    {
      id: 6,
      category: 'Perfil',
      question: 'Como configuro o perfil da empresa?',
      answer: 'Preencha informações básicas, descrição da empresa, localização, website e adicione vagas. Complete todos os campos para melhor visibilidade.',
      tags: ['perfil', 'empresa', 'configuração'],
      priority: 'high'
    },
    {
      id: 7,
      category: 'Vagas',
      question: 'Como crio uma vaga?',
      answer: 'Clique em "Nova Vaga", preencha todos os campos obrigatórios: título, descrição, requisitos, salário e tipo de contrato.',
      tags: ['vagas', 'criar', 'publicar'],
      priority: 'high'
    },
    {
      id: 8,
      category: 'Candidatos',
      question: 'Como encontro candidatos qualificados?',
      answer: 'Use os filtros avançados para triagem, analise o ranking automático de compatibilidade e use a busca por palavras-chave.',
      tags: ['candidatos', 'busca', 'triagem'],
      priority: 'high'
    },
    {
      id: 9,
      category: 'Processo Seletivo',
      question: 'Como gerencio o processo seletivo?',
      answer: 'Use o workflow customizável para definir etapas, agende entrevistas pelo calendário integrado e dê feedback estruturado.',
      tags: ['processo', 'etapas', 'feedback'],
      priority: 'medium'
    },
    {
      id: 10,
      category: 'Analytics',
      question: 'Como analiso as métricas de recrutamento?',
      answer: 'Acesse o dashboard de analytics para ver time-to-hire, source effectiveness, cost-per-hire e diversity metrics.',
      tags: ['analytics', 'métricas', 'dashboard'],
      priority: 'medium'
    }
  ],
  geral: [
    {
      id: 11,
      category: 'Conta',
      question: 'Como altero minha senha?',
      answer: 'Vá para Configurações > Segurança, digite a senha atual e a nova senha. Confirme a alteração.',
      tags: ['senha', 'segurança', 'configurações'],
      priority: 'high'
    },
    {
      id: 12,
      category: 'Conta',
      question: 'Como altero meu email?',
      answer: 'Vá para Configurações > Conta, digite o novo email e confirme com sua senha atual.',
      tags: ['email', 'conta', 'alterar'],
      priority: 'medium'
    },
    {
      id: 13,
      category: 'Suporte',
      question: 'Como entro em contato com o suporte?',
      answer: 'Use o chat de suporte 24/7 ou envie um email para suporte@plataforma.com. Respostas em até 24h.',
      tags: ['suporte', 'contato', 'ajuda'],
      priority: 'high'
    },
    {
      id: 14,
      category: 'Privacidade',
      question: 'Meus dados estão seguros?',
      answer: 'Sim, usamos criptografia SSL, seguimos LGPD e seus dados são usados apenas para matching de vagas.',
      tags: ['privacidade', 'segurança', 'lgpd'],
      priority: 'medium'
    }
  ]
}

export default function FAQ({ userType = 'candidato', initialSearch = '' }) {
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState('todas')
  const [expandedItems, setExpandedItems] = useState(new Set())

  // Combinar FAQs específicos do usuário com gerais
  const allFAQs = useMemo(() => {
    const userSpecific = faqData[userType] || []
    const general = faqData.geral || []
    return [...userSpecific, ...general]
  }, [userType])

  // Extrair categorias únicas
  const categories = useMemo(() => {
    const cats = ['todas']
    allFAQs.forEach(faq => {
      if (!cats.includes(faq.category)) {
        cats.push(faq.category)
      }
    })
    return cats
  }, [allFAQs])

  // Filtrar FAQs baseado na busca e categoria
  const filteredFAQs = useMemo(() => {
    return allFAQs.filter(faq => {
      const matchesCategory = selectedCategory === 'todas' || faq.category === selectedCategory
      const matchesSearch = searchTerm === '' || 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      return matchesCategory && matchesSearch
    }).sort((a, b) => {
      // Prioridade alta primeiro
      if (a.priority === 'high' && b.priority !== 'high') return -1
      if (a.priority !== 'high' && b.priority === 'high') return 1
      
      // Depois por relevância da busca
      if (searchTerm) {
        const aScore = calculateRelevanceScore(a, searchTerm)
        const bScore = calculateRelevanceScore(b, searchTerm)
        return bScore - aScore
      }
      
      return 0
    })
  }, [allFAQs, selectedCategory, searchTerm])

  const calculateRelevanceScore = (faq, search) => {
    const searchLower = search.toLowerCase()
    let score = 0
    
    // Pergunta exata = maior pontuação
    if (faq.question.toLowerCase().includes(searchLower)) {
      score += 10
    }
    
    // Tags correspondentes
    faq.tags.forEach(tag => {
      if (tag.toLowerCase().includes(searchLower)) {
        score += 5
      }
    })
    
    // Resposta contém termo
    if (faq.answer.toLowerCase().includes(searchLower)) {
      score += 2
    }
    
    return score
  }

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const expandAll = () => {
    setExpandedItems(new Set(filteredFAQs.map(faq => faq.id)))
  }

  const collapseAll = () => {
    setExpandedItems(new Set())
  }

  const highlightText = (text, search) => {
    if (!search) return text
    
    const regex = new RegExp(`(${search})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index}>{part}</mark> : part
    )
  }

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h2>Central de Ajuda</h2>
        <p>Encontre respostas rápidas para suas dúvidas</p>
      </div>

      <div className="faq-search">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Busque por palavras-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="faq-search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      <div className="faq-filters">
        <div className="category-filter">
          <label>Categoria:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'todas' ? 'Todas as Categorias' : cat}
              </option>
            ))}
          </select>
        </div>
        
        <div className="action-buttons">
          <button onClick={expandAll} className="expand-btn">
            Expandir Todas
          </button>
          <button onClick={collapseAll} className="collapse-btn">
            Recolher Todas
          </button>
        </div>
      </div>

      <div className="faq-results">
        <p className="results-count">
          {filteredFAQs.length} {filteredFAQs.length === 1 ? 'pergunta encontrada' : 'perguntas encontradas'}
        </p>
      </div>

      <div className="faq-list">
        {filteredFAQs.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🤔</div>
            <h3>Nenhuma pergunta encontrada</h3>
            <p>Tente usar termos diferentes ou entre em contato com nosso suporte.</p>
            <button className="contact-support-btn">
              Falar com Suporte
            </button>
          </div>
        ) : (
          filteredFAQs.map(faq => (
            <div 
              key={faq.id} 
              className={`faq-item ${expandedItems.has(faq.id) ? 'expanded' : ''} ${faq.priority}`}
            >
              <button 
                className="faq-question"
                onClick={() => toggleExpanded(faq.id)}
              >
                <div className="question-content">
                  <span className="category-badge">{faq.category}</span>
                  <h4>{highlightText(faq.question, searchTerm)}</h4>
                </div>
                <div className="question-toggle">
                  <span className="toggle-icon">
                    {expandedItems.has(faq.id) ? '−' : '+'}
                  </span>
                </div>
              </button>
              
              {expandedItems.has(faq.id) && (
                <div className="faq-answer">
                  <div className="answer-content">
                    {highlightText(faq.answer, searchTerm)}
                  </div>
                  <div className="answer-footer">
                    <div className="tags">
                      {faq.tags.map((tag, index) => (
                        <span key={index} className="tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="helpful-buttons">
                      <span className="helpful-text">Esta resposta foi útil?</span>
                      <button className="helpful-btn">👍 Sim</button>
                      <button className="helpful-btn">👎 Não</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
