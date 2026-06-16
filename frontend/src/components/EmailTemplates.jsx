import { useState } from 'react'
import './EmailTemplates.css'

const emailTemplates = {
  candidato: {
    confirmacao_candidatura: {
      subject: 'Confirmação de Candidatura - {{vaga.titulo}} na {{empresa.nome}}',
      body: `Olá {{candidato.nome}},

Sua candidatura para a vaga de {{vaga.titulo}} na {{empresa.nome}} foi recebida com sucesso!

📋 Detalhes da Vaga:
• Cargo: {{vaga.titulo}}
• Empresa: {{empresa.nome}}
• Localização: {{vaga.localizacao}}
• Tipo: {{vaga.tipo_contrato}}
• Salário: {{vaga.salario}}

📅 Próximos Passos:
1. Seu perfil será analisado pela equipe de recrutamento
2. Caso aprovado, você receberá um contato em até 7 dias úteis
3. Prepare-se para possíveis testes técnicos e entrevistas

💡 Dicas:
• Revise seu perfil para garantir que está completo
• Prepare um portfólio com seus melhores projetos
• Pesquise sobre a empresa antes da entrevista

Agradecemos seu interesse e boa sorte!

Atenciosamente,
Equipe {{empresa.nome}}`,
      category: 'Candidatura',
      description: 'Confirmação automática quando candidato se inscreve em vaga'
    },
    
    entrevista_agendada: {
      subject: 'Entrevista Agendada - {{vaga.titulo}}',
      body: `Olá {{candidato.nome}},

Temos boas notícias! Sua candidatura foi aprovada e gostaríamos de agendar uma entrevista.

🗓️ Detalhes da Entrevista:
• Data: {{entrevista.data}}
• Horário: {{entrevista.horario}}
• Duração: {{entrevista.duracao}}
• Modalidade: {{entrevista.modalidade}}
• Local/Link: {{entrevista.local}}

📋 O que levar:
• Currículo atualizado
• Portfólio (se aplicável)
• Documentos de identificação
• Anotações sobre a empresa

🔗 Links úteis:
• Perfil da empresa: {{empresa.website}}
• Descrição completa da vaga: {{vaga.link}}

Por favor, confirme sua presença até {{data_confirmacao}} respondendo este email.

Estamos ansiosos para conhecê-lo melhor!

Atenciosamente,
{{recrutador.nome}}
{{recrutador.cargo}}
{{empresa.nome}}`,
      category: 'Entrevista',
      description: 'Agendamento de entrevista com candidato aprovado'
    },
    
    feedback_positivo: {
      subject: 'Parabéns! Você foi selecionado para a próxima etapa',
      body: `Olá {{candidato.nome}},

Parabéns! Tivemos uma ótima impressão durante sua entrevista e gostaríamos de convidá-lo para a próxima etapa do processo seletivo.

🎉 Seu desempenho:
• Avaliação técnica: {{avaliacao.tecnica}}
• Avaliação comportamental: {{avaliacao.comportamental}}
• Fit cultural: {{avaliacao.cultural}}

📋 Próxima Etapa:
• Etapa: {{proxima_etapa.nome}}
• Data prevista: {{proxima_etapa.data}}
• Preparação necessária: {{proxima_etapa.preparacao}}

📝 Feedback:
{{feedback.positivo}}

Continue assim! Você está muito próximo de conquistar esta oportunidade.

Atenciosamente,
{{recrutador.nome}}
{{empresa.nome}}`,
      category: 'Feedback',
      description: 'Feedback positivo após entrevista'
    },
    
    feedback_rejeitacao: {
      subject: 'Agradecemos seu interesse - {{vaga.titulo}}',
      body: `Olá {{candidato.nome}},

Agradecemos muito seu interesse na vaga de {{vaga.titulo}} e pelo tempo dedicado ao processo seletivo.

📊 Sua avaliação:
• Candidatos avaliados: {{total_candidatos}}
• Sua classificação: Top {{classificacao_percentil}}%
• Pontos fortes: {{pontos_fortes}}

🤝 Mantenha o contato:
Gostaríamos de manter seu perfil em nosso banco de talentos para futuras oportunidades que se alinhem com seu perfil.

💡 Sugestões para melhorar:
{{sugestoes_melhoria}}

Desejamos muito sucesso em sua carreira!

Atenciosamente,
Equipe {{empresa.nome}}`,
      category: 'Feedback',
      description: 'Comunicação de rejeição construtiva'
    }
  },
  
  empresa: {
    novo_candidato: {
      subject: 'Novo candidato para {{vaga.titulo}} - {{candidato.nome}}',
      body: `Olá {{recrutador.nome}},

Um novo candidato acabou de se inscrever na vaga de {{vaga.titulo}}!

👤 Candidato:
• Nome: {{candidato.nome}}
• Email: {{candidato.email}}
• Telefone: {{candidato.telefone}}
• LinkedIn: {{candidato.linkedin}}

📊 Compatibilidade:
• Score de match: {{match_score}}%
• Habilidades principais: {{habilidades_principais}}
• Anos de experiência: {{anos_experiencia}}

🔗 Ações rápidas:
• [Ver perfil completo]({{candidato.perfil_link}})
• [Baixar currículo]({{candidato.curriculo_link}})
• [Agendar entrevista]({{agenda_entrevista_link}})

Este candidato está entre os top {{classificacao}}% mais compatíveis com a vaga.

Atenciosamente,
Sistema de Recrutamento`,
      category: 'Alertas',
      description: 'Notificação para recrutadores sobre novos candidatos'
    },
    
    lembrete_entrevista: {
      subject: 'Lembrete: Entrevista com {{candidato.nome}} em {{horas}} horas',
      body: `⏰ Lembrete de Entrevista

Você tem uma entrevista agendada:

📅 Detalhes:
• Candidato: {{candidato.nome}}
• Vaga: {{vaga.titulo}}
• Data: {{entrevista.data}}
• Horário: {{entrevista.horario}}
• Modalidade: {{entrevista.modalidade}}

📋 Preparação:
• Revisar currículo do candidato
• Preparar perguntas técnicas
• Configurar ambiente (se online)
• Ter avaliação pronta

🔗 Links úteis:
• [Perfil do candidato]({{candidato.perfil_link}})
• [Descrição da vaga]({{vaga.descricao_link}})
• [Link da entrevista]({{entrevista.link}})

Boa sorte na entrevista!

Atenciosamente,
Assistente Virtual`,
      category: 'Lembretes',
      description: 'Lembrete automático antes de entrevistas'
    },
    
    relatorio_semanal: {
      subject: 'Relatório Semanal de Recrutamento - Semana {{semana}}',
      body: `📊 Relatório Semanal de Recrutamento

Período: {{data_inicio}} a {{data_fim}}

📈 Métricas Gerais:
• Novas candidaturas: {{novas_candidaturas}}
• Entrevistas realizadas: {{entrevistas_realizadas}}
• Ofertas enviadas: {{ofertas_enviadas}}
• Contratações: {{contratacoes}}

🎯 Top Vagas (por candidaturas):
{{top_vagas}}

⭐ Candidatos em Destaque:
{{candidatos_destaque}}

📋 Status do Pipeline:
• Em análise: {{pipeline.analise}}
• Em entrevista: {{pipeline.entrevista}}
• Oferta enviada: {{pipeline.oferta}}
• Contratados: {{pipeline.contratados}}

⚠️ Ações Necessárias:
{{acoes_necessarias}}

Para visualizar o dashboard completo, acesse: [Dashboard Analytics]({{dashboard_link}})

Atenciosamente,
Sistema de Recrutamento`,
      category: 'Relatórios',
      description: 'Relatório semanal automático para gestores'
    }
  }
}

