-- SQL de migrações para aplicar em produção (MySQL)
-- Execute como usuário com permissões de ALTER/UPDATE no banco `plataforma_curriculos`.
-- Este script aplica as alterações correspondentes às migrations:
-- b7c9a8f6d4e2 (update_photo_fields_longtext)
-- c8f7d6e5a9b1 (add_certificados_to_curriculos)
-- d1a2b3c4d5e6 (add_status_resultado_to_curriculos)

-- 1) Usar LONGTEXT para campos de imagem (candidatos.foto_url, empresas.logo_url)
ALTER TABLE candidatos MODIFY COLUMN foto_url LONGTEXT NULL;
ALTER TABLE empresas MODIFY COLUMN logo_url LONGTEXT NULL;

-- 2) Adicionar campo JSON `certificados` se não existir
ALTER TABLE curriculos ADD COLUMN IF NOT EXISTS certificados JSON NULL;

-- 3) Adicionar status_resultado e status_motivo
ALTER TABLE curriculos ADD COLUMN IF NOT EXISTS status_resultado VARCHAR(20) DEFAULT 'pendente' NULL;
ALTER TABLE curriculos ADD COLUMN IF NOT EXISTS status_motivo TEXT NULL;

-- Recomenda-se: fazer backup do banco antes de aplicar este script.
-- Exemplo de execução:
-- mysqldump -u user -p plataforma_curriculos > backup.sql
-- mysql -u user -p plataforma_curriculos < production_migrations.sql
