




import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';


dotenv.config();


const app = express();


const server = createServer(app);


const cache = new Map();


const CACHE_TTL = {
  user_profile: 30,
  vagas: 60,
  curriculos: 45,
  ia_results: 120
};


function setCache(key, value, ttl = 60) {
  cache.set(key, {
    data: value,
    timestamp: Date.now(),
    ttl: ttl * 1000
  });
}

function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;


  if (Date.now() - item.timestamp > item.ttl) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

function clearCache(pattern = null) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}


function cacheMiddleware(options = {}) {
  const {
    ttl = 60,
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    condition = () => true
  } = options;

  return (req, res, next) => {
    if (!condition(req) || req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const cached = getCache(cacheKey);

    if (cached) {
      console.log(`Cache HIT: ${cacheKey}`);
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    console.log(`Cache MISS: ${cacheKey}`);


    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode === 200) {
        setCache(cacheKey, data, ttl);
        console.log(`Cache SET: ${cacheKey}`);
      }
      res.set('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };

    next();
  };
}


app.use(cors());
app.use(express.json());



app.get('/', (req, res) => {
  res.json({
    message: 'Servidor Node.js com Cache rodando!',
    status: 'ok',
    version: '1.0'
  });
});


app.get('/no-cache', (req, res) => {
  const timestamp = Date.now();
  res.json({
    message: 'Rota sem cache',
    timestamp,
    random: Math.random()
  });
});


app.get('/cached', cacheMiddleware({ ttl: 60 }), (req, res) => {
  const timestamp = Date.now();
  res.json({
    message: 'Rota com cache',
    timestamp,
    random: Math.random(),
    cached: true
  });
});


app.get('/api/users/:id/profile', cacheMiddleware({ 
  ttl: CACHE_TTL.user_profile,
  keyGenerator: (req) => `user_profile:${req.params.id}`
}), (req, res) => {
  const userId = req.params.id;
  const timestamp = Date.now();


  const profile = {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    timestamp,
    random: Math.random()
  };

  res.json(profile);
});


app.get('/api/vagas', cacheMiddleware({ 
  ttl: CACHE_TTL.vagas,
  keyGenerator: (req) => `vagas:${JSON.stringify(req.query)}`
}), (req, res) => {
  const timestamp = Date.now();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;


  const vagas = Array.from({ length: limit }, (_, i) => ({
    id: (page - 1) * limit + i + 1,
    title: `Vaga ${(page - 1) * limit + i + 1}`,
    company: `Company ${(page - 1) * limit + i + 1}`,
    timestamp,
    random: Math.random()
  }));

  res.json({
    vagas,
    pagination: {
      page,
      limit,
      total: 100
    }
  });
});


app.get('/api/ia/analyze/:text', cacheMiddleware({ 
  ttl: CACHE_TTL.ia_results,
  keyGenerator: (req) => `ia_analysis:${req.params.text}`
}), (req, res) => {
  const text = req.params.text;
  const timestamp = Date.now();


  console.log(`Processando IA para: ${text}`);

  const result = {
    text,
    analysis: {
      sentiment: 'positive',
      confidence: 0.85,
      keywords: ['python', 'javascript', 'react'],
      timestamp,
      processing_time: 1500
    }
  };

  res.json(result);
});


app.post('/api/cache/clear', (req, res) => {
  const { pattern } = req.body;
  clearCache(pattern);

  res.json({
    message: pattern ? `Cache cleared for pattern: ${pattern}` : 'Cache cleared completely',
    remaining_items: cache.size
  });
});


app.get('/api/cache/status', (req, res) => {
  const items = [];
  for (const [key, value] of cache.entries()) {
    items.push({
      key,
      size: JSON.stringify(value.data).length,
      age: Math.floor((Date.now() - value.timestamp) / 1000),
      ttl: Math.floor(value.ttl / 1000),
      remaining: Math.floor((value.ttl - (Date.now() - value.timestamp)) / 1000)
    });
  }

  res.json({
    total_items: cache.size,
    items: items.slice(0, 10), 
    ttl_settings: CACHE_TTL
  });
});



const PORT = process.env.PORT || 3006;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Node.js com Cache rodando na porta ${PORT}`);
  console.log('Endpoints disponíveis:');
  console.log('  GET  /no-cache           - Rota sem cache');
  console.log('  GET  /cached             - Rota com cache (1 min)');
  console.log('  GET  /api/users/:id/profile - Perfil com cache (30s)');
  console.log('  GET  /api/vagas           - Vagas com cache (1 min)');
  console.log('  GET  /api/ia/analyze/:text - IA com cache (2 min)');
  console.log('  POST /api/cache/clear    - Limpar cache');
  console.log('  GET  /api/cache/status   - Status do cache');
});