



import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};


const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);


const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;


    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }


    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);


const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'plataforma-curriculos-api',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [

    new winston.transports.Console({
      format: consoleFormat
    })
  ],


  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat
    })
  ],


  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
});


if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}


logger.middleware = (req, res, next) => {
  const start = Date.now();


  logger.http('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || null
  });


  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'http';

    logger[logLevel]('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || null
    });
  });

  next();
};


logger.api_request = (method, endpoint, statusCode, details = {}) => {
  const logLevel = statusCode >= 400 ? 'error' : 'info';
  logger[logLevel]('API Request', {
    event: 'api_request',
    method,
    endpoint,
    statusCode,
    ...details
  });
};

logger.auth = (action, userId, details = {}) => {
  logger.info('Auth Event', {
    event: 'auth',
    action,
    userId,
    ...details
  });
};

logger.curriculum = (action, curriculumId, userId, details = {}) => {
  logger.info('Curriculum Event', {
    event: 'curriculum',
    action,
    curriculumId,
    userId,
    ...details
  });
};

logger.vaga = (action, vagaId, empresaId, details = {}) => {
  logger.info('Vaga Event', {
    event: 'vaga',
    action,
    vagaId,
    empresaId,
    ...details
  });
};

logger.ia = (action, details = {}) => {
  logger.info('IA Processing', {
    event: 'ia',
    action,
    ...details
  });
};

logger.security = (event, details = {}) => {
  logger.warn('Security Event', {
    event: 'security',
    ...details
  });
};

logger.performance = (operation, duration, details = {}) => {
  logger.info('Performance', {
    event: 'performance',
    operation,
    duration: `${duration}ms`,
    ...details
  });
};

export default logger;