




import { createClient } from 'redis';
import logger from './logger.js';
import { metrics } from './metrics.js';


let redisClient = null;
let isConnected = false;


const memoryCache = new Map();


const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DEFAULT_TTL = 3600; 
const CACHE_PREFIX = 'plataforma_curriculos:';


async function initRedis() {
  try {
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
      isConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
      isConnected = true;
    });

    redisClient.on('end', () => {
      logger.warn('Redis client disconnected');
      isConnected = false;
    });

    await redisClient.connect();
    logger.info('Redis initialized successfully', { url: REDIS_URL });

    return true;
  } catch (error) {
    logger.error('Failed to initialize Redis', { error: error.message });
    isConnected = false;
    return false;
  }
}





function generateKey(prefix, identifier) {
  return `${CACHE_PREFIX}${prefix}:${identifier}`;
}


function memorySet(key, value, ttl) {
  memoryCache.set(key, {
    data: value,
    timestamp: Date.now(),
    ttl: ttl * 1000
  });
}

function memoryGet(key) {
  const item = memoryCache.get(key);
  if (!item) return null;

  if (Date.now() - item.timestamp > item.ttl) {
    memoryCache.delete(key);
    return null;
  }

  return item.data;
}

function memoryDel(key) {
  return memoryCache.delete(key);
}


async function set(key, value, ttl = DEFAULT_TTL) {
  if (!isConnected || !redisClient) {

    memorySet(key, value, ttl);
    logger.info('Using memory cache fallback', { key });
    return true;
  }

  try {
    const serializedValue = JSON.stringify(value);
    const cacheKey = generateKey(key.prefix || 'default', key.identifier || key);

    await redisClient.setEx(cacheKey, ttl, serializedValue);

    logger.debug('Cache set successfully', { 
      key: cacheKey, 
      ttl,
      size: serializedValue.length 
    });

    return true;
  } catch (error) {
    logger.error('Failed to set cache', { 
      key: key.prefix || 'default', 
      error: error.message 
    });
    return false;
  }
}


async function get(key) {
  if (!isConnected || !redisClient) {
    logger.debug('Redis not connected, skipping cache get', { key });
    return null;
  }

  try {
    const cacheKey = generateKey(key.prefix || 'default', key.identifier || key);
    const value = await redisClient.get(cacheKey);

    if (value === null) {
      logger.debug('Cache miss', { key: cacheKey });
      return null;
    }

    const parsedValue = JSON.parse(value);

    logger.debug('Cache hit', { 
      key: cacheKey,
      size: value.length 
    });

    return parsedValue;
  } catch (error) {
    logger.error('Failed to get cache', { 
      key: key.prefix || 'default', 
      error: error.message 
    });
    return null;
  }
}


async function del(key) {
  if (!isConnected || !redisClient) {
    logger.debug('Redis not connected, skipping cache delete', { key });
    return false;
  }

  try {
    const cacheKey = generateKey(key.prefix || 'default', key.identifier || key);
    const result = await redisClient.del(cacheKey);

    if (result > 0) {
      logger.debug('Cache deleted successfully', { key: cacheKey });
    } else {
      logger.debug('Cache key not found', { key: cacheKey });
    }

    return result > 0;
  } catch (error) {
    logger.error('Failed to delete cache', { 
      key: key.prefix || 'default', 
      error: error.message 
    });
    return false;
  }
}


async function clearByPrefix(prefix) {
  if (!isConnected || !redisClient) {
    logger.debug('Redis not connected, skipping cache clear', { prefix });
    return false;
  }

  try {
    const cachePrefix = generateKey(prefix, '');
    const keys = await redisClient.keys(`${cachePrefix}*`);

    if (keys.length === 0) {
      logger.debug('No cache keys found for prefix', { prefix });
      return true;
    }

    await redisClient.del(keys);

    logger.info('Cache cleared by prefix', { 
      prefix, 
      keysDeleted: keys.length 
    });

    return true;
  } catch (error) {
    logger.error('Failed to clear cache by prefix', { 
      prefix, 
      error: error.message 
    });
    return false;
  }
}


async function exists(key) {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    const cacheKey = generateKey(key.prefix || 'default', key.identifier || key);
    const result = await redisClient.exists(cacheKey);

    return result === 1;
  } catch (error) {
    logger.error('Failed to check cache existence', { 
      key: key.prefix || 'default', 
      error: error.message 
    });
    return false;
  }
}


async function expire(key, ttl) {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    const cacheKey = generateKey(key.prefix || 'default', key.identifier || key);
    const result = await redisClient.expire(cacheKey, ttl);

    if (result) {
      logger.debug('TTL set successfully', { key: cacheKey, ttl });
    } else {
      logger.debug('Key not found for TTL', { key: cacheKey });
    }

    return result;
  } catch (error) {
    logger.error('Failed to set TTL', { 
      key: key.prefix || 'default', 
      error: error.message 
    });
    return false;
  }
}


async function ttl(key) {
  if (!isConnected || !redisClient) {
    return -1;
  }

  try {
    const cacheKey = generateKey(key.prefix || 'default', key.identifier || key);
    const result = await redisClient.ttl(cacheKey);

    return result;
  } catch (error) {
    logger.error('Failed to get TTL', { 
      key: key.prefix || 'default', 
      error: error.message 
    });
    return -1;
  }
}


