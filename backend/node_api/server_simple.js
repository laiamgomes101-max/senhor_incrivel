
// Servidor Node.js com Express e WebSocket (Socket.IO)
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
import notificacoesRoutes from './routes/notificacoes.js';


import { register, metricsMiddleware, metrics } from './utils/metrics.js';
import logger from './utils/logger.js';
import { businessMetrics } from './utils/businessMetrics.js';


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

// Cria a aplicação Express e o servidor HTTP
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


// Middleware de métricas e logs para monitorar as requisições
app.use(metricsMiddleware);
app.use(logger.middleware);

// Middleware de cache para melhorar desempenho
app.use(cacheMiddleware);

// Limite de requisições para evitar abuso e ataques de força bruta
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

// Rota principal para verificação do servidor
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
app.use('/api/notificacoes', notificacoesRoutes);


app.post('/api/ia