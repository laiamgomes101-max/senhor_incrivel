
-- usuários gerais (candidatos/empresas/admin)
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  senha TEXT,
  tipo VARCHAR(20),   -- candidato, empresa, admin
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- currículos enviados pelos candidatos
CREATE TABLE IF NOT EXISTS curriculos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  arquivo_url TEXT,
  skills TEXT,
  experiencia TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- vagas publicadas por empresas
CREATE TABLE IF NOT EXISTS vagas (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(200),
  descricao TEXT,
  requisitos TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- candidaturas de candidatos a vagas
CREATE TABLE IF NOT EXISTS candidaturas (
  id SERIAL PRIMARY KEY,
  vaga_id INTEGER REFERENCES vagas(id) ON DELETE CASCADE,
  candidato_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pendente',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- resultado da análise da IA
CREATE TABLE IF NOT EXISTS analises (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  curriculo_id INTEGER,
  vaga_id INTEGER,
  resultado JSONB,
  data_analise TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- notificações para usuários
CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  mensagem TEXT,
  lida BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