export default function EmailTemplates({ userType = 'candidato', onTemplateSelect }) {
  const [selectedCategory, setSelectedCategory] = useState('todas')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  const templates = emailTemplates[userType] || {}
  const categories = ['todas', ...new Set(Object.values(templates).map(t => t.category))]

  const filteredTemplates = Object.entries(templates).filter(([key, template]) => {
    const matchesCategory = selectedCategory === 'todas' || template.category === selectedCategory
    const matchesSearch = searchTerm === '' || 
      template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategory && matchesSearch
  })

  const handleTemplateSelect = (templateKey, template) => {
    setSelectedTemplate({ key, ...template })
    if (onTemplateSelect) {
      onTemplateSelect(templateKey, template)
    }
  }

  const previewTemplate = (template) => {
    return {
      ...template,
      subject: template.subject.replace(/\{\{[^}]+\}\}/g, '[VARIÁVEL]'),
      body: template.body.replace(/\{\{[^}]+\}\}/g, '[VARIÁVEL]')
    }
  }

  return (
    <div className="email-templates">
      <div className="templates-header">
        <h2>Templates de Email</h2>
        <p>Modelos prontos para comunicação automatizada</p>
      </div>

      <div className="templates-filters">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="category-filter">
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
      </div>

      <div className="templates-grid">
        {filteredTemplates.length === 0 ? (
          <div className="no-templates">
            <p>Nenhum template encontrado.</p>
          </div>
        ) : (
          filteredTemplates.map(([key, template]) => (
            <div 
              key={key}
              className="template-card"
              onClick={() => handleTemplateSelect(key, template)}
            >
              <div className="template-header">
                <span className="template-category">{template.category}</span>
                <span className="template-key">{key}</span>
              </div>
              
              <h3 className="template-title">{template.subject}</h3>
              <p className="template-description">{template.description}</p>
              
              <div className="template-preview">
                <h4>Prévia:</h4>
                <div className="preview-subject">
                  <strong>Assunto:</strong> {previewTemplate(template).subject}
                </div>
                <div className="preview-body">
                  <strong>Corpo:</strong> 
                  <pre>{previewTemplate(template).body.substring(0, 200)}...</pre>
                </div>
              </div>
              
              <div className="template-actions">
                <button className="btn-preview">Visualizar Completo</button>
                <button className="btn-use">Usar Template</button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedTemplate && (
        <div className="template-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedTemplate.subject}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedTemplate(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="template-info">
                <span className="category-badge">{selectedTemplate.category}</span>
                <p>{selectedTemplate.description}</p>
              </div>
              
              <div className="template-full">
                <div className="subject-field">
                  <label>Assunto:</label>
                  <input 
                    type="text" 
                    value={selectedTemplate.subject}
                    readOnly
                  />
                </div>
                
                <div className="body-field">
                  <label>Corpo do Email:</label>
                  <textarea 
                    value={selectedTemplate.body}
                    readOnly
                    rows={15}
                  />
                </div>
              </div>
              
              <div className="variables-info">
                <h4>Variáveis Disponíveis:</h4>
                <div className="variables-list">
                  {Array.from(selectedTemplate.subject.matchAll(/\{\{([^}]+)\}\}/g))
                    .concat(Array.from(selectedTemplate.body.matchAll(/\{\{([^}]+)\}\}/g)))
                    .map((match, index) => (
                      <span key={index} className="variable">
                        {match[1]}
                      </span>
                    ))
                    .filter((value, index, self) => self.indexOf(value) === index)
                  }
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn-copy">Copiar Template</button>
              <button className="btn-send">Enviar Email</button>
              <button 
                className="btn-cancel"
                onClick={() => setSelectedTemplate(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
