import Joi from 'joi';


export const createCurriculoSchema = Joi.object({
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
  titulo: Joi.string()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.min': 'Título deve ter pelo menos 5 caracteres',
      'string.max': 'Título deve ter no máximo 200 caracteres',
      'any.required': 'Título é obrigatório'
    }),
  resumo_profissional: Joi.string()
    .min(10)
    .max(1000)
    .optional()
    .messages({
      'string.min': 'Resumo profissional deve ter pelo menos 10 caracteres',
      'string.max': 'Resumo profissional deve ter no máximo 1000 caracteres'
    }),
  habilidades: Joi.array()
    .items(Joi.string().min(1).max(50))
    .optional()
    .messages({
      'array.base': 'Habilidades devem ser uma lista',
      'string.min': 'Cada habilidade deve ter pelo menos 1 caractere',
      'string.max': 'Cada habilidade deve ter no máximo 50 caracteres'
    }),
  experiencia_profissional: Joi.array()
    .items(
      Joi.object({
        empresa: Joi.string().min(2).max(100).required(),
        cargo: Joi.string().min(2).max(100).required(),
        periodo_inicio: Joi.date().required(),
        periodo_fim: Joi.date().optional(),
        descricao: Joi.string().min(10).max(500).optional(),
        atual: Joi.boolean().default(false)
      })
    )
    .optional()
    .messages({
      'array.base': 'Experiência profissional deve ser uma lista'
    }),
  formacao_academica: Joi.array()
    .items(
      Joi.object({
        instituicao: Joi.string().min(2).max(100).required(),
        curso: Joi.string().min(2).max(100).required(),
        periodo_inicio: Joi.date().required(),
        periodo_fim: Joi.date().optional(),
        nivel: Joi.string().valid('Ensino Fundamental', 'Ensino Médio', 'Técnico', 'Superior', 'Pós-graduação', 'Mestrado', 'Doutorado').required(),
        atual: Joi.boolean().default(false)
      })
    )
    .optional()
    .messages({
      'array.base': 'Formação acadêmica deve ser uma lista'
    }),
  idiomas: Joi.array()
    .items(
      Joi.object({
        idioma: Joi.string().min(2).max(50).required(),
        nivel: Joi.string().valid('Básico', 'Intermediário', 'Avançado', 'Fluente').required()
      })
    )
    .optional()
    .messages({
      'array.base': 'Idiomas devem ser uma lista'
    }),
  certificacoes: Joi.array()
    .items(
      Joi.object({
        nome: Joi.string().min(2).max(100).required(),
        instituicao: Joi.string().min(2).max(100).required(),
        data_emissao: Joi.date().required(),
        data_expiracao: Joi.date().optional()
      })
    )
    .optional()
    .messages({
      'array.base': 'Certificações devem ser uma lista'
    }),
  localizacao: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Localização deve ter pelo menos 2 caracteres',
      'string.max': 'Localização deve ter no máximo 100 caracteres'
    }),
  disponibilidade: Joi.string()
    .valid('Imediata', '15 dias', '30 dias', '2 meses', '3 meses ou mais')
    .optional()
    .messages({
      'any.only': 'Disponibilidade deve ser uma das opções válidas'
    }),
  pretensao_salarial_min: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Pretensão salarial mínima deve ser maior ou igual a 0'
    }),
  pretensao_salarial_max: Joi.number()
    .min(0)
    .when('pretensao_salarial_min', {
      is: Joi.exist(),
      then: Joi.number().greater(Joi.ref('pretensao_salarial_min')).messages({
        'number.greater': 'Pretensão salarial máxima deve ser maior que a mínima'
      })
    })
    .optional()
    .messages({
      'number.min': 'Pretensão salarial máxima deve ser maior ou igual a 0'
    }),
  linkedin_url: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'URL do LinkedIn deve ser válida'
    }),
  github_url: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'URL do GitHub deve ser válida'
    }),
  portfolio_url: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'URL do portfólio deve ser válida'
    })
});


