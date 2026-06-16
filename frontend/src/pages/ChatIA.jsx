// Página: ChatIA
// Propósito: Assistente IA para ajudar candidatos e empresas.
import { useState, useRef, useEffect, useMemo } from 'react'

import api from '../api/client'

import flaskClient from '../api/flaskClient'

import { useAuth } from '../context/AuthContext'

import './ChatIA.css'



export default function ChatIA() {

  const { empresa, candidato, user } = useAuth()

  const isEmpresa = !!empresa

  const isCandidato = !!candidato

  const storageKey = user?.id ? `chat_history_${user.id}` : 'chat_history_generic'

  const initialBotMessage = useMemo(() => ({
    sender: 'bot',
    text: 'Olá! Sou seu assistente. Use as ações rápidas ou faça uma pergunta para começar.',
    time: new Date().toLocaleTimeString()
  }), [])

  const [messages, setMessages] = useState(() => {
    if (typeof window === 'undefined') return [initialBotMessage]
    try {
      const stored = window.localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : [initialBotMessage]
    } catch (error) {
      return [initialBotMessage]
    }
  })

  const [currentMessage, setCurrentMessage] = useState('')
  const [hideQuickActions, setHideQuickActions] = useState(false)

  const [waiting, setWaiting] = useState(false)

  const [files, setFiles] = useState([])
  const [lastUploadedFiles, setLastUploadedFiles] = useState([])

  const [funcaoAtiva, setFuncaoAtiva] = useState(null)

  const [vagaId, setVagaId] = useState('')

  const [topK, setTopK] = useState(5)

  const [screenResults, setScreenResults] = useState([])

  const messagesEndRef = useRef(null)



  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  }, [messages])



  const addMessage = (msg) => setMessages((prev) => [...prev, { ...msg, time: new Date().toLocaleTimeString() }])

  const parseChatText = (text) => {
    const lines = text.split(/\r?\n/)
    const blocks = []
    let paragraphLines = []
    let listBlock = null

    const flushParagraph = () => {
      if (paragraphLines.length) {
        blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') })
        paragraphLines = []
      }
    }

    const flushList = () => {
      if (listBlock) {
        blocks.push(listBlock)
        listBlock = null
      }
    }

    const startList = (ordered) => {
      flushParagraph()
      flushList()
      listBlock = { type: 'list', ordered, items: [] }
    }

    lines.forEach((rawLine) => {
      const line = rawLine.trim()
      if (!line) {
        flushParagraph()
        flushList()
        return
      }

      const headingMatch = line.match(/^(#{1,3})\s*(.+)$/)
      const unorderedMatch = line.match(/^[-*•]\s+(.+)$/)
      const orderedMatch = line.match(/^(\d+)[\.\)]\s+(.+)$/)
      const sectionMatch = line.match(/^([A-ZÁ-Ú][\w\s]+):\s*(.*)$/i)

      if (headingMatch) {
        flushParagraph()
        flushList()
        blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2] })
        return
      }

      if (unorderedMatch) {
        if (!listBlock || listBlock.ordered) {
          startList(false)
        }
        listBlock.items.push(unorderedMatch[1])
        return
      }

      if (orderedMatch) {
        if (!listBlock || !listBlock.ordered) {
          startList(true)
        }
        listBlock.items.push(orderedMatch[2])
        return
      }

      if (sectionMatch && sectionMatch[2] === '') {
        flushParagraph()
        flushList()
        blocks.push({ type: 'heading', level: 3, text: sectionMatch[1] })
        return
      }

      if (sectionMatch && sectionMatch[2]) {
        flushParagraph()
        flushList()
        blocks.push({ type: 'heading', level: 3, text: sectionMatch[1] })
        paragraphLines.push(sectionMatch[2])
        return
      }

      paragraphLines.push(line)
    })

    flushParagraph()
    flushList()
    return blocks
  }

  const renderChatMessage = (text) => {
    const blocks = parseChatText(text)
    return blocks.map((block, index) => {
      if (block.type === 'heading') {
        const Tag = block.level <= 2 ? 'h3' : 'h4'
        return (
          <Tag key={index} className="message-block-heading">
            {block.text}
          </Tag>
        )
      }

      if (block.type === 'list') {
        const ListTag = block.ordered ? 'ol' : 'ul'
        return (
          <ListTag key={index} className="message-block-list">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{item}</li>
            ))}
          </ListTag>
        )
      }

      return (
        <p key={index} className="message-block-paragraph">
          {block.text}
        </p>
      )
    })
  }

  useEffect(() => {
    if (!user) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages))
    } catch (error) {
      console.error('Não foi possível salvar o histórico do chat:', error)
    }
  }, [messages, storageKey, user])

  const resetChat = () => {
    const newMessages = [initialBotMessage]
    setMessages(newMessages)
    setFuncaoAtiva(null)
    setVagaId('')
    setTopK(5)
    setScreenResults([])
    try {
      window.localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Não foi possível limpar o histórico do chat:', error)
    }
  }



  const quickPrompts = isEmpresa ? {
    melhorar_score: 'Quais melhorias posso aplicar no processo de seleção para aumentar o score de compatibilidade dos candidatos?',
    gerar_resumo: 'Gere um resumo executivo do candidato com foco em experiências, competências e recomendação para vaga.',
    enviar_feedback: 'Crie um e-mail de feedback profissional para o candidato explicando os pontos fortes e o que melhorar.',
    analisar_vaga: 'Quero analisar candidatos de uma vaga específica para identificar os melhores matches.',
    comparar_curriculos: 'Compare os currículos carregados em PDF e destaque semelhanças, diferenças e os candidatos mais alinhados.'
  } : {
    melhorar_cv: 'Me ajude a melhorar meu currículo para tornar minhas experiências mais atraentes ao recrutador.',
    gerar_resumo: 'Gere um resumo do meu perfil profissional destacando minhas principais habilidades e experiência.',
    carta_apresentacao: 'Crie uma carta de apresentação profissional baseada no meu perfil e na vaga desejada.'
  }

  const quickActionFuncs = {
    melhorar_score: 'analisar',
    gerar_resumo: 'resumo',
    enviar_feedback: 'sugerir',
    analisar_vaga: 'analisar',
    comparar_curriculos: 'comparar_curriculos',
    melhorar_cv: 'sugerir',
    carta_apresentacao: 'carta_apresentacao'
  }


  const sendPrompt = async (message, funcao = null) => {

    if (!message.trim() || waiting) return



    const text = message.trim()

    setCurrentMessage('')

    addMessage({ sender: 'user', text })

    setWaiting(true)



    try {

      const res = await flaskClient.post('/api/curriculos/ia/chat', {

        message: text,

        ...(funcao ? { funcao } : {})

      })

      addMessage({ sender: 'bot', text: res.data.response })

    } catch (err) {

      console.error(err)
      const botText = err?.payload?.msg || err?.payload?.message || err?.message || 'Erro ao processar a solicitação. Tente novamente.'
      addMessage({ sender: 'bot', text: botText })

    } finally {

      setWaiting(false)

    }

  }



  const handleQuickAction = async (action) => {
    if (action === 'analisar_vaga') {
      setFuncaoAtiva('screen')
      setScreenResults([])
      return
    }

    const prompt = quickPrompts[action]
    const funcao = quickActionFuncs[action] || null

    if (!prompt) {
      console.warn('Ação rápida não encontrada:', action)
      return
    }

    await sendPrompt(prompt, funcao)

  }

  const handleFileAction = async (action) => {
    await handleQuickAction(action)
    setLastUploadedFiles([])
  }



  const handleKeyDown = (e) => {

    if (e.key === 'Enter' && !e.shiftKey) {

      e.preventDefault()

      sendMessage()

    }

  }



  const handleChatInputFocus = () => {
    setHideQuickActions(true)
  }

  const handleChatInputBlur = () => {
    if (!currentMessage.trim()) {
      setHideQuickActions(false)
    }
  }

  const sendMessage = async () => {

    if (!currentMessage.trim() || waiting) return

    if (isEmpresa && funcaoAtiva === 'screen') return

    await sendPrompt(currentMessage)

  }



  const handleFileChange = (e) => {

    setFiles(Array.from(e.target.files))

  }



  const uploadFiles = async () => {

    if (!files.length) return

    setWaiting(true)

    addMessage({ sender: 'user', text: `Enviando ${files.length} arquivo(s)...` })



    const formData = new FormData()

    files.forEach((file) => formData.append('files', file))



    try {
      const res = await flaskClient.post('/api/curriculos/ia/upload', formData)

      const texts = (res.data.texts || []).map((item) => item.text)
      const uploaded = (res.data.texts || [])

      await flaskClient.post('/api/curriculos/ia/chat/load', { texts })

      addMessage({ sender: 'bot', text: `Textos extraídos de ${texts.length} arquivo(s) e carregados no chat.` })

      // pergunta automática sobre o que fazer com os arquivos
      const names = uploaded.map((i) => i.filename).join(', ')
      addMessage({ sender: 'bot', text: `Recebi os arquivos: ${names}. O que você quer que eu faça com eles?` })
      setLastUploadedFiles(uploaded)

      setFiles([])

    } catch (err) {
      console.error(err)
      let msg = 'Erro ao enviar arquivos. Tente novamente.'
      try {
        if (err && err.response && err.response.data && err.response.data.error) {
          msg = `Erro: ${err.response.data.error}`
        } else if (err && err.response && err.response.status) {
          msg = `Erro ${err.response.status}: ${err.response.statusText || ''}`
        } else if (err && err.message) {
          msg = `Erro: ${err.message}`
        }
      } catch (e) {
        // fallback to generic
      }
      addMessage({ sender: 'bot', text: msg })

    } finally {

      setWaiting(false)

    }

  }



  const analisarCandidatos = async () => {

    if (!vagaId.trim()) {

      addMessage({ sender: 'bot', text: 'Por favor, informe o ID da vaga.' })

      return

    }



    setWaiting(true)

    addMessage({ sender: 'user', text: `Analisando candidatos para vaga ${vagaId}...` })



    try {

      const res = await api.post(`/curriculos/vagas/${vagaId}/screen`, { top_k: topK })

      setScreenResults(res.data.results || [])

      addMessage({ sender: 'bot', text: `Análise concluída: ${res.data.total_candidaturas || 0} candidaturas avaliadas.` })

    } catch (err) {

      console.error(err)

      addMessage({ sender: 'bot', text: 'Erro ao analisar candidatos. Verifique o ID da vaga ou tente novamente.' })

    } finally {

      setWaiting(false)

    }

  }



  const voltarAoChat = () => {

    setFuncaoAtiva(null)

    setVagaId('')

    setTopK(5)

    setScreenResults([])

  }



  return (

    <div className="chat-page">

      <div className="chat-window">

        <header className="chat-header">

          <div>

            <h1>{isEmpresa ? 'Assistente de Recrutamento' : 'Assistente de Carreira'}</h1>

            <p>
              {isEmpresa
                ? 'Use a assistente para analisar candidatos, vagas e gerar relatórios de seleção.'
                : 'Use a assistente para melhorar seu currículo e gerar conteúdo profissional para sua jornada.'}
            </p>

          </div>

        </header>



        {!hideQuickActions && !currentMessage.trim() && (
          <div className="chat-actions">
            {isEmpresa ? (
              <>
                <button type="button" className="action-chip" onClick={() => handleQuickAction('melhorar_score')}>Melhorar score</button>
                <button type="button" className="action-chip" onClick={() => handleQuickAction('gerar_resumo')}>Gerar resumo</button>
                <button type="button" className="action-chip" onClick={() => handleQuickAction('enviar_feedback')}>Enviar feedback</button>
                <button type="button" className="action-chip" onClick={() => handleQuickAction('analisar_vaga')}>Analisar candidatos</button>
              </>
            ) : (
              <>
                <button type="button" className="action-chip" onClick={() => handleQuickAction('melhorar_cv')}>Melhorar currículo</button>
                <button type="button" className="action-chip" onClick={() => handleQuickAction('gerar_resumo')}>Gerar resumo</button>
                <button type="button" className="action-chip" onClick={() => handleQuickAction('carta_apresentacao')}>Carta de apresentação</button>
              </>
            )}

          </div>
        )}


        {isEmpresa && funcaoAtiva === 'screen' && (

          <div className="screen-widget">

            <div className="screen-title">Análise de vaga</div>

            <div className="screen-row">

              <label>ID da vaga</label>

              <input

                value={vagaId}

                onChange={(e) => setVagaId(e.target.value)}

                placeholder="Ex: 123"

                disabled={waiting}

              />

            </div>

            <div className="screen-row">

              <label>Top candidatos</label>

              <input

                type="number"

                min={1}

                max={50}

                value={topK}

                onChange={(e) => setTopK(Number(e.target.value))}

                disabled={waiting}

              />

            </div>

            <div className="chat-input-actions">

              <button onClick={analisarCandidatos} disabled={waiting || !vagaId.trim()} className="send-btn">

                Analisar candidatos

              </button>

              <button type="button" onClick={voltarAoChat} className="action-chip">

                Voltar ao chat

              </button>

            </div>

            {screenResults.length > 0 && (

              <div className="screen-results">

                <h3>Resultados</h3>

                <ul>

                  {screenResults.map((item, index) => (

                    <li key={index}>

                      <strong>{item.candidato_nome || item.candidato_id || `Candidato ${index + 1}`}</strong> — compatibilidade: {item.compatibilidade_pct}%

                    </li>

                  ))}

                </ul>

              </div>

            )}

          </div>

        )}



        <div className="chat-messages">

          {messages.map((message, index) => (

            <div key={index} className={`chat-message ${message.sender}`}>

              {message.sender !== 'bot' && (

                <div className="message-avatar">👤</div>

              )}

              <div className="message-content">

                <div className="message-header">

                  <span className="message-sender">{message.sender === 'bot' ? 'Assistente' : 'Você'}</span>

                  <span className="message-time">{message.time}</span>

                </div>

                <div className="message-text">

                  {renderChatMessage(message.text)}

                </div>

              </div>

            </div>

          ))}



          {waiting && (

            <div className="chat-message bot">

              <div className="message-content">

                <div className="message-header">

                  <span className="message-sender">Assistente IA</span>

                </div>

                <div className="message-text typing-indicator">

                  <span />

                  <span />

                  <span />

                </div>

              </div>

            </div>

          )}



          <div ref={messagesEndRef} />

        </div>



        <div className="chat-input-container">

          <textarea

            value={currentMessage}

            onChange={(e) => setCurrentMessage(e.target.value)}

            onFocus={handleChatInputFocus}

            onBlur={handleChatInputBlur}

          />

          <div className="chat-input-actions">

            <input

              type="file"

              id="file-upload"

              multiple

              accept=".pdf,.docx"

              onChange={handleFileChange}

              disabled={waiting}

              style={{ display: 'none' }}

            />

            <label htmlFor="file-upload" className="file-upload-btn" aria-disabled={waiting.toString()}>

              <span className="upload-icon">📎</span>

              Anexar

            </label>

            <button type="button" className="new-chat-btn" onClick={resetChat} disabled={waiting}>
              Novo chat
            </button>

            <button onClick={sendMessage} disabled={waiting || !currentMessage.trim()} className="send-btn">

              <span className="send-icon">➤</span>

              Enviar

            </button>

          </div>

          {files.length > 0 && (

            <div className="file-preview">

              <span>{files.length} arquivo(s) selecionado(s)</span>

              {files.length <= 10 && (
                <div className="file-names" style={{ marginTop: '0.5rem', color: '#555' }}>
                  {files.map((file) => file.name).join(', ')}
                </div>
              )}

              <div className="file-note" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                Você pode enviar até 250 arquivos PDF ou DOCX de uma só vez.
              </div>

              <button onClick={uploadFiles} disabled={waiting} className="upload-btn">

                {waiting ? 'Enviando...' : 'Enviar arquivos'}

              </button>

            </div>

          )}

          {lastUploadedFiles.length > 0 && (
            <div className="file-actions" style={{ marginTop: '0.75rem' }}>
              <p style={{ margin: '0 0 .5rem' }}>O que deseja fazer com os arquivos enviados?</p>
              <div className="chat-actions">
                {isEmpresa ? (
                  <>
                    <button type="button" className="action-chip" onClick={() => handleFileAction('gerar_resumo')}>Gerar resumo</button>
                    <button type="button" className="action-chip" onClick={() => handleFileAction('analisar_vaga')}>Analisar conteúdo</button>
                    <button type="button" className="action-chip" onClick={() => handleFileAction('comparar_curriculos')}>Comparar currículos</button>
                  </>
                ) : (
                  <>
                    <button type="button" className="action-chip" onClick={() => handleFileAction('gerar_resumo')}>Gerar resumo</button>
                    <button type="button" className="action-chip" onClick={() => handleFileAction('melhorar_cv')}>Melhorar currículo</button>
                  </>
                )}
              </div>
              <div style={{ marginTop: '.5rem' }}>
                <button className="btn-voltar" onClick={() => setLastUploadedFiles([])}>Ignorar arquivos</button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>

  )

}

