-- Script para criar banco de dados local MySQL
-- Execute este script no MySQL local

-- Criar banco de dados se não existir
CREATE DATABASE IF NOT EXISTS plataforma_curriculos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar o banco
USE plataforma_curriculos;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL COMMENT 'candidato, empresa, admin',
    nome VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de candidatos
CREATE TABLE IF NOT EXISTS candidatos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    nome VARCHAR(255) NOT NULL,
    foto_url VARCHAR(500),
    headline VARCHAR(255),
    localizacao VARCHAR(255),
    sobre TEXT,
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_candidatos_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    nome VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    setor VARCHAR(100),
    localizacao VARCHAR(255),
    sobre TEXT,
    site_url VARCHAR(500),
    tamanho_empresa VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_empresas_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de vagas
CREATE TABLE IF NOT EXISTS vagas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    requisitos JSON,
    beneficios JSON,
    tipo_contrato VARCHAR(50) COMMENT 'clt, pj, internship',
    localizacao VARCHAR(255),
    modalidade VARCHAR(50) COMMENT 'remote, hybrid, office',
    salario_min DECIMAL(10,2),
    salario_max DECIMAL(10,2),
    nivel VARCHAR(50) COMMENT 'junior, mid, senior',
    ativa BOOLEAN DEFAULT TRUE,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    INDEX idx_vagas_empresa_id (empresa_id),
    INDEX idx_vagas_ativa (ativa),
    INDEX idx_vagas_modalidade (modalidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de currículos
CREATE TABLE IF NOT EXISTS curriculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidato_id INT,
    experiencia JSON,
    educacao JSON,
    habilidades JSON,
    idiomas JSON,
    certificacoes JSON,
    arquivo_url VARCHAR(500),
    arquivo_nome VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE,
    INDEX idx_curriculos_candidato_id (candidato_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de candidaturas
CREATE TABLE IF NOT EXISTS candidaturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vaga_id INT,
    candidato_id INT,
    status VARCHAR(50) DEFAULT 'pendente' COMMENT 'pending, viewed, interviewing, rejected, hired',
    score_analise DECIMAL(5,2),
    feedback TEXT,
    curriculo_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vaga_id) REFERENCES vagas(id) ON DELETE CASCADE,
    FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE,
    FOREIGN KEY (curriculo_id) REFERENCES curriculos(id) ON DELETE SET NULL,
    INDEX idx_candidaturas_vaga_id (vaga_id),
    INDEX idx_candidaturas_candidato_id (candidato_id),
    INDEX idx_candidaturas_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de posts (feed social)
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    autor_id INT,
    tipo_autor VARCHAR(20) NOT NULL,
    conteudo TEXT NOT NULL,
    imagem_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (autor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_posts_autor_id (autor_id),
    INDEX idx_posts_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de comentários
CREATE TABLE IF NOT EXISTS comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT,
    autor_id INT,
    tipo_autor VARCHAR(20) NOT NULL,
    conteudo TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (autor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_comentarios_post_id (post_id),
    INDEX idx_comentarios_autor_id (autor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de likes
CREATE TABLE IF NOT EXISTS likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_likes_post_id (post_id),
    INDEX idx_likes_user_id (user_id),
    UNIQUE KEY unique_like (post_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) COMMENT 'candidatura, mensagem, sistema',
    lida BOOLEAN DEFAULT FALSE,
    referencia_id INT,
    referencia_tipo VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notificacoes_user_id (user_id),
    INDEX idx_notificacoes_lida (lida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir usuário admin padrão
INSERT INTO users (email, password_hash, tipo, nome) VALUES 
('admin@plataforma.com', '$2b$10$rQZ8kKQZ8kKQZ8kKQZ8OZ8kKQZ8kKQZ8kKQZ8kKQZ8kKQZ8', 'admin', 'Administrador')
ON DUPLICATE KEY UPDATE email = email;

-- Mostrar resultado
SELECT 'Banco de dados plataforma_curriculos criado com sucesso!' as mensagem;
SELECT COUNT(*) as total_tabelas FROM information_schema.tables WHERE table_schema = 'plataforma_curriculos';