export const updateCurriculoSchema = Joi.object({
  titulo: Joi.string()
    .min(5)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Título deve ter pelo menos 5 caracteres',
      'string.max': 'Título deve ter no máximo 200 caracteres'
    }),
  resumo_profissional: Joi.string()
    .min(10)
    .max(1000)
    .optional()
    .messages({
      'string.min': 'Resumo profissional deve ter pelo menos 10 caracteres',
      'string.max': 'Resumo profissional deve ter no máximo 1000 caracteres'
    }),
  habilidades: Joi.array()
    .items(Joi.string().min(1).max(50))
    .optional()
    .messages({
      'array.base': 'Habilidades devem ser uma lista',
      'string.min': 'Cada habilidade deve ter pelo menos 1 caractere',
      'string.max': 'Cada habilidade deve ter no máximo 50 caracteres'
    }),
  experiencia_profissional: Joi.array()
    .items(
      Joi.object({
        empresa: Joi.string().min(2).max(100).required(),
        cargo: Joi.string().min(2).max(100).required(),
        periodo_inicio: Joi.date().required(),
        periodo_fim: Joi.date().optional(),
        descricao: Joi.string().min(10).max(500).optional(),
        atual: Joi.boolean().default(false)
      })
    )
    .optional()
    .messages({
      'array.base': 'Experiência profissional deve ser uma lista'
    }),
  formacao_academica: Joi.array()
    .items(
      Joi.object({
        instituicao: Joi.string().min(2).max(100).required(),
        curso: Joi.string().min(2).max(100).required(),
        periodo_inicio: Joi.date().required(),
        periodo_fim: Joi.date().optional(),
        nivel: Joi.string().valid('Ensino Fundamental', 'Ensino Médio', 'Técnico', 'Superior', 'Pós-graduação', 'Mestrado', 'Doutorado').required(),
        atual: Joi.boolean().default(false)
      })
    )
    .optional()
    .messages({
      'array.base': 'Formação acadêmica deve ser uma lista'
    }),
  idiomas: Joi.array()
    .items(
      Joi.object({
        idioma: Joi.string().min(2).max(50).required(),
        nivel: Joi.string().valid('Básico', 'Intermediário', 'Avançado', 'Fluente').required()
      })
    )
    .optional()
    .messages({
      'array.base': 'Idiomas devem ser uma lista'
    }),
  certificacoes: Joi.array()
    .items(
      Joi.object({
        nome: Joi.string().min(2).max(100).required(),
        instituicao: Joi.string().min(2).max(100).required(),
        data_emissao: Joi.date().required(),
        data_expiracao: Joi.date().optional()
      })
    )
    .optional()
    .messages({
      'array.base': 'Certificações devem ser uma lista'
    }),
  localizacao: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Localização deve ter pelo menos 2 caracteres',
      'string.max': 'Localização deve ter no máximo 100 caracteres'
    }),
  disponibilidade: Joi.string()
    .valid('Imediata', '15 dias', '30 dias', '2 meses', '3 meses ou mais')
    .optional()
    .messages({
      'any.only': 'Disponibilidade deve ser uma das opções válidas'
    }),
  pretensao_salarial_min: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Pretensão salarial mínima deve ser maior ou igual a 0'
    }),
  pretensao_salarial_max: Joi.number()
    .min(0)
    .when('pretensao_salarial_min', {
      is: Joi.exist(),
      then: Joi.number().greater(Joi.ref('pretensao_salarial_min')).messages({
        'number.greater': 'Pretensão salarial máxima deve ser maior que a mínima'
      })
    })
    .optional()
    .messages({
      'number.min': 'Pretensão salarial máxima deve ser maior ou igual a 0'
    }),
  linkedin_url: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'URL do LinkedIn deve ser válida'
    }),
  github_url: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'URL do GitHub deve ser válida'
    }),
  portfolio_url: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'URL do portfólio deve ser válida'
    })
});


export const validateCreateCurriculo = (req, res, next) => {
  const { error } = createCurriculoSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      details: error.details[0].message
    });
  }
  next();
};

export const validateUpdateCurriculo = (req, res, next) => {
  const { error } = updateCurriculoSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      details: error.details[0].message
    });
  }
  next();
};