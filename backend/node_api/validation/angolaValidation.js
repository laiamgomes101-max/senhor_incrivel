/**
 * Validações Joi customizadas para Angola
 * Estende as validações padrão com regras angolanas
 */

import Joi from 'joi';
import {
  validarTelefoneAngola,
  validarSalariaKwanza,
  validarProvinciaAngola,
  MENSAGENS_ANGOLA,
  PROVINCIAS_ANGOLA
} from './angolaValidation.js';

// ========== CUSTOM SCHEMAS ANGOLA ==========

/**
 * Schema para telefone angolano
 */
export const schemaPhoneAngola = Joi.string()
  .required()
  .external(async (value) => {
    if (!validarTelefoneAngola(value)) {
      throw new Error(MENSAGENS_ANGOLA.telefone.invalido);
    }
  })
  .messages({
    'string.empty': MENSAGENS_ANGOLA.telefone.obrigatorio,
    'any.required': MENSAGENS_ANGOLA.telefone.obrigatorio,
    'any.external': MENSAGENS_ANGOLA.telefone.invalido
  });

/**
 * Schema para salário em Kwanza
 */
export const schemaSalaryKwanza = Joi.number()
  .positive()
  .required()
  .external(async (value) => {
    if (!validarSalariaKwanza(value)) {
      throw new Error(MENSAGENS_ANGOLA.salario.invalido);
    }
  })
  .messages({
    'number.base': MENSAGENS_ANGOLA.salario.invalido,
    'number.positive': MENSAGENS_ANGOLA.salario.invalido,
    'any.required': MENSAGENS_ANGOLA.salario.obrigatorio,
    'any.external': MENSAGENS_ANGOLA.salario.invalido
  });

/**
 * Schema para range de salário
 */
export const schemaSalaryRangeKwanza = Joi.object({
  min: Joi.number()
    .positive()
    .required()
    .external(async (value) => {
      if (!validarSalariaKwanza(value)) {
        throw new Error(MENSAGENS_ANGOLA.salario.invalido);
      }
    })
    .messages({
      'number.base': 'Salário mínimo deve ser um número',
      'number.positive': MENSAGENS_ANGOLA.salario.invalido,
      'any.required': 'Salário mínimo é obrigatório'
    }),
  max: Joi.number()
    .positive()
    .greater(Joi.ref('min'))
    .required()
    .external(async (value, helpers) => {
      if (!validarSalariaKwanza(value)) {
        throw new Error(MENSAGENS_ANGOLA.salario.invalido);
      }
    })
    .messages({
      'number.base': 'Salário máximo deve ser um número',
      'number.positive': MENSAGENS_ANGOLA.salario.invalido,
      'number.greater': MENSAGENS_ANGOLA.salario.intervalo,
      'any.required': 'Salário máximo é obrigatório'
    })
}).required();

/**
 * Schema para província de Angola
 */
export const schemaProvinciaAngola = Joi.string()
  .valid(...PROVINCIAS_ANGOLA)
  .required()
  .messages({
    'any.only': `${MENSAGENS_ANGOLA.provincia.invalida}. Opções: ${PROVINCIAS_ANGOLA.join(', ')}`,
    'any.required': MENSAGENS_ANGOLA.provincia.obrigatorio,
    'string.empty': MENSAGENS_ANGOLA.provincia.obrigatorio
  });

/**
 * Schema para dados de candidato angolano
 */
export const schemaCandidatoAngola = Joi.object({
  nome: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres',
      'any.required': 'Nome é obrigatório'
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email deve ser válido',
      'any.required': 'Email é obrigatório'
    }),

  telefone: schemaPhoneAngola,

  provincia: schemaProvinciaAngola,

  pretensao_salarial_min: schemaSalaryKwanza,

  pretensao_salarial_max: Joi.number()
    .positive()
    .greater(Joi.ref('pretensao_salarial_min'))
    .required()
    .messages({
      'number.base': 'Salário máximo deve ser um número',
      'number.positive': MENSAGENS_ANGOLA.salario.invalido,
      'number.greater': MENSAGENS_ANGOLA.salario.intervalo,
      'any.required': 'Salário máximo é obrigatório'
    }),

  habilidades: Joi.array()
    .items(Joi.string().min(1).max(50))
    .optional()
    .messages({
      'array.base': 'Habilidades devem ser uma lista'
    }),

  disponibilidade: Joi.string()
    .valid('Imediata', '15 dias', '30 dias', '2 meses', '3 meses ou mais')
    .required()
    .messages({
      'any.only': 'Disponibilidade deve ser uma das opções válidas'
    })
});

