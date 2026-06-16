




// Limitação de taxa de requisições para proteger a API de abusos
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import logger from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';


let redisClient = null;


async function initRedis() {
  try {
    if (process.env.REDIS_URL) {
      redisClient = createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();
      logger.info('Redis conectado para rate limiting');
    } else {
      logger.info('Redis não configurado, usando rate limiting em memória');
      redisClient = null;
    }
  } catch (error) {
    logger.warn('Failed to connect to Redis, using memory store:', { error: error.message });
    redisClient = null;
  }
}





const WINDOW_MS = 15 * 60 * 1000; 
const MAX_REQUESTS = 100; 


const generalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  message: {
    error: 'Too many requests',
    message: 'Muitas requisições. Tente novamente em 15 minutos.',
    retryAfter: WINDOW_MS / 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  handler: (req, res) => {
    logger.security('rate_limit_exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method
    });

    metrics.authenticationAttempts.labels('rate_limit_exceeded', req.method).inc();

    res.status(429).json({
      error: 'Too many requests',
      message: 'Muitas requisições. Tente novamente em 15 minutos.',
      retryAfter: WINDOW_MS / 1000
    });
  }
});


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: {
    error: 'Too many auth attempts',
    message: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  keyGenerator: (req) => {

    const email = req.body?.email || req.body?.username || '';
    const ipKey = ipKeyGenerator(req);
    return `${ipKey}:${email}`;
  },
  handler: (req, res) => {
    logger.security('auth_rate_limit_exceeded', {
      ip: req.ip,
      email: req.body?.email || req.body?.username,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });

    metrics.authenticationAttempts.labels('auth_rate_limit_exceeded', req.method).inc();

    res.status(429).json({
      error: 'Too many auth attempts',
      message: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
      retryAfter: 900
    });
  }
});


const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: {
    error: 'Too many uploads',
    message: 'Limite de uploads atingido. Tente novamente em 1 hora.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  keyGenerator: (req) => {

    const userId = req.user?.id || 'anonymous';
    const ipKey = ipKeyGenerator(req);
    return `${ipKey}:${userId}:upload`;
  },
  handler: (req, res) => {
    logger.security('upload_rate_limit_exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });

    res.status(429).json({
      error: 'Too many uploads',
      message: 'Limite de uploads atingido. Tente novamente em 1 hora.',
      retryAfter: 3600
    });
  }
});


const iaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 50, 
  message: {
    error: 'Too many IA requests',
    message: 'Limite de processamento IA atingido. Tente novamente em 1 hora.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  keyGenerator: (req) => {

    const userId = req.user?.id || 'anonymous';
    const ipKey = ipKeyGenerator(req);
    return `${ipKey}:${userId}:ia`;
  },
  handler: (req, res) => {
    logger.security('ia_rate_limit_exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });

    res.status(429).json({
      error: 'Too many IA requests',
      message: 'Limite de processamento IA atingido. Tente novamente em 1 hora.',
      retryAfter: 3600
    });
  }
});


const vagaLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, 
  max: 5, 
  message: {
    error: 'Too many job postings',
    message: 'Limite de vagas diárias atingido. Tente novamente amanhã.',
    retryAfter: 86400
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  keyGenerator: (req) => {

    const empresaId = req.user?.empresa_id || req.user?.id || 'anonymous';
    const ipKey = ipKeyGenerator(req);
    return `${ipKey}:${empresaId}:vaga`;
  },
  handler: (req, res) => {
    logger.security('vaga_rate_limit_exceeded', {
      ip: req.ip,
      empresaId: req.user?.empresa_id || req.user?.id,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });

    res.status(429).json({
      error: 'Too many job postings',
      message: 'Limite de vagas diárias atingido. Tente novamente amanhã.',
      retryAfter: 86400
    });
  }
});


const candidaturaLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, 
  max: 20, 
  message: {
    error: 'Too many applications',
    message: 'Limite de candidaturas diárias atingido. Tente novamente amanhã.',
    retryAfter: 86400
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  keyGenerator: (req) => {

    const candidatoId = req.user?.candidato_id || req.user?.id || 'anonymous';
    const ipKey = ipKeyGenerator(req);
    return `${ipKey}:${candidatoId}:candidatura`;
  },
  handler: (req, res) => {
    logger.security('candidatura_rate_limit_exceeded', {
      ip: req.ip,
      candidatoId: req.user?.candidato_id || req.user?.id,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });

    res.status(429).json({
      error: 'Too many applications',
      message: 'Limite de candidaturas diárias atingido. Tente novamente amanhã.',
      retryAfter: 86400
    });
  }
});


const wsLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  message: {
    error: 'Too many WebSocket connections',
    message: 'Muitas conexões WebSocket. Tente novamente em 1 minuto.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  keyGenerator: (req) => {
    const ipKey = ipKeyGenerator(req);
    return `${ipKey}:ws`;
  },
  handler: (req, res) => {
    logger.security('ws_rate_limit_exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(429).json({
      error: 'Too many WebSocket connections',
      message: 'Muitas conexões WebSocket. Tente novamente em 1 minuto.',
      retryAfter: 60
    });
  }
});


const suspiciousActivityDetector = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip;


  const suspiciousAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /go-http/i
  ];

  const isSuspiciousAgent = suspiciousAgents.some(regex => regex.test(userAgent));


  const requestCount = parseInt(req.headers['x-request-count'] || '0');

  if (isSuspiciousAgent || requestCount > 50) {
    logger.security('suspicious_activity_detected', {
      ip,
      userAgent,
      endpoint: req.path,
      method: req.method,
      requestCount,
      isSuspiciousAgent
    });


    return strictLimiter(req, res, next);
  }

  next();
};


const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: {
    error: 'Suspicious activity detected',
    message: 'Atividade suspeita detectada. Acesso temporariamente limitado.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  handler: (req, res) => {
    logger.security('strict_rate_limit_triggered', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method
    });

    res.status(429).json({
      error: 'Suspicious activity detected',
      message: 'Atividade suspeita detectada. Acesso temporariamente limitado.',
      retryAfter: 900
    });
  }
});


const whitelist = ['127.0.0.1', '::1', 'localhost'];

const whitelistMiddleware = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  if (whitelist.includes(clientIP)) {
    logger.debug('Whitelisted IP bypassed rate limiting', { ip: clientIP });
    return next();
  }

  next();
};


export {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  iaLimiter,
  vagaLimiter,
  candidaturaLimiter,
  wsLimiter,
  suspiciousActivityDetector,
  strictLimiter,
  whitelistMiddleware
};


export const getRateLimitStatus = () => {
  return {
    redisConnected: !!redisClient,
    limiters: {
      general: { windowMs: WINDOW_MS, max: MAX_REQUESTS },
      auth: { windowMs: 15 * 60 * 1000, max: 5 },
      upload: { windowMs: 60 * 60 * 1000, max: 10 },
      ia: { windowMs: 60 * 60 * 1000, max: 50 },
      vaga: { windowMs: 24 * 60 * 60 * 1000, max: 5 },
      candidatura: { windowMs: 24 * 60 * 60 * 1000, max: 20 },
      ws: { windowMs: 60 * 1000, max: 10 }
    }
  };
};