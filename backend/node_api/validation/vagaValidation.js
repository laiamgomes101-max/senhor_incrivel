import Joi from 'joi';


export const createVagaSchema = Joi.object({
  titulo: Joi.string()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.min': 'Título deve ter pelo menos 5 caracteres',
      'string.max': 'Título deve ter no máximo 200 caracteres',
      'any.required': 'Título é obrigatório'
    }),
  descricao: Joi.string()
    .min(10)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Descrição deve ter pelo menos 10 caracteres',
      'string.max': 'Descrição deve ter no máximo 2000 caracteres',
      'any.required': 'Descrição é obrigatória'
    }),
  empresa_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID da empresa deve ser um número',
      'number.integer': 'ID da empresa deve ser um inteiro',
      'number.positive': 'ID da empresa deve ser positivo',
      'any.required': 'ID da empresa é obrigatório'
    }),
  localizacao: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Localização deve ter pelo menos 2 caracteres',
      'string.max': 'Localização deve ter no máximo 100 caracteres'
    }),
  tipo_contrato: Joi.string()
    .valid('CLT', 'PJ', 'Freelancer', 'Estágio', 'Temporário')
    .required()
    .messages({
      'any.only': 'Tipo de contrato deve ser CLT, PJ, Freelancer, Estágio ou Temporário',
      'any.required': 'Tipo de contrato é obrigatório'
    }),
  salario_min: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Salário mínimo deve ser maior ou igual a 0'
    }),
  salario_max: Joi.number()
    .min(0)
    .when('salario_min', {
      is: Joi.exist(),
      then: Joi.number().greater(Joi.ref('salario_min')).messages({
        'number.greater': 'Salário máximo deve ser maior que o mínimo'
      })
    })
    .optional()
    .messages({
      'number.min': 'Salário máximo deve ser maior ou igual a 0'
    }),
  habilidades_requeridas: Joi.array()
    .items(Joi.string().min(1).max(50))
    .optional()
    .messages({
      'array.base': 'Habilidades devem ser uma lista',
      'string.min': 'Cada habilidade deve ter pelo menos 1 caractere',
      'string.max': 'Cada habilidade deve ter no máximo 50 caracteres'
    }),
  nivel_experiencia: Joi.string()
    .valid('Júnior', 'Pleno', 'Sênior', 'Especialista')
    .optional()
    .messages({
      'any.only': 'Nível de experiência deve ser Júnior, Pleno, Sênior ou Especialista'
    }),
  status: Joi.string()
    .valid('ativa', 'pausada', 'encerrada')
    .default('ativa')
    .messages({
      'any.only': 'Status deve ser ativa, pausada ou encerrada'
    })
});


export const updateVagaSchema = Joi.object({
  titulo: Joi.string()
    .min(5)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Título deve ter pelo menos 5 caracteres',
      'string.max': 'Título deve ter no máximo 200 caracteres'
    }),
  descricao: Joi.string()
    .min(10)
    .max(2000)
    .optional()
    .messages({
      'string.min': 'Descrição deve ter pelo menos 10 caracteres',
      'string.max': 'Descrição deve ter no máximo 2000 caracteres'
    }),
  localizacao: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Localização deve ter pelo menos 2 caracteres',
      'string.max': 'Localização deve ter no máximo 100 caracteres'
    }),
  tipo_contrato: Joi.string()
    .valid('CLT', 'PJ', 'Freelancer', 'Estágio', 'Temporário')
    .optional()
    .messages({
      'any.only': 'Tipo de contrato deve ser CLT, PJ, Freelancer, Estágio ou Temporário'
    }),
  salario_min: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Salário mínimo deve ser maior ou igual a 0'
    }),
  salario_max: Joi.number()
    .min(0)
    .when('salario_min', {
      is: Joi.exist(),
      then: Joi.number().greater(Joi.ref('salario_min')).messages({
        'number.greater': 'Salário máximo deve ser maior que o mínimo'
      })
    })
    .optional()
    .messages({
      'number.min': 'Salário máximo deve ser maior ou igual a 0'
    }),
  habilidades_requeridas: Joi.array()
    .items(Joi.string().min(1).max(50))
    .optional()
    .messages({
      'array.base': 'Habilidades devem ser uma lista',
      'string.min': 'Cada habilidade deve ter pelo menos 1 caractere',
      'string.max': 'Cada habilidade deve ter no máximo 50 caracteres'
    }),
  nivel_experiencia: Joi.string()
    .valid('Júnior', 'Pleno', 'Sênior', 'Especialista')
    .optional()
    .messages({
      'any.only': 'Nível de experiência deve ser Júnior, Pleno, Sênior ou Especialista'
    }),
  status: Joi.string()
    .valid('ativa', 'pausada', 'encerrada')
    .optional()
    .messages({
      'any.only': 'Status deve ser ativa, pausada ou encerrada'
    })
});


export const validateCreateVaga = (req, res, next) => {
  const { error } = createVagaSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      details: error.details[0].message
    });
  }
  next();
};

export const validateUpdateVaga = (req, res, next) => {
  const { error } = updateVagaSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      details: error.details[0].message
    });
  }
  next();
};