// Componente: FeedPublico
// Propósito: Exibir feed público com posts de todos os candidatos e empresas
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import flaskClient from '../api/flaskClient'
import PostCard from './PostCard'
import './FeedPublico.css'

export default function FeedPublico() {
  const { user, candidato } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [novoPost, setNovoPost] = useState('')
  const [postando, setPostando] = useState(false)

  // Carregar posts do feed
  useEffect(() => {
    carregarPosts()
  }, [page])

  const carregarPosts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await flaskClient.get(`/api/posts-feed/feed?page=${page}&per_page=10`)
      setPosts(res.data.posts || [])
      setTotalPages(res.data.pages || 1)
      setHasMore(page < (res.data.pages || 1))
    } catch (err) {
      console.error('Erro ao carregar posts:', err)
      setError('Não foi possível carregar os posts')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const criarPost = async (e) => {
    e.preventDefault()
    if (!novoPost.trim()) return

    if (!user) {
      alert('Faça login para publicar')
      return
    }

    setPostando(true)
    try {
      const res = await flaskClient.post('/api/posts-feed/', {
        conteudo: novoPost,
        tipo: 'texto'
      })

      const novoPostData = res.data.post
      setPosts([novoPostData, ...posts])
      setNovoPost('')
      alert('Post publicado com sucesso! ✨')
    } catch (err) {
      console.error('Erro ao publicar post:', err)
      alert('Erro ao publicar post: ' + (err.response?.data?.error || err.message))
    } finally {
      setPostando(false)
    }
  }

  const handlePostUpdate = (postAtualizado) => {
    setPosts(posts.map(p => p.id === postAtualizado.id ? postAtualizado : p))
  }

  return (
    <div className="feed-publico-container">
      <div className="feed-main">
        {/* Seção de Criar Post */}
        {user && (
          <div className="create-post-section">
            <h2>Compartilhe algo com a comunidade</h2>
            <form onSubmit={criarPost} className="create-post-form">
              <div className="post-input-group">
                <img
                  src={candidato?.foto_url || 'https://via.placeholder.com/40'}
                  alt="Você"
                  className="user-avatar"
                />
                <div className="post-input-wrapper">
                  <textarea
                    value={novoPost}
                    onChange={(e) => setNovoPost(e.target.value)}
                    placeholder="No que você está pensando?"
                    maxLength="500"
                    disabled={postando}
                    className="post-textarea"
                  />
                  <div className="form-actions">
                    <span className="char-count">
                      {novoPost.length}/500
                    </span>
                    <button
                      type="submit"
                      disabled={!novoPost.trim() || postando}
                      className="publish-btn"
                    >
                      {postando ? '⏳ Publicando...' : '📤 Publicar'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Feed de Posts */}
        <div className="posts-feed">
          {!user && (
            <div className="login-prompt">
              <p>👋 Faça login para ver posts e interagir com a comunidade</p>
            </div>
          )}

          {loading && page === 1 ? (
            <div className="loading">⏳ Carregando posts...</div>
          ) : error ? (
            <div className="error-message">❌ {error}</div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <p>📭 Nenhum post disponível no momento</p>
              <small>Seja o primeiro a compartilhar algo!</small>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostUpdate={handlePostUpdate}
                  user={user}
                  candidato={candidato}
                />
              ))}
            </>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="pagination-btn"
            >
              ← Anterior
            </button>

            <span className="page-info">
              Página {page} de {totalPages}
            </span>

            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasMore}
              className="pagination-btn"
            >
              Próxima →
            </button>
          </div>
        )}

        {loading && page > 1 && (
          <div className="loading">Carregando mais posts...</div>
        )}
      </div>
    </div>
  )
}
