

-- usuários gerais (candidatos/empresas/admin)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- candidato, empresa, admin
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- candidatos
CREATE TABLE IF NOT EXISTS candidatos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  foto_url VARCHAR(255),
  headline VARCHAR(200),
  localizacao VARCHAR(100),
  sobre TEXT,
  linkedin_url VARCHAR(255),
  github_url VARCHAR(255),
  portfolio_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- empresas
CREATE TABLE IF NOT EXISTS empresas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  logo_url VARCHAR(255),
  setor VARCHAR(100),
  localizacao VARCHAR(100),
  sobre TEXT,
  site_url VARCHAR(255),
  tamanho_empresa VARCHAR(50), -- startup, pequena, media, grande
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS curriculos (
  id SERIAL PRIMARY KEY,
  candidato_id INTEGER REFERENCES candidatos(id) ON DELETE CASCADE,
  experiencia JSONB, -- Lista de experiências
  educacao JSONB, -- Lista de formações
  habilidades JSONB, -- Lista de habilidades
  idiomas JSONB, -- Lista de idiomas
  certificacoes JSONB, -- Lista de certificações
  arquivo_url VARCHAR(255), -- PDF do currículo
  arquivo_nome VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- resultado da análise da IA (armazenamento compatível com a API de análise)
CREATE TABLE IF NOT EXISTS analises (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  curriculo_id INTEGER REFERENCES curriculos(id),
  vaga_id INTEGER REFERENCES vagas(id),
  resultado JSONB,
  data_analise TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- vagas
CREATE TABLE IF NOT EXISTS vagas (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  requisitos JSONB, 
  beneficios JSONB, 
  tipo_contrato VARCHAR(50), 
  localizacao VARCHAR(100),
  modalidade VARCHAR(50), 
  salario_min DECIMAL(10,2),
  salario_max DECIMAL(10,2),
  nivel VARCHAR(50), 
  ativa BOOLEAN DEFAULT TRUE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS candidaturas (
  id SERIAL PRIMARY KEY,
  vaga_id INTEGER REFERENCES vagas(id) ON DELETE CASCADE,
  candidato_id INTEGER REFERENCES candidatos(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pendente', 
  score_analise DECIMAL(5,2), 
  feedback TEXT,
  curriculo_id INTEGER REFERENCES curriculos(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(50), 
  lida BOOLEAN DEFAULT FALSE,
  referencia_id INTEGER, 
  referencia_tipo VARCHAR(50), 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- posts/feed
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  autor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  autor_tipo VARCHAR(20), -- candidato, empresa
  titulo VARCHAR(200),
  conteudo TEXT NOT NULL,
  tipo VARCHAR(50), -- texto, vaga, anuncio
  imagem_url VARCHAR(255),
  likes INTEGER DEFAULT 0,
  comentarios_count INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- comentários nos posts
CREATE TABLE IF NOT EXISTS comentarios (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  autor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  autor_tipo VARCHAR(20),
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- likes nos posts
CREATE TABLE IF NOT EXISTS post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- estatísticas de uso
CREATE TABLE IF NOT EXISTS estatisticas (
  id SERIAL PRIMARY KEY,
  data DATE NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- usuarios_ativos, vagas_criadas, candidaturas_feitas, etc
  valor INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(data, tipo)
);

-- logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  acao VARCHAR(100) NOT NULL,
  tabela VARCHAR(50),
  registro_id INTEGER,
  dados_antigos JSONB,
  dados_novos JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- índices para performance
CREATE INDEX IF NOT EXISTS idx_vagas_empresa_id ON vagas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vagas_ativa ON vagas(ativa);
CREATE INDEX IF NOT EXISTS idx_candidaturas_vaga_id ON candidaturas(vaga_id);
CREATE INDEX IF NOT EXISTS idx_candidaturas_candidato_id ON candidaturas(candidato_id);
CREATE INDEX IF NOT EXISTS idx_candidaturas_status ON candidaturas(status);
CREATE INDEX IF NOT EXISTS idx_curriculos_candidato_id ON curriculos(candidato_id);
CREATE INDEX IF NOT EXISTS idx_posts_autor_id ON posts(autor_id);
CREATE INDEX IF NOT EXISTS idx_posts_tipo ON posts(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_estatisticas_data_tipo ON estatisticas(data, tipo);

-- função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidatos_updated_at BEFORE UPDATE ON candidatos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_curriculos_updated_at BEFORE UPDATE ON curriculos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vagas_updated_at BEFORE UPDATE ON vagas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidaturas_updated_at BEFORE UPDATE ON candidaturas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- usuário admin padrão
INSERT INTO users (email, password_hash, tipo) VALUES
('admin@plataforma.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeCtMQKvJaHvK8Z8O', 'admin')
ON CONFLICT (email) DO NOTHING;