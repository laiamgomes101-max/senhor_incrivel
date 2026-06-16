
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import pool from './database.js';


import authRoutes from './routes/auth.js';
import vagasRoutes from './routes/vagas.js';
import postsRoutes from './routes/posts.js';
import curriculosRoutes from './routes/curriculos.js';
import candidaturasRoutes from './routes/candidaturas.js';
import curriculoAnalysisRoutes from './routes/curriculoAnalysisRoutes.js';
import notificacoesRoutes from './routes/notificacoes.js';
import chatRoutes from './routes/chatRoutes.js';

import { register, metricsMiddleware, metrics } from './utils/metrics.js';
import logger from './utils/logger.js';
import { businessMetrics } from './utils/businessMetrics.js';
import { analyzeWithAI } from './utils/ia.js';
import * as chatController from './controllers/chatController.js';
import { errorHandler } from './middleware/auth.js';


import {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  iaLimiter,
  vagaLimiter,
  candidaturaLimiter
} from './middleware/rateLimiter.js';


import { 
  cacheMiddleware, 
  getCacheStats, 
  isRedisConnected,
  userProfileCache,
  vagasCache,
  curriculosCache,
  iaResultsCache
} from './utils/cache.js';


dotenv.config();


const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:8000',
      'http://127.0.0.1:8000',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});



app.use(metricsMiddleware);
app.use(logger.middleware);

app.use(cacheMiddleware());

app.use(generalLimiter);


const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3001'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-Cache']
}));
app.use(express.json());


app.get('/', (req, res) => {
  try {
    logger.api_request('GET', '/', 200);
    res.json({
      message: 'Servidor Node.js Completo rodando!',
      status: 'ok',
      version: '1.0'
    });
  } catch (error) {
    logger.error('Erro na rota principal', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Erro ao gerar métricas', { error: error.message });
    res.status(500).json({ error: 'Erro ao gerar métricas' });
  }
});

app.get('/test', (req, res) => {
  res.json({ test: 'Conexão Node.js funcionando!' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/vagas', vagaLimiter, vagasRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/curriculos', uploadLimiter, curriculosRoutes);
app.use('/api/candidaturas', candidaturaLimiter, candidaturasRoutes);
app.use('/api/curriculo-analysis', candidaturaLimiter, curriculoAnalysisRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/chat', chatRoutes);

app.use(errorHandler);

app.post('/api/ia/analyze', iaLimiter, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Texto é obrigatório' });
    }

    const analysisResult = await analyzeWithAI(text);
    res.json(analysisResult);
  } catch (error) {
    logger.error('Erro na análise IA', { error: error.message });
    res.status(500).json({ error: 'Erro na análise IA' });
  }
});


io.on('connection', (socket) => {
  logger.info('Cliente conectado', { socketId: socket.id });

  socket.on('join:user', (userId) => {
    socket.join(`user:${userId}`);
    socket.data.userId = userId;
    chatController.registerUserOnline(userId, socket.id);
    logger.info('Usuário entrou na sala', { userId, socketId: socket.id });
  });

  socket.on('join_room', ({ roomId, userId }) => {
    if (!roomId) return;
    socket.join(`room:${roomId}`);
    socket.data.userId = userId;
    logger.info('Entrou na sala de chat', { roomId, userId, socketId: socket.id });
  });

  socket.on('leave_room', ({ roomId }) => {
    if (!roomId) return;
    socket.leave(`room:${roomId}`);
    logger.info('Saiu da sala de chat', { roomId, socketId: socket.id });
  });

  socket.on('chat_message', async (payload) => {
    try {
      const { roomId, senderId, recipientId, content, messageType } = payload;
      if (!roomId || !senderId || !recipientId || !content) return;
      const message = await chatController.saveMessage(roomId, senderId, recipientId, content, messageType || 'text');
      io.to(`room:${roomId}`).emit('new_message', message);
    } catch (error) {
      logger.error('Erro ao processar mensagem de chat', { error: error.message });
    }
  });

  socket.on('mark_read', async ({ roomId, userId }) => {
    try {
      if (!roomId || !userId) return;
      await chatController.markMessagesReadInternal(roomId, userId);
      io.to(`room:${roomId}`).emit('messages_read', { roomId, userId });
    } catch (error) {
      logger.error('Erro ao marcar mensagens como lidas', { error: error.message });
    }
  });

  socket.on('join:feed', () => {
    socket.join('feed');
    logger.info('Usuário entrou no feed', { socketId: socket.id });
  });

  socket.on('disconnect', () => {
    chatController.removeUserOnline(socket.data.userId);
    logger.info('Cliente desconectado', { socketId: socket.id, userId: socket.data.userId });
  });
});


const PORT = process.env.PORT || 3001;

server.on('error', (error) => {
  logger.error('Server error', { error: error.message, stack: error.stack });
  if (error.code === 'EADDRINUSE') {
    console.error(`Porta ${PORT} já está em uso. Finalize o processo existente ou altere o PORT.`);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

server.listen(PORT, () => {
  logger.info(`Servidor Node.js rodando na porta ${PORT}`);
  logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});