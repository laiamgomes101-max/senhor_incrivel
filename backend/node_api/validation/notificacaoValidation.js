import Joi from 'joi';


export const createNotificacaoSchema = Joi.object({
  usuario_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID do usuário deve ser um número',
      'number.integer': 'ID do usuário deve ser um inteiro',
      'number.positive': 'ID do usuário deve ser positivo',
      'any.required': 'ID do usuário é obrigatório'
    }),
  titulo: Joi.string()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.min': 'Título deve ter pelo menos 5 caracteres',
      'string.max': 'Título deve ter no máximo 200 caracteres',
      'any.required': 'Título é obrigatório'
    }),
  mensagem: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Mensagem deve ter pelo menos 10 caracteres',
      'string.max': 'Mensagem deve ter no máximo 1000 caracteres',
      'any.required': 'Mensagem é obrigatória'
    }),
  tipo: Joi.string()
    .valid('info', 'success', 'warning', 'error', 'candidatura', 'vaga', 'sistema')
    .required()
    .messages({
      'any.only': 'Tipo deve ser info, success, warning, error, candidatura, vaga ou sistema',
      'any.required': 'Tipo é obrigatório'
    }),
  referencia_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID de referência deve ser um número',
      'number.integer': 'ID de referência deve ser um inteiro',
      'number.positive': 'ID de referência deve ser positivo'
    }),
  referencia_tipo: Joi.string()
    .valid('vaga', 'candidatura', 'curriculo', 'usuario', 'empresa')
    .optional()
    .messages({
      'any.only': 'Tipo de referência deve ser vaga, candidatura, curriculo, usuario ou empresa'
    }),
  lida: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Lida deve ser um valor booleano'
    }),
  data_expiracao: Joi.date()
    .optional()
    .messages({
      'date.base': 'Data de expiração deve ser uma data válida'
    })
});


export const updateNotificacaoSchema = Joi.object({
  titulo: Joi.string()
    .min(5)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Título deve ter pelo menos 5 caracteres',
      'string.max': 'Título deve ter no máximo 200 caracteres'
    }),
  mensagem: Joi.string()
    .min(10)
    .max(1000)
    .optional()
    .messages({
      'string.min': 'Mensagem deve ter pelo menos 10 caracteres',
      'string.max': 'Mensagem deve ter no máximo 1000 caracteres'
    }),
  tipo: Joi.string()
    .valid('info', 'success', 'warning', 'error', 'candidatura', 'vaga', 'sistema')
    .optional()
    .messages({
      'any.only': 'Tipo deve ser info, success, warning, error, candidatura, vaga ou sistema'
    }),
  lida: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Lida deve ser um valor booleano'
    })
});


export const createSystemNotificationSchema = Joi.object({
  titulo: Joi.string()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.min': 'Título deve ter pelo menos 5 caracteres',
      'string.max': 'Título deve ter no máximo 200 caracteres',
      'any.required': 'Título é obrigatório'
    }),
  mensagem: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Mensagem deve ter pelo menos 10 caracteres',
      'string.max': 'Mensagem deve ter no máximo 1000 caracteres',
      'any.required': 'Mensagem é obrigatória'
    }),
  tipo: Joi.string()
    .valid('info', 'success', 'warning', 'error', 'sistema')
    .default('sistema')
    .messages({
      'any.only': 'Tipo deve ser info, success, warning, error ou sistema'
    }),
  usuarios_ids: Joi.array()
    .items(Joi.number().integer().positive())
    .optional()
    .messages({
      'array.base': 'IDs dos usuários devem ser uma lista',
      'number.base': 'Cada ID deve ser um número',
      'number.integer': 'Cada ID deve ser um inteiro',
      'number.positive': 'Cada ID deve ser positivo'
    }),
  enviar_para_todos: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Enviar para todos deve ser um valor booleano'
    }),
  data_expiracao: Joi.date()
    .optional()
    .messages({
      'date.base': 'Data de expiração deve ser uma data válida'
    })
});


export const createBulkNotificationsSchema = Joi.object({
  notificacoes: Joi.array()
    .items(createNotificacaoSchema)
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.base': 'Notificações devem ser uma lista',
      'array.min': 'Deve haver pelo menos 1 notificação',
      'array.max': 'Não pode haver mais de 100 notificações',
      'any.required': 'Notificações são obrigatórias'
    })
});


export const archiveOldNotificationsSchema = Joi.object({
  dias_antigos: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(30)
    .messages({
      'number.base': 'Dias antigos deve ser um número',
      'number.integer': 'Dias antigos deve ser um inteiro',
      'number.min': 'Dias antigos deve ser pelo menos 1',
      'number.max': 'Dias antigos deve ser no máximo 365'
    })
});


export const validateCreateNotificacao = (req, res, next) => {
  const { error } = createNotificacaoSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      details: error.details[0].message
    });
  }
  next();
};

export const validateUpdateNotificacao = (req, res, next) => {
  const { error } = updateNotificacaoSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      details: error.details[0].message
    });
  }
  next();
};

export const validateCreateSystemNotification = (req, res, next) => {
  const { error } = createSystemNotificationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      details: error.details[0].message
    });
  }
  next();
};

export const validateCreateBulkNotifications = (req, res, next) => {
  const { error } = createBulkNotificationsSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      details: error.details[0].message
    });
  }
  next();
};

export const validateArchiveOldNotifications = (req, res, next) => {
  const { error } = archiveOldNotificationsSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      details: error.details[0].message
    });
  }
  next();
};