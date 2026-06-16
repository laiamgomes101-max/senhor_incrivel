// Página: FeedEmpresa
// Propósito: Feed voltado para empresas (vagas e candidaturas).
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import flaskClient from '../api/flaskClient'
import { io } from 'socket.io-client'
import ChatIA from './ChatIA'
import './Feed.css'

const SOCKET_URL = import.meta.env.VITE_NODE_API_URL || window.location.origin

export default function FeedEmpresa() {
  const { user, empresa, token } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [vagas, setVagas] = useState([])
  const [candidaturas, setCandidaturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState({})
  const [abaAtiva, setAbaAtiva] = useState('vagas') // 'vagas' ou 'ia'
  
  // Carregar vagas da empresa
  useEffect(() => {
    if (!empresa?.id) return
    
    flaskClient.get(`/api/vagas/?empresa_id=${empresa.id}`)
      .then(({ data }) => {
        setVagas(data.vagas || [])
      })
      .catch(err => console.error('Erro ao carregar vagas:', err))
      .finally(() => setLoading(false))
  }, [empresa?.id])

  // Carregar candidaturas recebidas
  useEffect(() => {
    if (!token || !empresa?.id) return
    
    flaskClient.get(`/api/vagas/candidaturas/by_empresa/${empresa.id}`)
      .then(({ data }) => {
        setCandidaturas(data.candidaturas || [])
      })
      .catch(err => console.error('Erro ao carregar candidaturas:', err))
  }, [token, empresa?.id])

  // Carregar publicações de candidatos
  useEffect(() => {
    setPostsLoading(true)
    const loadPosts = async () => {
      try {
        const resp = await flaskClient.get('/api/posts-feed/feed?page=1&per_page=20')
        setPosts(resp.data.posts?.filter((post) => post.autor?.tipo === 'candidato') || [])
      } catch (flaskErr) {
        console.warn('Falha posts-feed, tentando Node/fallback:', flaskErr.message || flaskErr)
        try {
          const { data } = await api.get('/posts/posts?page=1&limit=20')
          setPosts(data.data?.posts?.filter((post) => post.autor?.tipo === 'candidato') || data.posts?.filter((post) => post.autor?.tipo === 'candidato') || [])
        } catch (nodeErr) {
          console.warn('Node posts falhou, tentando posts-simple:', nodeErr.message || nodeErr)
          try {
            const resp = await flaskClient.get('/api/posts-simple/')
            setPosts(resp.data.posts?.filter((post) => post.autor?.tipo === 'candidato') || [])
          } catch (fallbackErr) {
            console.error('Erro ao carregar publicações fallback final:', fallbackErr)
            setPosts([])
          }
        }
      } finally {
        setPostsLoading(false)
      }
    }

    loadPosts()
  }, [])

  const candidatePosts = posts.filter((post) => post.autor?.tipo === 'candidato')

  // Socket.io - atualizações em tempo real
  useEffect(() => {
    if (!token || !empresa?.id) return
    
    const socket = io(SOCKET_URL)
    socket.on('connect', () => {
      if (empresa?.id) socket.emit('autenticar', empresa.id)
    })
    
    socket.on('nova_vaga', (vaga) => {
      setVagas(prev => [vaga, ...prev])
    })
    
    socket.on('nova_candidatura', (candidatura) => {
      setCandidaturas(prev => [candidatura, ...prev])
    })

    socket.on('feed_atualizado', (post) => {
      if (post?.autor?.tipo === 'candidato') {
        setPosts(prev => [post, ...prev])
      }
    })
    
    return () => socket.disconnect()
  }, [token, empresa?.id])

  const atualizarStatusCandidatura = async (candidaturaId, novoStatus) => {
    try {
      await flaskClient.patch(`/api/vagas/candidaturas/${candidaturaId}`, { status: novoStatus })
      
      setCandidaturas(prev =>
        prev.map(c => c.id === candidaturaId ? { ...c, status: novoStatus } : c)
      )
    } catch (err) {
      console.error('Erro ao atualizar candidatura:', err)
    }
  }

  return (
    <div className="feed-page feed-empresa-page">
      <div className="feed-header">
        <h1>Feed de Candidatos</h1>
        {candidaturas.length > 0 && (
          <div className="notificacoes-badge">
            {candidaturas.filter(c => c.status === 'pendente').length} candidatura(s)
          </div>
        )}
        
        {/* ABAS */}
        <div className="feed-tabs">
          <button 
            className={abaAtiva === 'vagas' ? 'active' : ''} 
            onClick={() => setAbaAtiva('vagas')}
          >
            Publicações de Candidatos
          </button>
          <button 
            className={abaAtiva === 'ia' ? 'active' : ''} 
            onClick={() => navigate('/app/ia')}
          >
            Análise com Assistência
          </button>
        </div>
      </div>

      <div className="feed-layout">
        {abaAtiva === 'vagas' ? (
          <>
            {/* SIDEBAR */}
            <aside className="feed-sidebar">
              <div className="card">
                <h3>Resumo</h3>
                <div className="resumo-stats">
                  <div className="stat">
                    <span className="stat-numero">{vagas.length}</span>
                    <span className="stat-label">Vagas</span>
                  </div>
                  <div className="stat">
                    <span className="stat-numero">{candidaturas.length}</span>
                    <span className="stat-label">Candidaturas</span>
                  </div>
                  <div className="stat">
                    <span className="stat-numero">
                      {candidaturas.filter(c => c.status === 'pendente').length}
                    </span>
                    <span className="stat-label">Pendentes</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3>Filtros</h3>
                <a href="#pendentes">Candidaturas pendentes</a>
                <a href="#vagas-ativas">Vagas ativas</a>
                <a href="#posts-candidatos">Publicações de candidatos</a>
              </div>
            </aside>

            {/* MAIN */}
            <div className="feed-main">
              {/* LISTA DE VAGAS */}
              {loading ? (
                <p className="loading">Carregando vagas...</p>
              ) : (
                <>
                  <div className="section-box" id="posts-candidatos">
                    <div className="section-box-header">
                      <h3>Publicações de Candidatos</h3>
                    </div>
                    <div className="scroll-section candidate-posts">
                      {postsLoading ? (
                        <p className="loading">Carregando publicações...</p>
                      ) : candidatePosts.length === 0 ? (
                        <p className="empty">Nenhuma publicação de candidatos encontrada no momento.</p>
                      ) : (
                        candidatePosts.map((post) => (
                          <article key={post.id} className="post-card">
                            <div className="post-header">
                              <div className="post-avatar">
                                {post.autor?.foto ? (
                                  <img src={post.autor.foto} alt={post.autor.nome || 'Avatar'} />
                                ) : post.autor?.nome?.[0] || 'C'}
                              </div>
                              <div>
                                <strong>{post.autor?.nome || 'Candidato'}</strong>
                                <span className="post-tipo">{post.autor?.tipo || 'candidato'}</span>
                              </div>
                            </div>
                            <p className="post-conteudo">{post.conteudo}</p>
                            <span className="post-data">
                              {post.created_at ? new Date(post.created_at).toLocaleString('pt-BR') : ''}
                            </span>
                          </article>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="section-box" id="vagas-ativas" style={{ marginTop: '2rem' }}>
                    <div className="section-box-header">
                      <h3>Minhas Vagas</h3>
                    </div>
                    <div className="scroll-section vagas-list">
                      {vagas.length === 0 ? (
                        <p className="empty">Nenhuma vaga publicada ainda.</p>
                      ) : (
                        vagas.map((vaga) => (
                          <article key={vaga.id} className="post-card">
                            <div className="post-header">
                              <div className="post-avatar" style={{ background: 'var(--accent)' }}>
                                💼
                              </div>
                              <div>
                                <strong>{vaga.titulo}</strong>
                                <span className="post-tipo">{vaga.tipo_contrato || 'Sem tipo'}</span>
                              </div>
                            </div>
                            <p className="post-conteudo">{vaga.descricao}</p>
                            <span className="post-data">
                              Publicado em {vaga.created_at ? new Date(vaga.created_at).toLocaleString('pt-BR') : ''}
                            </span>
                          </article>
                        ))
                      )}
                    </div>
                  </div>

                  {candidaturas.length > 0 && (
                    <div id="pendentes" style={{ marginTop: '2rem' }}>
                      <h3 style={{ marginBottom: '1rem' }}>Candidaturas Recebidas</h3>
                      <div className="posts-list">
                        {candidaturas.map((cand) => (
                          <article key={cand.id} className="post-card" style={{ borderLeft: '4px solid var(--accent)' }}>
                            <div className="post-header">
                              <div className="post-avatar" style={{ background: 'var(--accent-muted)' }}>
                                👤
                              </div>
                              <div>
                                <strong>{cand.candidato?.nome || 'Candidato'}</strong>
                                <span className="post-tipo">
                                  Para: {cand.vaga?.titulo}
                                </span>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                background: cand.status === 'pendente' ? 'var(--warning-muted)' :
                                           cand.status === 'aprovado' ? 'var(--success-muted)' : 'var(--error-muted)',
                                color: cand.status === 'pendente' ? '#d97706' :
                                       cand.status === 'aprovado' ? '#16a34a' : '#dc2626'
                              }}>
                                {cand.status.toUpperCase()}
                              </span>
                              {cand.score_analise != null && (
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '4px',
                                  fontSize: '0.85rem',
                                  background: 'var(--accent-muted)',
                                  color: 'var(--accent)'
                                }}>
                                  Score: {cand.score_analise.toFixed(1)}%
                                </span>
                              )}
                              {cand.ranking != null && (
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '4px',
                                  fontSize: '0.85rem',
                                  background: '#eef2ff',
                                  color: '#4338ca'
                                }}>
                                  Ranking: {cand.ranking}
                                </span>
                              )}
                            </div>
                            
                            {cand.feedback && (
                              <p style={{ fontSize: '0.9rem', marginBottom: '1rem', fontStyle: 'italic' }}>
                                <strong>Análise:</strong> {cand.feedback}
                              </p>
                            )}
                            
                            {['pendente', 'analisado'].includes(cand.status) && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => atualizarStatusCandidatura(cand.id, 'aprovado')}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    background: '#16a34a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  ✓ Aprovar
                                </button>
                                <button
                                  onClick={() => atualizarStatusCandidatura(cand.id, 'rejeitado')}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  ✗ Rejeitar
                                </button>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>

        ) : (
          /* ABA IA */
          <div className="feed-main" style={{ maxWidth: '100%', margin: 0 }}>
            <ChatIA />
          </div>
        )}
      </div>
    </div>
  )
}
