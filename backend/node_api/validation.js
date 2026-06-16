import Joi from 'joi';


export const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required(),
    senha: Joi.string().min(6).required(),
    nome: Joi.string().min(2).required(),
    tipo: Joi.string().valid('candidato', 'empresa').required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    senha: Joi.string().required()
  })
};


export const userValidation = {
  updateProfile: Joi.object({
    nome: Joi.string().min(2),
    foto_url: Joi.string().uri(),
    headline: Joi.string().max(200),
    localizacao: Joi.string(),
    sobre: Joi.string(),
    linkedin_url: Joi.string().uri(),
    github_url: Joi.string().uri(),
    portfolio_url: Joi.string().uri()
  }),

  updateCompany: Joi.object({
    nome: Joi.string().min(2),
    logo_url: Joi.string().uri(),
    setor: Joi.string(),
    localizacao: Joi.string(),
    sobre: Joi.string(),
    site_url: Joi.string().uri(),
    tamanho_empresa: Joi.string().valid('startup', 'pequena', 'media', 'grande')
  })
};


export const vagaValidation = {
  create: Joi.object({
    titulo: Joi.string().min(5).max(200).required(),
    descricao: Joi.string().min(10).required(),
    requisitos: Joi.array().items(Joi.string()),
    beneficios: Joi.array().items(Joi.string()),
    tipo_contrato: Joi.string().valid('CLT', 'PJ', 'temporario', 'estagio').required(),
    localizacao: Joi.string(),
    modalidade: Joi.string().valid('presencial', 'remoto', 'hibrido'),
    salario_min: Joi.number().min(0),
    salario_max: Joi.number().min(0),
    nivel: Joi.string().valid('junior', 'pleno', 'senior', 'especialista')
  }),

  update: Joi.object({
    titulo: Joi.string().min(5).max(200),
    descricao: Joi.string().min(10),
    requisitos: Joi.array().items(Joi.string()),
    beneficios: Joi.array().items(Joi.string()),
    tipo_contrato: Joi.string().valid('CLT', 'PJ', 'temporario', 'estagio'),
    localizacao: Joi.string(),
    modalidade: Joi.string().valid('presencial', 'remoto', 'hibrido'),
    salario_min: Joi.number().min(0),
    salario_max: Joi.number().min(0),
    nivel: Joi.string().valid('junior', 'pleno', 'senior', 'especialista'),
    ativa: Joi.boolean()
  })
};


export const candidaturaValidation = {
  create: Joi.object({
    vaga_id: Joi.number().integer().required(),
    curriculo_id: Joi.number().integer()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('pendente', 'em_analise', 'aprovado', 'rejeitado', 'cancelado').required(),
    score_analise: Joi.number().min(0).max(100),
    feedback: Joi.string()
  })
};


export const curriculoValidation = {
  create: Joi.object({
    experiencia: Joi.array().items(Joi.object({
      empresa: Joi.string().required(),
      cargo: Joi.string().required(),
      periodo: Joi.string().required(),
      descricao: Joi.string()
    })),
    educacao: Joi.array().items(Joi.object({
      instituicao: Joi.string().required(),
      curso: Joi.string().required(),
      periodo: Joi.string().required(),
      tipo: Joi.string()
    })),
    habilidades: Joi.array().items(Joi.string()),
    idiomas: Joi.array().items(Joi.object({
      idioma: Joi.string().required(),
      nivel: Joi.string().valid('basico', 'intermediario', 'avancado', 'fluente').required()
    })),
    certificacoes: Joi.array().items(Joi.object({
      nome: Joi.string().required(),
      organizacao: Joi.string().required(),
      data: Joi.string(),
      validade: Joi.string()
    })),
    arquivo_url: Joi.string().uri(),
    arquivo_nome: Joi.string()
  }),

  update: Joi.object({
    experiencia: Joi.array().items(Joi.object({
      empresa: Joi.string().required(),
      cargo: Joi.string().required(),
      periodo: Joi.string().required(),
      descricao: Joi.string()
    })),
    educacao: Joi.array().items(Joi.object({
      instituicao: Joi.string().required(),
      curso: Joi.string().required(),
      periodo: Joi.string().required(),
      tipo: Joi.string()
    })),
    habilidades: Joi.array().items(Joi.string()),
    idiomas: Joi.array().items(Joi.object({
      idioma: Joi.string().required(),
      nivel: Joi.string().valid('basico', 'intermediario', 'avancado', 'fluente').required()
    })),
    certificacoes: Joi.array().items(Joi.object({
      nome: Joi.string().required(),
      organizacao: Joi.string().required(),
      data: Joi.string(),
      validade: Joi.string()
    })),
    arquivo_url: Joi.string().uri(),
    arquivo_nome: Joi.string()
  })
};


export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors
      });
    }
    next();
  };
};