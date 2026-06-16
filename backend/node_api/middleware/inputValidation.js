




import Joi from 'joi';
import logger from '../utils/logger.js';


const schemas = {

  register: Joi.object({
    email: Joi.string().email().required().max(255),
    password: Joi.string().min(8).max(128).required().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    nome: Joi.string().min(2).max(100).required().pattern(/^[a-zA-Z\sÀ-ÿ]+$/),
    tipo: Joi.string().valid('candidato', 'empresa').required()
  }),

  login: Joi.object({
    email: Joi.string().email().required().max(255),
    password: Joi.string().required().max(128)
  }),


  createVaga: Joi.object({
    titulo: Joi.string().min(5).max(200).required(),
    descricao: Joi.string().min(20).max(5000).required(),
    requisitos: Joi.array().items(Joi.string().min(2).max(100)).min(1).required(),
    tipo_contrato: Joi.string().valid('CLT', 'PJ', 'Estágio', 'Temporário').required(),
    localizacao: Joi.string().min(2).max(200).required(),
    salario_min: Joi.number().min(0).max(1000000).optional(),
    salario_max: Joi.number().min(0).max(1000000).optional()
  }),


  uploadCurriculo: Joi.object({
    file: Joi.object({
      originalname: Joi.string().required(),
      mimetype: Joi.string().valid('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document').required(),
      size: Joi.number().max(5 * 1024 * 1024).required() 
    }).required()
  }),


  createCandidatura: Joi.object({
    vaga_id: Joi.number().integer().positive().required()
  }),


  sendMessage: Joi.object({
    content: Joi.string().min(1).max(1000).required().pattern(/^[^<>]*$/), 
    recipient_id: Joi.string().optional().max(255),
    type: Joi.string().valid('public', 'private').default('public')
  })
};


function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  return str
    .trim()
    .replace(/[<>]/g, '') 
    .replace(/javascript:/gi, '') 
    .replace(/on\w+=/gi, '') 
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}


function sanitizeObject(obj) {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}


function validateInput(schemaName) {
  return (req, res, next) => {
    try {
      const schema = schemas[schemaName];
      if (!schema) {
        logger.error('Schema de validação não encontrado', { schema: schemaName });
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }


      const sanitizedBody = sanitizeObject(req.body);
      const sanitizedQuery = sanitizeObject(req.query);
      const sanitizedParams = sanitizeObject(req.params);


      const { error, value } = schema.validate(sanitizedBody, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context.value
        }));

        logger.warn('Validação de input falhou', {
          schema: schemaName,
          errors: validationErrors,
          ip: req.ip
        });

        return res.status(400).json({
          error: 'Dados inválidos',
          details: validationErrors
        });
      }


      req.body = value;
      req.query = sanitizedQuery;
      req.params = sanitizedParams;

      next();
    } catch (err) {
      logger.error('Erro no middleware de validação', {
        error: err.message,
        schema: schemaName,
        ip: req.ip
      });

      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}


function securityHeaders(req, res, next) {

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'");

  next();
}


function detectSuspiciousActivity(req, res, next) {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /union.*select/i,
    /drop.*table/i,
    /insert.*into/i,
    /delete.*from/i,
    /update.*set/i
  ];

  const checkSuspicious = (obj) => {
    if (typeof obj === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(obj));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkSuspicious(value));
    }
    return false;
  };

  const isSuspicious = checkSuspicious(req.body) || 
                      checkSuspicious(req.query) || 
                      checkSuspicious(req.params);

  if (isSuspicious) {
    logger.security('suspicious_input_detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      params: req.params
    });

    return res.status(400).json({ 
      error: 'Input suspeito detectado',
      code: 'SUSPICIOUS_INPUT'
    });
  }

  next();
}

export {
  validateInput,
  securityHeaders,
  detectSuspiciousActivity,
  schemas,
  sanitizeString,
  sanitizeObject
};