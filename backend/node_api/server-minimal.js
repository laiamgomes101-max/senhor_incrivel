import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// In-memory store
const posts = [
  {
    id: 'post-1',
    autor: { id: 'user-1', nome: 'João Silva', tipo: 'candidato' },
    conteudo: 'Olá! Começando a procurar por novas oportunidades 🚀',
    timestamp: new Date().toISOString(),
    likes: 5,
    comentarios: []
  },
  {
    id: 'post-2',
    autor: { id: 'company-1', nome: 'Tech Company', tipo: 'empresa' },
    conteudo: 'Contratamos! Full Stack React + Node.js 💼',
    timestamp: new Date().toISOString(),
    likes: 12,
    comentarios: []
  }
];

// In-memory notifications
const notifications = [];

// Socket.IO (optional realtime)
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  socket.on('autenticar', (userId) => {
    socket.join(`user:${userId}`);
  });
});

function createNotification({ user_id, titulo, mensagem, tipo = 'info', referencia_tipo = null, referencia_id = null }) {
  const n = {
    id: `notif-${Date.now()}-${Math.floor(Math.random()*1000)}`,
    user_id,
    titulo,
    mensagem,
    tipo,
    referencia_tipo,
    referencia_id,
    lida: false,
    created_at: new Date().toISOString()
  };
  notifications.push(n);
  // emit realtime if user connected
  try {
    if (user_id) {
      io.to(`user:${user_id}`).emit('notificacao', n);
    }
    io.emit('notificacao:all', n);
  } catch (err) {
    console.warn('Socket emit falhou:', err.message);
  }
  return n;
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Server minimal Node.js running!', status: 'ok' });
});

app.get('/test', (req, res) => {
  res.json({ test: 'Conexão Node.js funcionando!' });
});

app.get('/api/posts', (req, res) => {
  res.json({ posts });
});

app.post('/api/posts', (req, res) => {
  const { conteudo, autor_id, autor_nome, autor_tipo } = req.body;
  
  if (!conteudo || !conteudo.trim()) {
    return res.status(400).json({ error: 'Conteúdo é obrigatório' });
  }

  const newPost = {
    id: `post-${Date.now()}`,
    autor: {
      id: autor_id || 'anonymous',
      nome: autor_nome || 'Usuário',
      tipo: autor_tipo || 'candidato'
    },
    conteudo: conteudo.trim(),
    timestamp: new Date().toISOString(),
    likes: 0,
    comentarios: []
  };

  posts.push(newPost);
  res.status(201).json({ post: newPost, message: 'Post criado com sucesso' });
});

app.get('/api/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  
  if (!post) {
    return res.status(404).json({ error: 'Post não encontrado' });
  }

  res.json({ post });
});

app.delete('/api/posts/:id', (req, res) => {
  const index = posts.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Post não encontrado' });
  }

  posts.splice(index, 1);
  res.json({ message: 'Post deletado com sucesso' });
});

app.post('/api/posts/:id/like', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  
  if (!post) {
    return res.status(404).json({ error: 'Post não encontrado' });
  }

  post.likes = (post.likes || 0) + 1;
  // criar notificação para o dono do post
  try {
    const actorName = req.body?.autor_nome || 'Alguém';
    createNotification({
      user_id: post.autor?.id || null,
      titulo: 'Seu post recebeu um like',
      mensagem: `${actorName} curtiu seu post.`,
      tipo: 'like',
      referencia_tipo: 'post',
      referencia_id: post.id
    });
  } catch (err) {
    console.warn('Falha ao criar notificação:', err.message);
  }

  res.json({ post, message: 'Like adicionado' });
});

