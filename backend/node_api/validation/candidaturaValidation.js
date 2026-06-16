import Joi from 'joi';


export const createCandidaturaSchema = Joi.object({
  vaga_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID da vaga deve ser um número',
      'number.integer': 'ID da vaga deve ser um inteiro',
      'number.positive': 'ID da vaga deve ser positivo',
      'any.required': 'ID da vaga é obrigatório'
    }),
  candidato_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID do candidato deve ser um número',
      'number.integer': 'ID do candidato deve ser um inteiro',
      'number.positive': 'ID do candidato deve ser positivo',
      'any.required': 'ID do candidato é obrigatório'
    }),
  mensagem_candidato: Joi.string()
    .min(10)
    .max(1000)
    .optional()
    .messages({
      'string.min': 'Mensagem do candidato deve ter pelo menos 10 caracteres',
      'string.max': 'Mensagem do candidato deve ter no máximo 1000 caracteres'
    }),
  status: Joi.string()
    .valid('pendente', 'em_analise', 'entrevista', 'aprovado', 'rejeitado', 'cancelado')
    .default('pendente')
    .messages({
      'any.only': 'Status deve ser um dos valores válidos'
    })
});


export const updateCandidaturaStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pendente', 'em_analise', 'entrevista', 'aprovado', 'rejeitado', 'cancelado')
    .required()
    .messages({
      'any.only': 'Status deve ser um dos valores válidos',
      'any.required': 'Status é obrigatório'
    }),
  feedback_empresa: Joi.string()
    .min(10)
    .max(500)
    .optional()
    .messages({
      'string.min': 'Feedback da empresa deve ter pelo menos 10 caracteres',
      'string.max': 'Feedback da empresa deve ter no máximo 500 caracteres'
    })
});


export const dateRangeSchema = Joi.object({
  data_inicio: Joi.date()
    .required()
    .messages({
      'date.base': 'Data de início deve ser uma data válida',
      'any.required': 'Data de início é obrigatória'
    }),
  data_fim: Joi.date()
    .greater(Joi.ref('data_inicio'))
    .required()
    .messages({
      'date.base': 'Data de fim deve ser uma data válida',
      'date.greater': 'Data de fim deve ser posterior à data de início',
      'any.required': 'Data de fim é obrigatória'
    })
});


export const validateCreateCandidatura = (req, res, next) => {
  const { error } = createCandidaturaSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      details: error.details[0].message
    });
  }
  next();
};

export const validateUpdateCandidaturaStatus = (req, res, next) => {
  const { error } = updateCandidaturaStatusSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      details: error.details[0].message
    });
  }
  next();
};

export const validateDateRange = (req, res, next) => {
  const { error } = dateRangeSchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      error: 'Parâmetros de consulta inválidos',
      details: error.details[0].message
    });
  }
  next();
};