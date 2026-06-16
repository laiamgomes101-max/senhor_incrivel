// Componente: PostCard
// Propósito: Exibir um post individual com opções de curtida e comentários
import { useState } from 'react'
import api from '../api/client'
import flaskClient from '../api/flaskClient'
import './PostCard.css'

export default function PostCard({ post, onPostUpdate, user, candidato }) {
  const [isCommentingOpen, setIsCommentingOpen] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [userLiked, setUserLiked] = useState(post.usuario_curtiu || false)
  const [totalLikes, setTotalLikes] = useState(post.curtidas || 0)

  const autor = post.autor || {}
  const dataFormatada = new Date(post.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const toggleLike = async () => {
    if (!user) {
      alert('Faça login para curtir posts')
      return
    }

    setIsLiking(true)
    try {
      if (userLiked) {
        await flaskClient.post(`/api/posts-feed/${post.id}/descurtir`)
        setTotalLikes(totalLikes - 1)
        setUserLiked(false)
      } else {
        await flaskClient.post(`/api/posts-feed/${post.id}/curtir`)
        setTotalLikes(totalLikes + 1)
        setUserLiked(true)
      }
    } catch (err) {
      console.error('Erro ao curtir/descurtir:', err)
      alert('Erro ao processar curtida')
    } finally {
      setIsLiking(false)
    }
  }

  const loadComments = async () => {
    if (showComments) {
      setShowComments(false)
      return
    }

    setLoadingComments(true)
    try {
      const res = await flaskClient.get(`/api/posts-feed/${post.id}/comentarios`)
      setComments(res.data.comentarios || [])
      setShowComments(true)
    } catch (err) {
      console.error('Erro ao carregar comentários:', err)
      alert('Erro ao carregar comentários')
    } finally {
      setLoadingComments(false)
    }
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    if (!user) {
      alert('Faça login para comentar')
      return
    }

    try {
      const res = await flaskClient.post(`/api/posts-feed/${post.id}/comentarios`, {
        conteudo: commentText
      })

      const newComment = res.data.comentario
      setComments([newComment, ...comments])
      setCommentText('')
      setIsCommentingOpen(false)
    } catch (err) {
      console.error('Erro ao comentar:', err)
      alert('Erro ao adicionar comentário')
    }
  }

  return (
    <div className="post-card">
      {/* Cabeçalho do Post */}
      <div className="post-header">
        <div className="post-author">
          <img
            src={autor.foto || 'https://via.placeholder.com/48'}
            alt={autor.nome}
            className="author-avatar"
          />
          <div className="author-info">
            <h4>{autor.nome}</h4>
            <p className="author-type">
              {autor.tipo === 'candidato' ? '👤 Candidato' : '🏢 Empresa'}
            </p>
            <span className="post-date">{dataFormatada}</span>
          </div>
        </div>
      </div>

      {/* Conteúdo do Post */}
      <div className="post-content">
        <p>{post.conteudo}</p>
      </div>

      {/* Estatísticas */}
      <div className="post-stats">
        <span className="stat">❤️ {totalLikes} curtida{totalLikes !== 1 ? 's' : ''}</span>
        <span className="stat">💬 {post.comentarios} comentário{post.comentarios !== 1 ? 's' : ''}</span>
      </div>

      {/* Ações */}
      <div className="post-actions">
        <button
          className={`action-button ${userLiked ? 'liked' : ''}`}
          onClick={toggleLike}
          disabled={isLiking}
        >
          {userLiked ? '❤️' : '🤍'} {userLiked ? 'Curtido' : 'Curtir'}
        </button>

        <button className="action-button" onClick={() => setIsCommentingOpen(!isCommentingOpen)}>
          💬 Comentar
        </button>
      </div>

      {/* Seção de Comentário */}
      {isCommentingOpen && (
        <form className="comment-form" onSubmit={submitComment}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Escreva um comentário..."
            maxLength="500"
          />
          <div className="form-buttons">
            <button type="submit" disabled={!commentText.trim()}>
              Publicar
            </button>
            <button type="button" onClick={() => setIsCommentingOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de Comentários */}
      <button className="show-comments-btn" onClick={loadComments}>
        {loadingComments ? '⏳ Carregando...' : showComments ? '🔼 Ocultar comentários' : '🔽 Ver comentários'}
      </button>

      {showComments && comments.length > 0 && (
        <div className="comments-section">
          {comments.map((comment) => (
            <div key={comment.id} className="comment">
              <div className="comment-author">
                <img
                  src={comment.autor.foto || 'https://via.placeholder.com/32'}
                  alt={comment.autor.nome}
                  className="comment-avatar"
                />
                <div>
                  <strong>{comment.autor.nome}</strong>
                  <p className="comment-type">
                    {comment.autor.tipo === 'candidato' ? '👤' : '🏢'}
                  </p>
                </div>
              </div>
              <p className="comment-text">{comment.conteudo}</p>
              <div className="comment-meta">
                <small>{new Date(comment.created_at).toLocaleDateString('pt-BR')}</small>
                <span className="comment-likes">❤️ {comment.curtidas}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
