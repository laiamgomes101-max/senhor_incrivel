import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import notificacaoService from '../services/notificacaoService.js'

const router = express.Router()


const posts = new Map()


posts.set('dummy-1', {
  id: 'dummy-1',
  autor: { id: 'user-1', nome: 'João Silva', tipo: 'candidato' },
  conteudo: 'Olá pessoal! Comecei a procurar por um novo desafio profissional 🚀',
  timestamp: new Date(Date.now() - 3600000).toISOString(),
  likes: 5,
  comentarios: []
})

posts.set('dummy-2', {
  id: 'dummy-2',
  autor: { id: 'user-2', nome: 'Tech Empresa', tipo: 'empresa' },
  conteudo: 'Estamos contratando! Procuramos desenvolvedores Full Stack com experiência em React e Node.js 💼',
  timestamp: new Date(Date.now() - 7200000).toISOString(),
  likes: 12,
  comentarios: []
})


router.get('/', (req, res) => {
  try {
    const postsList = Array.from(posts.values()).sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )
    res.json({ posts: postsList })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})


router.post('/', (req, res) => {
  try {
    const { conteudo, autor_id, autor_nome, autor_tipo } = req.body

    if (!conteudo || !conteudo.trim()) {
      return res.status(400).json({ erro: 'Conteúdo ne não pode estar vazio' })
    }

    const novoPost = {
      id: uuidv4(),
      autor: {
        id: autor_id || 'anonimo',
        nome: autor_nome || 'Usuário',
        tipo: autor_tipo || 'candidato'
      },
      conteudo: conteudo.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      comentarios: []
    }

    posts.set(novoPost.id, novoPost)
    res.status(201).json({ post: novoPost, message: 'Post criado com sucesso' })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})


router.get('/:id', (req, res) => {
  try {
    const post = posts.get(req.params.id)
    if (!post) {
      return res.status(404).json({ erro: 'Post não encontrado' })
    }
    res.json({ post })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})


router.delete('/:id', (req, res) => {
  try {
    if (!posts.has(req.params.id)) {
      return res.status(404).json({ erro: 'Post não encontrado' })
    }
    posts.delete(req.params.id)
    res.json({ message: 'Post deletado com sucesso' })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})


router.post('/:id/like', async (req, res) => {
  try {
    const post = posts.get(req.params.id)
    if (!post) {
      return res.status(404).json({ erro: 'Post não encontrado' })
    }

    const { autor_id, autor_nome, autor_tipo } = req.body
    post.likes = (post.likes || 0) + 1

    if (post.autor?.id && post.autor.id !== 'anonimo') {
      try {
        await notificacaoService.createNotificacao({
          usuario_id: post.autor.id,
          tipo: 'info',
          titulo: 'Seu post recebeu um like',
          mensagem: `${autor_nome || 'Alguém'} curtiu seu post.`,
          dados_adicionais: { post_id: post.id },
          lida: false
        })
      } catch (notifyError) {
        console.error('Erro ao criar notificação de like:', notifyError)
      }
    }

    res.json({ post, message: 'Like adicionado' })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

router.post('/:id/comentario', async (req, res) => {
  try {
    const post = posts.get(req.params.id)
    if (!post) {
      return res.status(404).json({ erro: 'Post não encontrado' })
    }

    const { conteudo, autor_id, autor_nome, autor_tipo } = req.body
    if (!conteudo || !conteudo.trim()) {
      return res.status(400).json({ erro: 'Conteúdo do comentário é obrigatório' })
    }

    const comentario = {
      id: uuidv4(),
      conteudo: conteudo.trim(),
      autor: {
        id: autor_id || 'anonimo',
        nome: autor_nome || 'Usuário',
        tipo: autor_tipo || 'candidato'
      },
      created_at: new Date().toISOString()
    }

    post.comentarios = post.comentarios || []
    post.comentarios.push(comentario)

    if (post.autor?.id && post.autor.id !== 'anonimo') {
      try {
        await notificacaoService.createNotificacao({
          usuario_id: post.autor.id,
          tipo: 'info',
          titulo: 'Novo comentário no seu post',
          mensagem: `${autor_nome || 'Alguém'} comentou no seu post: "${conteudo.trim().slice(0, 100)}"`,
          dados_adicionais: { post_id: post.id, comentario_id: comentario.id },
          lida: false
        })
      } catch (notifyError) {
        console.error('Erro ao criar notificação de comentário:', notifyError)
      }
    }

    res.status(201).json({ post, comentario, message: 'Comentário adicionado' })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// Like a comment
router.post('/:postId/comentario/:commentId/like', async (req, res) => {
  try {
    const post = posts.get(req.params.postId)
    if (!post) return res.status(404).json({ erro: 'Post não encontrado' })

    const comment = (post.comentarios || []).find(c => c.id === req.params.commentId)
    if (!comment) return res.status(404).json({ erro: 'Comentário não encontrado' })

    comment.likes = (comment.likes || 0) + 1

    // notify comment author if present
    try {
      const actorName = req.body?.autor_nome || 'Alguém'
      if (comment.autor?.id && comment.autor.id !== 'anonimo') {
        await notificacaoService.createNotificacao({
          usuario_id: comment.autor.id,
          tipo: 'info',
          titulo: 'Seu comentário recebeu um like',
          mensagem: `${actorName} curtiu seu comentário.`,
          dados_adicionais: { post_id: post.id, comentario_id: comment.id },
          lida: false
        })
      }
    } catch (notifyErr) {
      console.error('Erro ao notificar like de comentário:', notifyErr)
    }

    res.json({ post, comment, message: 'Like no comentário adicionado' })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

export default router