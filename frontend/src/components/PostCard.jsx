// Componente: PostCard
// Propósito: Exibir um post individual com opções de curtida e comentários
import { useState } from 'react'
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
  const [commentCount, setCommentCount] = useState(post.comentarios || 0)
  const [replyText, setReplyText] = useState({})
  const [replyOpen, setReplyOpen] = useState({})

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
      const loadedComments = res.data.comentarios || []
      setComments(loadedComments)
      setCommentCount(loadedComments.length)
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
      setCommentCount((prev) => {
        const updatedCount = prev + 1
        if (onPostUpdate) onPostUpdate({ ...post, comentarios: updatedCount })
        return updatedCount
      })
    } catch (err) {
      console.error('Erro ao comentar:', err)
      alert('Erro ao adicionar comentário')
    }
  }

  const submitReply = async (commentId, e) => {
    e.preventDefault()
    const reply = (replyText[commentId] || '').trim()
    if (!reply) return
    if (!user) {
      alert('Faça login para responder')
      return
    }

    try {
      const res = await flaskClient.post(`/api/posts-feed/comentarios/${commentId}/responder`, {
        conteudo: reply
      })

      const newReply = res.data.resposta
      setComments((prevComments) => prevComments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            respostas: [newReply, ...(comment.respostas || [])]
          }
        }
        if (comment.respostas?.length) {
          return {
            ...comment,
            respostas: comment.respostas.map((subComment) => {
              if (subComment.id === commentId) {
                return {
                  ...subComment,
                  respostas: [newReply, ...(subComment.respostas || [])]
                }
              }
              return subComment
            })
          }
        }
        return comment
      }))
      setReplyText((prev) => ({ ...prev, [commentId]: '' }))
      setReplyOpen((prev) => ({ ...prev, [commentId]: false }))
    } catch (err) {
      console.error('Erro ao responder comentário:', err)
      alert('Erro ao adicionar resposta')
    }
  }

  const toggleReplyForm = (commentId) => {
    setReplyOpen((prev) => ({ ...prev, [commentId]: !prev[commentId] }))
  }

  const renderComment = (comment, depth = 0) => (
    <div key={comment.id} className={`comment ${depth > 0 ? 'nested-comment' : ''}`}>
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
      {user && (
        <div className="comment-actions">
          <button
            type="button"
            className="reply-button"
            onClick={() => toggleReplyForm(comment.id)}
          >
            {replyOpen[comment.id] ? 'Cancelar' : 'Responder'}
          </button>
        </div>
      )}
      {replyOpen[comment.id] && (
        <form className="comment-reply-form" onSubmit={(e) => submitReply(comment.id, e)}>
          <textarea
            value={replyText[comment.id] || ''}
            onChange={(e) => setReplyText((prev) => ({ ...prev, [comment.id]: e.target.value }))}
            placeholder="Escreva uma resposta..."
            maxLength="500"
          />
          <div className="form-buttons">
            <button type="submit" disabled={!replyText[comment.id]?.trim()}>
              Responder
            </button>
          </div>
        </form>
      )}
      {comment.respostas?.length > 0 && (
        <div className="comment-replies">
          {comment.respostas.map((reply) => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  )

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
        <span className="stat">💬 {commentCount} comentário{commentCount !== 1 ? 's' : ''}</span>
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

      {showComments && (
        <div className="comments-section">
          {comments.length > 0 ? (
            comments.map((comment) => renderComment(comment))
          ) : (
            <p className="no-comments">Seja o primeiro a comentar nesta publicação.</p>
          )}
        </div>
      )}
    </div>
  )
}
