




import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';


dotenv.config();


const app = express();


const server = createServer(app);


app.use(cors());
app.use(express.json());


const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: {
    error: 'Too many requests',
    message: 'Muitas requisições. Tente novamente em 15 minutos.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log('Rate limit exceeded for IP:', req.ip);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Muitas requisições. Tente novamente em 15 minutos.',
      retryAfter: 900
    });
  }
});


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 3, 
  message: {
    error: 'Too many auth attempts',
    message: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body?.email || 'anonymous';
    return `${req.ip}:${email}`;
  },
  handler: (req, res) => {
    console.log('Auth rate limit exceeded for IP:', req.ip, 'email:', req.body?.email);
    res.status(429).json({
      error: 'Too many auth attempts',
      message: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
      retryAfter: 900
    });
  }
});



app.get('/', (req, res) => {
  res.json({
    message: 'Servidor Node.js com Rate Limiting rodando!',
    status: 'ok',
    version: '1.0'
  });
});


app.get('/free', (req, res) => {
  res.json({ message: 'Rota livre de rate limiting' });
});


app.get('/limited', generalLimiter, (req, res) => {
  res.json({ message: 'Rota com rate limiting geral' });
});


app.post('/api/auth/login', authLimiter, (req, res) => {
  const { email, password } = req.body;


  if (email === 'test@example.com' && password === 'password') {
    res.json({ 
      success: true, 
      message: 'Login successful',
      token: 'fake-jwt-token'
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid credentials' 
    });
  }
});


app.get('/api/rate-limit-status', (req, res) => {
  res.json({
    generalLimiter: {
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: '10 requisições por 15 minutos'
    },
    authLimiter: {
      windowMs: 15 * 60 * 1000,
      max: 3,
      message: '3 tentativas de login por 15 minutos'
    }
  });
});



const PORT = process.env.PORT || 3004;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Node.js com Rate Limiting rodando na porta ${PORT}`);
  console.log('Endpoints disponíveis:');
  console.log('  GET  /           - Rota livre');
  console.log('  GET  /free       - Rota sem rate limiting');
  console.log('  GET  /limited    - Rota com rate limiting (10 req/15min)');
  console.log('  POST /api/auth/login - Rota com auth rate limiting (3 req/15min)');
  console.log('  GET  /api/rate-limit-status - Status dos limiters');
});