/**
 * Schema para dados de vaga angolana
 */
// O regime laboral angolano segue a Lei Geral do Trabalho (LGT).
// Não use CLT aqui para Angola; contratos de prestação de serviços devem ser tratados como
// 'Contrato de Prestação de Serviços' ou outros tipos previstos pela LGT.
export const schemaVagaAngola = Joi.object({
  titulo: Joi.string()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.min': 'Título deve ter pelo menos 3 caracteres',
      'string.max': 'Título deve ter no máximo 200 caracteres',
      'any.required': 'Título da vaga é obrigatório'
    }),

  descricao: Joi.string()
    .min(10)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Descrição deve ter pelo menos 10 caracteres',
      'string.max': 'Descrição deve ter no máximo 5000 caracteres',
      'any.required': 'Descrição é obrigatória'
    }),

  provincia: schemaProvinciaAngola,

  salario_min: schemaSalaryKwanza,

  salario_max: Joi.number()
    .positive()
    .greater(Joi.ref('salario_min'))
    .required()
    .messages({
      'number.base': 'Salário máximo deve ser um número',
      'number.positive': MENSAGENS_ANGOLA.salario.invalido,
      'number.greater': MENSAGENS_ANGOLA.salario.intervalo,
      'any.required': 'Salário máximo é obrigatório'
    }),

  requisitos: Joi.array()
    .items(Joi.string().min(1).max(50))
    .optional()
    .messages({
      'array.base': 'Requisitos devem ser uma lista'
    }),

  tipo_contrato: Joi.string()
    .valid('Permanente', 'Termo Certo', 'Termo Incerto', 'Freelancer', 'Estágio')
    .required()
    .messages({
      'any.only': 'Tipo de contrato inválido',
      'any.required': 'Tipo de contrato é obrigatório'
    })
});

/**
 * Schema para atualização de perfil de candidato
 */
export const schemaAtualizarCandidatoAngola = Joi.object({
  telefone: schemaPhoneAngola.optional(),
  provincia: schemaProvinciaAngola.optional(),
  pretensao_salarial_min: schemaSalaryKwanza.optional(),
  pretensao_salarial_max: Joi.number()
    .positive()
    .greater(Joi.ref('pretensao_salarial_min'))
    .optional()
    .messages({
      'number.greater': MENSAGENS_ANGOLA.salario.intervalo
    })
}).when(Joi.object({
  pretensao_salarial_min: Joi.exist()
}).unknown(), {
  then: Joi.object({
    pretensao_salarial_max: Joi.number().required()
  })
});

// ========== VALIDADORES MIDDLEWARE ==========

export const validateCandidatoAngola = (req, res, next) => {
  const { error } = schemaCandidatoAngola.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    const mensagens = error.details.map(d => d.message);
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      details: mensagens
    });
  }
  next();
};

export const validateVagaAngola = (req, res, next) => {
  const { error } = schemaVagaAngola.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    const mensagens = error.details.map(d => d.message);
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      details: mensagens
    });
  }
  next();
};

export const validateAtualizarCandidatoAngola = (req, res, next) => {
  const { error } = schemaAtualizarCandidatoAngola.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    const mensagens = error.details.map(d => d.message);
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      details: mensagens
    });
  }
  next();
};

// ========== EXPORTAÇÕES ==========
export default {
  schemaPhoneAngola,
  schemaSalaryKwanza,
  schemaSalaryRangeKwanza,
  schemaProvinciaAngola,
  schemaCandidatoAngola,
  schemaVagaAngola,
  schemaAtualizarCandidatoAngola,
  validateCandidatoAngola,
  validateVagaAngola,
  validateAtualizarCandidatoAngola
};
