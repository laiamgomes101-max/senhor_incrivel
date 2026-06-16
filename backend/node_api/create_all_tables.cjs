const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  console.log('Criando tabelas essenciais...');

  // Tabela usuarios
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      nome TEXT,
      tipo TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Erro usuarios:', err);
    else console.log('✅ Tabela usuarios criada');
  });

  // Tabela candidatos
  db.run(`
    CREATE TABLE IF NOT EXISTS candidatos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      nome TEXT NOT NULL,
      foto_perfil TEXT,
      headline TEXT,
      localizacao TEXT,
      sobre TEXT,
      linkedin_url TEXT,
      github_url TEXT,
      portfolio_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Erro candidatos:', err);
    else console.log('✅ Tabela candidatos criada');
  });

  // Tabela posts
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conteudo TEXT NOT NULL,
      imagem_url TEXT,
      tipo_autor TEXT,
      autor_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Erro posts:', err);
    else console.log('✅ Tabela posts criada');
  });

  // Tabela likes
  db.run(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      UNIQUE(post_id, user_id)
    )
  `, (err) => {
    if (err) console.error('Erro likes:', err);
    else console.log('✅ Tabela likes criada');
  });

  // Tabela comentarios
  db.run(`
    CREATE TABLE IF NOT EXISTS comentarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      user_id INTEGER,
      conteudo TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Erro comentarios:', err);
    else console.log('✅ Tabela comentarios criada');
  });

  // Tabela notificacoes
  db.run(`
    CREATE TABLE IF NOT EXISTS notificacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      tipo TEXT NOT NULL,
      titulo TEXT NOT NULL,
      mensagem TEXT,
      lida INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Erro notificacoes:', err);
    else console.log('✅ Tabela notificacoes criada');
  });

  // Tabela vagas
  db.run(`
    CREATE TABLE IF NOT EXISTS vagas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER,
      titulo TEXT NOT NULL,
      descricao TEXT,
      requisitos TEXT,
      localizacao TEXT,
      tipo_contrato TEXT,
      salario_min REAL,
      salario_max REAL,
      status TEXT DEFAULT 'ativa',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Erro vagas:', err);
    else console.log('✅ Tabela vagas criada');
  });

  // Tabela candidaturas
  db.run(`
    CREATE TABLE IF NOT EXISTS candidaturas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vaga_id INTEGER,
      candidato_id INTEGER,
      status TEXT DEFAULT 'pendente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vaga_id) REFERENCES vagas(id) ON DELETE CASCADE,
      FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE,
      UNIQUE(vaga_id, candidato_id)
    )
  `, (err) => {
    if (err) console.error('Erro candidaturas:', err);
    else console.log('✅ Tabela candidaturas criada');
  });

  setTimeout(() => {
    console.log('✅ Todas as tabelas foram criadas!');
    db.close();
  }, 1000);
});