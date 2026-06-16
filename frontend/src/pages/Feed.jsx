// Página: Feed
// Propósito: Mostrar posts, vagas e notificações do feed principal.
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import flaskClient from '../api/flaskClient'
// import { io } from 'socket.io-client' // TODO: Implementar socket.io no backend
import './Feed.css'
import './FeedExtras.css'

const SOCKET_URL = import.meta.env.VITE_NODE_API_URL || window.location.origin

const dicas = [
  '✨ Complete seu perfil',
  '📄 Atualize seu currículo',
  '❌ Relate problemas',
  '🚀 Participe das oportunidades com mais frequência',
  '💬 Mantenha seu contato atualizado para recrutadores',
  'Mantenha os dados sempre actualizados',
]

export default function Feed() {
  const { user, token, candidato } = useAuth()
  const [posts, setPosts] = useState([])
  const [vagas, setVagas] = useState([])
  const [novoPost, setNovoPost] = useState('')
  const [notificacoes, setNotificacoes] = useState([])
  const [showNotificacoes, setShowNotificacoes] = useState(false)
  const [vagasAplicadas, setVagasAplicadas] = useState({})
  const [pendingVagaId, setPendingVagaId] = useState(null)
  const [uploadingApplyFile, setUploadingApplyFile] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef(null)
  const [indiceDica, setIndiceDica] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) {
        setIndiceDica(prev => (prev + 1) % dicas.length)
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [isPaused])

  useEffect(() => {
    const loadFeed = async () => {
      try {
        let postsData = []
        try {
          const flaskRes = await flaskClient.get('/api/posts-feed/feed?page=1&per_page=20')
          postsData = flaskRes.data.posts || []
        } catch (flaskErr) {
          console.warn('Falha posts-feed, tentando Node/fallback:', flaskErr.message)
          try {
            const postsRes = await api.get('/posts/posts?page=1&limit=20')
            postsData = postsRes.data.data?.posts || postsRes.data.posts || []
          } catch (nodeErr) {
            console.warn('Node posts falhou, tentando posts-simple:', nodeErr.message)
            const fallbackRes = await flaskClient.get('/api/posts-simple/')
            postsData = fallbackRes.data.posts || []
          }
        }

        // Carregar vagas
        let vagasData = []
        try {
          const vagasRes = await flaskClient.get('/api/vagas/?ativa=true&limit=5')
          vagasData = vagasRes.data.vagas || vagasRes.data.data?.vagas || []
        } catch (flaskErr) {
          console.warn('Flask vagas falhou, tentando Node:', flaskErr.message)
          try {
            const nodeVagas = await api.get('/vagas?ativa=true&limit=5')
            vagasData = nodeVagas.data.data?.vagas || nodeVagas.data.vagas || []
          } catch (nodeErr) {
            console.error('Erro ao carregar vagas:', nodeErr)
          }
        }
        setVagas(vagasData)
      } catch (err) {
        console.error('Erro ao carregar feed:', err)
        setPosts([])
        setVagas([])
      } finally {
        setLoading(false)
      }
    }

    loadFeed()
  }, [])

  // fetch notifications (tries Node, then Flask fallback)
  const fetchNotifications = async () => {
    if (!user) return
    try {
      const { data } = await flaskClient.get('/api/posts-feed/notificacoes/nao-lidas')
      setNotificacoes(data.notificacoes || [])
    } catch (err) {
      console.warn('Falha posts-feed notificações, tentando fallback:', err.message || err)
      try {
        const { data } = await api.get('/notificacoes?nao_lidas=true')
        setNotificacoes(data.data || data.notificacoes || [])
      } catch (nodeErr) {
        try {
          const userId = user?.id || user?.user_id
          const res = await flaskClient.get(`/api/notificacoes?nao_lidas=true`)
          setNotificacoes(res.data.data || res.data.notificacoes || [])
        } catch (err2) {
          console.warn('Erro ao buscar notificações fallback final:', err2.message || err2)
        }
      }
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [token, user])

  // TODO: Implementar socket.io no backend para real-time updates
  // useEffect(() => {
  //   const socket = io(SOCKET_URL)
  //   socket.on('connect', () => {
  //     if (user?.id) socket.emit('autenticar', user.id)
  //   })
  //   socket.on('feed_atualizado', (post) => {
  //     setPosts(prev => [post, ...prev])
  //   })
  //   socket.on('notificacao', (notif) => {
  //     setNotificacoes(prev => [notif, ...prev])
  //   })
  //   socket.on('notificacao:all', (notif) => {
  //     setNotificacoes(prev => [notif, ...prev])
  //   })
  //   return () => socket.disconnect()
  // }, [user?.id])

  const markNotificationRead = async (notifId) => {
    try {
      await api.post(`/notificacoes/${notifId}/mark-read`)
      setNotificacoes(prev => prev.map(n => n.id === notifId ? ({ ...n, lida: true }) : n))
      return
    } catch (err) {
      try {
        await flaskClient.post(`/api/posts-simple/notificacoes/${notifId}/mark-read`)
        setNotificacoes(prev => prev.map(n => n.id === notifId ? ({ ...n, lida: true }) : n))
        return
      } catch (err2) {
        console.error('Erro ao marcar notificação como lida:', err2)
      }
    }
  }

  const criarPost = async (e) => {
    e.preventDefault()
    if (!novoPost.trim()) return
    try {
      const postData = {
        conteudo: novoPost,
        tipo: 'texto'
      }

      let result
      try {
        result = await flaskClient.post('/api/posts-feed/', postData)
      } catch (flaskErr) {
        console.warn('Falha posts-feed publicar, tentando Node/fallback:', flaskErr.message || flaskErr)
        try {
          const nodeData = {
            conteudo: novoPost,
            autor_id: user?.id || user?.user_id || null,
            autor_nome: candidato?.nome || user?.email || 'Usuário',
            autor_tipo: user?.tipo || 'candidato'
          }
          result = await api.post('/posts/', nodeData)
        } catch (nodeErr) {
          console.warn('Node backend falhou, tentando Flask posts-simple:', nodeErr.message || nodeErr)
          const fallbackData = {
            conteudo: novoPost,
            autor_id: user?.id || user?.user_id || null,
            autor_nome: candidato?.nome || user?.email || 'Usuário',
            autor_tipo: user?.tipo || 'candidato'
          }
          result = await flaskClient.post('/api/posts-simple/', fallbackData)
        }
      }

      setNovoPost('')
      const created = result.data.post || result.data
      setPosts(prev => [created, ...prev])
    } catch (err) {
      console.error('Erro ao publicar post:', err.response?.data || err.message || err)
      alert('Erro ao publicar post: ' + (err.response?.data?.erro || err.response?.data?.error || err.message || 'Verifique o console para detalhes'))
    }
  }

  const hasPerfilCurriculo = candidato?.curriculo && (
    candidato.curriculo.arquivo_url ||
    (Array.isArray(candidato.curriculo.habilidades) && candidato.curriculo.habilidades.length > 0) ||
    (Array.isArray(candidato.curriculo.idiomas) && candidato.curriculo.idiomas.length > 0) ||
    (Array.isArray(candidato.curriculo.experiencia) && candidato.curriculo.experiencia.length > 0) ||
    (Array.isArray(candidato.curriculo.educacao) && candidato.curriculo.educacao.length > 0)
  )

  const candidatarVaga = async (vagaId, file) => {
    if (!token || user?.tipo !== 'candidato') {
      alert('Faça login como candidato para se candidatar a esta vaga.')
      return
    }

    try {
      if (file) {
        const formData = new FormData()
        formData.append('vaga_id', vagaId)
        formData.append('file', file)
        await flaskClient.post('/api/vagas/candidaturas', formData)
      } else {
        await flaskClient.post('/api/vagas/candidaturas', { vaga_id: vagaId })
      }
      setVagasAplicadas(prev => ({ ...prev, [vagaId]: true }))
      alert('Candidatura enviada com sucesso!')
    } catch (err) {
      console.error('Erro ao candidatar para vaga:', err.response?.data || err.message || err)
      const message = err.response?.data?.error || err.response?.data?.erro || err.message || 'Erro ao candidatar'
      alert(message)
    }
  }

  const handleApplyClick = (vagaId) => {
    if (!token || user?.tipo !== 'candidato') {
      alert('Faça login como candidato para se candidatar a esta vaga.')
      return
    }

    if (hasPerfilCurriculo) {
      candidatarVaga(vagaId)
    } else {
      setPendingVagaId(vagaId)
      fileInputRef.current?.click()
    }
  }

  const handleApplyFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !pendingVagaId) {
      setPendingVagaId(null)
      return
    }

    setUploadingApplyFile(true)
    try {
      await candidatarVaga(pendingVagaId, file)
    } finally {
      setUploadingApplyFile(false)
      setPendingVagaId(null)
    }
  }

  const likePost = async (postId) => {
    try {
      await flaskClient.post(`/api/posts-feed/${postId}/curtir`)
      setPosts(prev => prev.map(p => p.id === postId ? ({ ...p, curtidas: (p.curtidas || 0) + 1 }) : p))
    } catch (flaskErr) {
      console.warn('Falha posts-feed like, tentando Node/fallback:', flaskErr.message || flaskErr)
      try {
        await api.post(`/posts/${postId}/like`)
        setPosts(prev => prev.map(p => p.id === postId ? ({ ...p, likes: (p.likes || p.likes_count || 0) + 1 }) : p))
      } catch (nodeErr) {
        try {
          const body = {
            autor_id: user?.id || user?.user_id || null,
            autor_nome: candidato?.nome || user?.email || 'Usuário'
          }
          await flaskClient.post(`/api/posts-simple/${postId}/like`, body)
          setPosts(prev => prev.map(p => p.id === postId ? ({ ...p, likes: (p.likes || 0) + 1 }) : p))
        } catch (fallbackErr) {
          console.error('Erro ao curtir post fallback final:', fallbackErr)
        }
      }
    }
  }

  const addComment = async (postId, conteudo) => {
    if (!conteudo || !conteudo.trim()) return
    const flaskPayload = { conteudo }
    const fallbackPayload = {
      conteudo,
      autor_id: user?.id || user?.user_id || null,
      autor_nome: candidato?.nome || user?.email || 'Usuário',
      autor_tipo: user?.tipo || 'candidato'
    }

    try {
      let data
      try {
        const resp = await flaskClient.post(`/api/posts-feed/${postId}/comentarios`, flaskPayload)
        data = resp.data
      } catch (flaskErr) {
        console.warn('Falha posts-feed comentário, tentando Node/fallback:', flaskErr.message || flaskErr)
        try {
          const resp = await api.post(`/posts/${postId}/comentario`, fallbackPayload)
          data = resp.data
        } catch (nodeErr) {
          const resp = await flaskClient.post(`/api/posts-simple/${postId}/comentario`, fallbackPayload)
          data = resp.data
        }
      }
      const comentario = data.comentario || { conteudo, autor: { nome: candidato?.nome || user?.email }, created_at: new Date().toISOString() }
      setPosts(prev => prev.map(p => p.id === postId ? ({ ...p, comentarios: [...(p.comentarios || []), comentario] }) : p))
    } catch (err) {
      console.error('Erro ao enviar comentário:', err)
    }
  }

  const likeComment = async (postId, commentId) => {
    try {
      await flaskClient.post(`/api/posts-feed/comentarios/${commentId}/curtir`)
      setPosts(prev => prev.map(p => p.id === postId ? ({
        ...p,
        comentarios: (p.comentarios || []).map(c => c.id === commentId ? ({ ...c, curtidas: (c.curtidas || 0) + 1 }) : c)
      }) : p))
    } catch (flaskErr) {
      console.warn('Falha posts-feed likeComment, tentando Node/fallback:', flaskErr.message || flaskErr)
      try {
        await api.post(`/posts/${postId}/comentario/${commentId}/like`)
        setPosts(prev => prev.map(p => p.id === postId ? ({
          ...p,
          comentarios: (p.comentarios || []).map(c => c.id === commentId ? ({ ...c, likes: (c.likes || 0) + 1 }) : c)
        }) : p))
      } catch (nodeErr) {
        try {
          const body = {
            autor_id: user?.id || user?.user_id || null,
            autor_nome: candidato?.nome || user?.email || 'Usuário'
          }
          await flaskClient.post(`/api/posts-simple/${postId}/comentario/${commentId}/like`, body)
          setPosts(prev => prev.map(p => p.id === postId ? ({
            ...p,
            comentarios: (p.comentarios || []).map(c => c.id === commentId ? ({ ...c, likes: (c.likes || 0) + 1 }) : c)
          }) : p))
        } catch (fallbackErr) {
          console.error('Erro ao curtir comentário fallback final:', fallbackErr)
        }
      }
    }
  }

  return (
    <div className="feed-page">
      <div className="feed-header">
        <h1>Feed</h1>
        <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
          {notificacoes.filter(n => !n.lida).length > 0 && (
            <div className="notificacoes-badge">
              {notificacoes.filter(n => !n.lida).length} nova(s)
            </div>
          )}
          <button className="btn-secondary" onClick={() => { setShowNotificacoes(!showNotificacoes); if (!showNotificacoes) fetchNotifications() }}>
            Notificações
          </button>
        </div>
      </div>

      {showNotificacoes && (
        <aside className="notificacoes-panel">
          <div className="panel-header">
            <strong>Notificações</strong>
            <button className="btn-secondary" onClick={() => setShowNotificacoes(false)}>Fechar</button>
          </div>
          <div className="panel-list">
            {notificacoes.length === 0 ? (
              <p className="empty">Nenhuma notificação</p>
            ) : (
              notificacoes.map(n => (
                <div key={n.id} className={"notif-item" + (n.lida ? ' read' : '')}>
                  <div style={{flex: 1}}>
                    <div className="notif-title">{n.titulo}</div>
                    <div className="notif-msg">{n.mensagem}</div>
                    <div className="notif-time">{n.created_at ? new Date(n.created_at).toLocaleString('pt-BR') : ''}</div>
                  </div>
                  {!n.lida && (
                    <button className="btn-primary" onClick={() => markNotificationRead(n.id)}>Marcar como lida</button>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      <div className="feed-layout">
        <aside className="feed-sidebar">
          <div
            className="card dicas-slider"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <h3>Dicas</h3>
            <p key={indiceDica} className="dica-atual">{dicas[indiceDica]}</p>
            <div className="dica-indicadores">
              {dicas.map((_, i) => (
                <span
                  key={i}
                  className={i === indiceDica ? 'indicador ativo' : 'indicador'}
                  onClick={() => setIndiceDica(i)}
                  aria-label={`Ir para dica ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </aside>

        <div className="feed-main">
          <form className="criar-post" onSubmit={criarPost}>
            <textarea
              placeholder="O que você está pensando?"
              value={novoPost}
              onChange={(e) => setNovoPost(e.target.value)}
              rows={3}
            />
            <button type="submit" className="btn-primary">Publicar</button>
          </form>

          {loading ? (
            <p className="loading">Carregando feed...</p>
          ) : (
            <>
              <div className="vagas-disponiveis">
                <div className="section-header">
                  <h2>Vagas disponíveis</h2>
                </div>
                {vagas.length === 0 ? (
                  <p className="empty">Nenhuma vaga disponível no momento.</p>
                ) : (
                  <div className="vagas-grid">
                    {vagas.map((vaga) => (
                      <article key={vaga.id} className="vaga-card">
                        <div className="vaga-card-header">
                          <div className="vaga-logo">{(vaga.empresa_nome || vaga.empresa?.nome || 'E')[0]}</div>
                          <div className="vaga-titles">
                            <h3>{vaga.titulo}</h3>
                            <small className="empresa-name">{vaga.empresa_nome || vaga.empresa?.nome || 'Empresa'}</small>
                          </div>
                        </div>
                        <div className="vaga-body">
                          <div className="vaga-local"><span>📍</span> {vaga.localizacao || 'Localização não informada'}</div>
                          <div className="vaga-tags">{(vaga.beneficios || []).slice(0,3).map((t,i)=>(<span key={i} className="tag">{t}</span>))}</div>
                        </div>
                        <div className="vaga-footer">
                          <div className="vaga-modalidade">{vaga.modalidade || 'Remoto / Presencial'}</div>
                          {Boolean(vagasAplicadas[vaga.id] || vaga.aplicada || vaga.candidatura || vaga.candidaturas?.length) ? (
                            <button className="btn-primary disabled" disabled>Enviado</button>
                          ) : (
                            <button
                              type="button"
                              className="btn-primary"
                              disabled={!token || user?.tipo !== 'candidato' || uploadingApplyFile}
                              onClick={() => handleApplyClick(vaga.id)}
                            >
                              {(!token || user?.tipo !== 'candidato')
                                ? 'Entrar para candidatar'
                                : hasPerfilCurriculo
                                  ? 'Enviar CV'
                                  : 'Anexar CV'}
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                style={{ display: 'none' }}
                onChange={handleApplyFile}
              />
              <div className="posts-list">
                {posts.length === 0 ? (
                  <p className="empty">Nenhum post ainda. Seja o primeiro a publicar!</p>
                ) : (
                  posts.map((post) => (
                    <article key={post.id} className="post-card">
                      <div className="post-header">
                        <div className="post-avatar">
                          {(post.autor?.nome || post.autor_nome || '?')[0] || '?'}
                        </div>
                        <div>
                          <strong>{post.autor?.nome || post.autor_nome || 'Anônimo'}</strong>
                          <span className="post-tipo">{post.autor?.tipo || post.tipo_autor}</span>
                        </div>
                      </div>
                      <p className="post-conteudo">{post.conteudo}</p>
                      <div style={{display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem'}}>
                        <span className="post-data">{(post.created_at || post.timestamp) ? new Date(post.created_at || post.timestamp).toLocaleString('pt-BR') : ''}</span>
                        <button className="btn-secondary" onClick={() => likePost(post.id)}>Curtir {(post.likes || post.likes_count || 0)}</button>
                      </div>
                      <div className="post-comments">
                        {(post.comentarios || []).map((c, i) => (
                          <div key={i} className="comment-item">
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
                              <strong>{c.autor?.nome || c.autor_nome || c.nome || 'Usuário'}</strong>
                              <button className="btn-tertiary btn-small" onClick={() => likeComment(post.id, c.id)}>
                                Curtir {c.likes || 0}
                              </button>
                            </div>
                            <p>{c.conteudo || c}</p>
                          </div>
                        ))}
                        <div style={{marginTop: '0.5rem'}}>
                          <input placeholder="Comentar..." onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addComment(post.id, e.target.value)
                              e.target.value = ''
                            }
                          }} />
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