function cacheMiddleware(options = {}) {
  const {
    prefix = 'api',
    ttl = DEFAULT_TTL,
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    condition = () => true
  } = options;

  return async (req, res, next) => {
    if (!condition(req) || req.method !== 'GET') {
      return next();
    }

    const cacheKey = {
      prefix,
      identifier: keyGenerator(req)
    };


    const cached = await get(cacheKey);

    if (cached) {
      logger.debug('Serving from cache', { 
        key: cacheKey.identifier,
        url: req.originalUrl 
      });


      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }


    const originalJson = res.json;
    res.json = function(data) {

      if (res.statusCode === 200) {
        set(cacheKey, data, ttl).catch(err => {
          logger.error('Failed to cache response', { 
            key: cacheKey.identifier,
            error: err.message 
          });
        });
      }


      res.set('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };

    next();
  };
}


const cacheTypes = {

  userProfile: {
    prefix: 'user_profile',
    ttl: 1800 
  },


  vagas: {
    prefix: 'vagas',
    ttl: 3600 
  },


  curriculos: {
    prefix: 'curriculos',
    ttl: 1800 
  },


  iaResults: {
    prefix: 'ia_results',
    ttl: 7200 
  },


  stats: {
    prefix: 'stats',
    ttl: 300 
  },


  notifications: {
    prefix: 'notifications',
    ttl: 60 
  }
};


const userProfileCache = {
  get: (userId) => get({ ...cacheTypes.userProfile, identifier: userId }),
  set: (userId, data, ttl = cacheTypes.userProfile.ttl) => 
    set({ ...cacheTypes.userProfile, identifier: userId }, data, ttl),
  del: (userId) => del({ ...cacheTypes.userProfile, identifier: userId }),
  clear: () => clearByPrefix(cacheTypes.userProfile.prefix)
};

const vagasCache = {
  get: (vagaId) => get({ ...cacheTypes.vagas, identifier: vagaId }),
  set: (vagaId, data, ttl = cacheTypes.vagas.ttl) => 
    set({ ...cacheTypes.vagas, identifier: vagaId }, data, ttl),
  del: (vagaId) => del({ ...cacheTypes.vagas, identifier: vagaId }),
  clear: () => clearByPrefix(cacheTypes.vagas.prefix)
};

const curriculosCache = {
  get: (curriculoId) => get({ ...cacheTypes.curriculos, identifier: curriculoId }),
  set: (curriculoId, data, ttl = cacheTypes.curriculos.ttl) => 
    set({ ...cacheTypes.curriculos, identifier: curriculoId }, data, ttl),
  del: (curriculoId) => del({ ...cacheTypes.curriculos, identifier: curriculoId }),
  clear: () => clearByPrefix(cacheTypes.curriculos.prefix)
};

const iaResultsCache = {
  get: (key) => get({ ...cacheTypes.iaResults, identifier: key }),
  set: (key, data, ttl = cacheTypes.iaResults.ttl) => 
    set({ ...cacheTypes.iaResults, identifier: key }, data, ttl),
  del: (key) => del({ ...cacheTypes.iaResults, identifier: key }),
  clear: () => clearByPrefix(cacheTypes.iaResults.prefix)
};

const statsCache = {
  get: (key) => get({ ...cacheTypes.stats, identifier: key }),
  set: (key, data, ttl = cacheTypes.stats.ttl) => 
    set({ ...cacheTypes.stats, identifier: key }, data, ttl),
  del: (key) => del({ ...cacheTypes.stats, identifier: key }),
  clear: () => clearByPrefix(cacheTypes.stats.prefix)
};

const notificationsCache = {
  get: (userId) => get({ ...cacheTypes.notifications, identifier: userId }),
  set: (userId, data, ttl = cacheTypes.notifications.ttl) => 
    set({ ...cacheTypes.notifications, identifier: userId }, data, ttl),
  del: (userId) => del({ ...cacheTypes.notifications, identifier: userId }),
  clear: () => clearByPrefix(cacheTypes.notifications.prefix)
};


async function getCacheStats() {
  if (!isConnected || !redisClient) {
    return {
      connected: false,
      error: 'Redis not connected'
    };
  }

  try {
    const info = await redisClient.info('memory');
    const keyspace = await redisClient.info('keyspace');

    return {
      connected: true,
      redis_url: REDIS_URL,
      memory_info: info,
      keyspace_info: keyspace,
      cache_types: Object.keys(cacheTypes)
    };
  } catch (error) {
    logger.error('Failed to get cache stats', { error: error.message });
    return {
      connected: false,
      error: error.message
    };
  }
}


export {
  initRedis,
  set,
  get,
  del,
  clearByPrefix,
  exists,
  expire,
  ttl,
  cacheMiddleware,
  cacheTypes,
  userProfileCache,
  vagasCache,
  curriculosCache,
  iaResultsCache,
  statsCache,
  notificationsCache,
  getCacheStats
};


export const isRedisConnected = () => isConnected;