app.post('/api/posts/:id/comentario', (req, res) => {
  const { conteudo, autor_id, autor_nome, autor_tipo } = req.body;
  const post = posts.find(p => p.id === req.params.id);
  
  if (!post) {
    return res.status(404).json({ error: 'Post não encontrado' });
  }

  if (!conteudo || !conteudo.trim()) {
    return res.status(400).json({ error: 'Conteúdo do comentário é obrigatório' });
  }

  const comentario = {
    id: `comment-${Date.now()}`,
    conteudo: conteudo.trim(),
    autor: {
      id: autor_id || 'anonymous',
      nome: autor_nome || 'Usuário',
      tipo: autor_tipo || 'candidato'
    },
    created_at: new Date().toISOString()
  };

  post.comentarios = post.comentarios || [];
  post.comentarios.push(comentario);

  // notificar dono do post
  try {
    const actorName = comentario.autor?.nome || 'Alguém';
    createNotification({
      user_id: post.autor?.id || null,
      titulo: 'Novo comentário no seu post',
      mensagem: `${actorName} comentou: "${(comentario.conteudo||'').slice(0,80)}"`,
      tipo: 'comentario',
      referencia_tipo: 'post',
      referencia_id: post.id
    });
  } catch (err) {
    console.warn('Falha ao criar notificação:', err.message);
  }

  res.status(201).json({ post, comentario, message: 'Comentário adicionado' });
});

app.post('/api/posts/:postId/comentario/:commentId/like', (req, res) => {
  const post = posts.find(p => p.id === req.params.postId)
  if (!post) return res.status(404).json({ error: 'Post não encontrado' })

  const comment = (post.comentarios || []).find(c => c.id === req.params.commentId)
  if (!comment) return res.status(404).json({ error: 'Comentário não encontrado' })

  comment.likes = (comment.likes || 0) + 1

  try {
    const actorName = req.body?.autor_nome || 'Alguém'
    createNotification({
      user_id: comment.autor?.id || null,
      titulo: 'Seu comentário recebeu um like',
      mensagem: `${actorName} curtiu seu comentário.`,
      tipo: 'like',
      referencia_tipo: 'comentario',
      referencia_id: comment.id
    })
  } catch (err) {
    console.warn('Falha ao criar notificação para like de comentário:', err.message)
  }

  res.json({ post, comment, message: 'Like no comentário adicionado' })
})

// Notificações endpoints
app.get('/api/notificacoes', (req, res) => {
  const user_id = req.query.user_id;
  if (!user_id) return res.status(400).json({ error: 'user_id é obrigatório como query param' });
  const userNotifs = notifications.filter(n => String(n.user_id) === String(user_id)).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ notificacoes: userNotifs });
});

app.get('/api/notificacoes/count', (req, res) => {
  const user_id = req.query.user_id;
  if (!user_id) return res.status(400).json({ error: 'user_id é obrigatório como query param' });
  const count = notifications.filter(n => String(n.user_id) === String(user_id) && !n.lida).length;
  res.json({ unread_count: count });
});

app.post('/api/notificacoes/:id/mark-read', (req, res) => {
  const id = req.params.id;
  const n = notifications.find(x => x.id === id);
  if (!n) return res.status(404).json({ error: 'Notificação não encontrada' });
  n.lida = true;
  res.json({ data: n });
});

// compatibility endpoint used by frontend
app.get('/api/notificacoes/unread', (req, res) => {
  const user_id = req.query.user_id || req.headers['x-user-id'] || null;
  if (!user_id) return res.json({ data: [] });
  const userNotifs = notifications.filter(n => String(n.user_id) === String(user_id) && !n.lida).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  return res.json({ data: userNotifs });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server (use http server so Socket.IO works)
server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Minimal Node server running on http://127.0.0.1:${PORT}`);
  console.log(`📍 Base URL: http://127.0.0.1:${PORT}/api`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /api/posts         - Listar posts`);
  console.log(`  POST /api/posts         - Criar post`);
  console.log(`  GET  /api/posts/:id     - Obter post`);
  console.log(`  POST /api/posts/:id/like - Like em post`);
  console.log(`  POST /api/posts/:id/comentario - Comentar`);
});
