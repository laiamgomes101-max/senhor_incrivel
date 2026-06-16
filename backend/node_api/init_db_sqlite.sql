-- ============================================================
-- SQLite Database Schema - Plataforma de Currículos
-- ============================================================
-- Este script deve ser executado em um banco SQLite
-- Versão simplificada compatível com SQLite (sem JSONB, TRIGGER, etc)
-- ============================================================

-- usuários gerais (candidatos/empresas/admin)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  tipo TEXT NOT NULL, -- candidato, empresa, admin
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- candidatos
CREATE TABLE IF NOT EXISTS candidatos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  nome TEXT NOT NULL,
  foto_url TEXT,
  headline TEXT,
  localizacao TEXT,
  sobre TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- empresas
CREATE TABLE IF NOT EXISTS empresas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  nome TEXT NOT NULL,
  logo_url TEXT,
  setor TEXT,
  localizacao TEXT,
  sobre TEXT,
  site_url TEXT,
  tamanho_empresa TEXT, -- startup, pequena, media, grande
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
