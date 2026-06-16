const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS empresas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      nome TEXT NOT NULL,
      logo_url TEXT,
      setor TEXT,
      localizacao TEXT,
      sobre TEXT,
      site_url TEXT,
      tamanho_empresa TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela empresas:', err);
    } else {
      console.log('✅ Tabela empresas criada com sucesso!');
    }
    db.close();
  });
});