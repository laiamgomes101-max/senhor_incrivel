require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Importar rotas
const feedRoutes = require('./routes/feedRoutes');
const notificacaoRoutes = require('./routes/notificacaoRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Importar controllers
const notificacaoController = require('./controllers/notificacaoController');
const chatController = require('./controllers/chatController');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';
const PORT = process.env.PORT || 3001;

// Inicializar referência do io nos controllers
notificacaoController.setIO(io);
chatController.setIO(io);

// Mapa de usuários conectados: userId -> socketId
const usuariosConectados = new Map();

// ==================== ROTAS HTTP ====================

// Rotas de Feed (posts + vagas)
app.use('/api/feed', feedRoutes);

// Rotas de Notificações
app.use('/api/notificacoes', notificacaoRoutes);

// Rotas de Chat
app.use('/api/chat', chatRoutes);

// Rota legada de notificação
app.post('/api/notificar', (req, res) => {
  const { userId, tipo, titulo, mensagem, link } = req.body;
  if (!userId || !titulo) {
    return res.status(400).json({ error: 'userId e titulo são obrigatórios' });
  }

  const notificacao = { tipo, titulo, mensagem, link, timestamp: new Date().toISOString() };
  io.to(`user:${userId}`).emit('notificacao', notificacao);
  
  res.json({ ok: true, enviado: true });
});

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    usuarios_conectados: usuariosConectados.size,
    api_flask: FLASK_API_URL
  });
});

// ==================== SOCKET.IO - TEMPO REAL ====================

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Autenticação do usuário
  socket.on('autenticar', (userId) => {
    if (userId) {
      usuariosConectados.set(userId.toString(), socket.id);
      socket.userId = userId;
      socket.join(`user:${userId}`);
      
      notificacaoController.registrarUsuario(userId, socket.id);
      chatController.registrarUsuarioOnline(userId, socket.id);
      
      console.log(`Usuário ${userId} autenticado - Socket ${socket.id}`);
      
      // Notificar outros que este usuário ficou online
      socket.broadcast.emit('usuario_online', { userId, timestamp: new Date() });
    }
  });

  // ========== FEED - Novo post em tempo real ==========
  socket.on('novo_post', (post) => {
    console.log('Novo post:', post);
    io.emit('feed_atualizado', { ...post, timestamp: new Date() });
  });

  // ========== NOTIFICAÇÕES - Receber notificações ==========
  socket.on('notificacao_confirmada', (notificacaoId) => {
    console.log(`Notificação ${notificacaoId} confirmada`);
  });

  // ========== CHAT - Mensagens em tempo real ==========

  // Entrar em uma sala de conversa
  socket.on('entrar_conversa', (roomId) => {
    socket.join(roomId);
    console.log(`Usuário ${socket.userId} entrou na conversa ${roomId}`);
    io.to(roomId).emit('usuario_entrou', { userId: socket.userId, timestamp: new Date() });
  });

  // Sair de uma sala de conversa
  socket.on('sair_conversa', (roomId) => {
    socket.leave(roomId);
    console.log(`Usuário ${socket.userId} saiu da conversa ${roomId}`);
    io.to(roomId).emit('usuario_saiu', { userId: socket.userId, timestamp: new Date() });
  });

  // Enviar mensagem em conversa
  socket.on('enviar_mensagem', (data) => {
    const { roomId, usuarioId, mensagem } = data;
    
    if (!roomId || !usuarioId || !mensagem) {
      socket.emit('erro', { mensagem: 'Dados inválidos' });
      return;
    }

    const msgData = {
      usuarioId,
      mensagem,
      timestamp: new Date()
    };

    // Registrar mensagem no controller
    chatController.registrarMensagem(roomId, usuarioId, mensagem);

    // Emitir para todos na sala
    io.to(roomId).emit('nova_mensagem', { roomId, ...msgData });
    console.log(`Mensagem em ${roomId} de ${usuarioId}: ${mensagem}`);
  });

  // Indicador de digitação
  socket.on('digitando', (data) => {
    const { roomId, usuarioId } = data;
    socket.broadcast.to(roomId).emit('usuario_digitando', { usuarioId, timestamp: new Date() });
  });

  // Parar de digitar
  socket.on('parou_digitando', (data) => {
    const { roomId, usuarioId } = data;
    socket.broadcast.to(roomId).emit('usuario_parou_digitando', { usuarioId });
  });

  // ========== DESCONEXÃO ==========
  socket.on('disconnect', () => {
    if (socket.userId) {
      usuariosConectados.delete(socket.userId.toString());
      chatController.removerUsuarioOnline(socket.userId);
      
      // Notificar outros que este usuário ficou offline
      io.emit('usuario_offline', { userId: socket.userId, timestamp: new Date() });
      console.log(`Usuário ${socket.userId} desconectado`);
    }
    console.log('Cliente desconectado:', socket.id);
  });

  // Tratamento de erros
  socket.on('error', (error) => {
    console.error('Erro no socket:', error);
  });
});

// ==================== SERVIDOR ===================

server.listen(PORT, () => {
  console.log(`\n🚀 Node API rodando na porta ${PORT}`);
  console.log(`📡 WebSocket disponível para feed em tempo real`);
  console.log(`🔗 API Flask: ${FLASK_API_URL}`);
  console.log(`\nRotas disponíveis:`);
  console.log(`  - GET/POST  /api/feed`);
  console.log(`  - POST      /api/notificacoes`);
  console.log(`  - POST      /api/chat`);
  console.log(`  - GET       /health\n`);
});
