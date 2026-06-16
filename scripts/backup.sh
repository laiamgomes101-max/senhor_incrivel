#!/bin/bash
# Script de Backup Automatizado - Plataforma de Currículos

# Configurações
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
PROJECT_DIR="/c/dev/plataforma-curriculos"
LOG_FILE="/var/log/backup.log"

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Função de log
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Função de backup do PostgreSQL
backup_postgresql() {
    log_message "Iniciando backup PostgreSQL..."
    
    cd $PROJECT_DIR
    
    # Verificar se o container PostgreSQL está rodando
    if ! docker-compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
        log_message "ERRO: Container PostgreSQL não está rodando"
        return 1
    fi
    
    # Criar backup
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres plataforma_curriculos > $BACKUP_DIR/postgres_backup_$DATE.sql
    
    if [ $? -eq 0 ]; then
        # Comprimir backup
        gzip $BACKUP_DIR/postgres_backup_$DATE.sql
        
        # Verificar integridade
        if [ -f "$BACKUP_DIR/postgres_backup_$DATE.sql.gz" ]; then
            SIZE=$(du -h $BACKUP_DIR/postgres_backup_$DATE.sql.gz | cut -f1)
            log_message "Backup PostgreSQL concluído: postgres_backup_$DATE.sql.gz ($SIZE)"
        else
            log_message "ERRO: Arquivo de backup PostgreSQL não foi criado"
            return 1
        fi
    else
        log_message "ERRO: Falha ao criar backup PostgreSQL"
        return 1
    fi
}

# Função de backup dos arquivos de upload
backup_uploads() {
    log_message "Iniciando backup dos arquivos de upload..."
    
    # Backup da pasta uploads
    if [ -d "$PROJECT_DIR/uploads" ]; then
        tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz -C $PROJECT_DIR uploads/
        
        if [ $? -eq 0 ]; then
            SIZE=$(du -h $BACKUP_DIR/uploads_backup_$DATE.tar.gz | cut -f1)
            log_message "Backup de uploads concluído: uploads_backup_$DATE.tar.gz ($SIZE)"
        else
            log_message "ERRO: Falha ao criar backup de uploads"
            return 1
        fi
    else
        log_message "AVISO: Diretório uploads não encontrado"
    fi
}

# Função de backup dos logs
backup_logs() {
    log_message "Iniciando backup dos logs..."
    
    # Backup dos logs do Node.js
    if [ -d "$PROJECT_DIR/backend/node_api/logs" ]; then
        tar -czf $BACKUP_DIR/node_logs_backup_$DATE.tar.gz -C $PROJECT_DIR/backend/node_api logs/
        
        if [ $? -eq 0 ]; then
            SIZE=$(du -h $BACKUP_DIR/node_logs_backup_$DATE.tar.gz | cut -f1)
            log_message "Backup de logs Node.js concluído: node_logs_backup_$DATE.tar.gz ($SIZE)"
        fi
    fi
    
    # Backup dos logs do Flask
    if [ -d "$PROJECT_DIR/backend/flask_app/logs" ]; then
        tar -czf $BACKUP_DIR/flask_logs_backup_$DATE.tar.gz -C $PROJECT_DIR/backend/flask_app logs/
        
        if [ $? -eq 0 ]; then
            SIZE=$(du -h $BACKUP_DIR/flask_logs_backup_$DATE.tar.gz | cut -f1)
            log_message "Backup de logs Flask concluído: flask_logs_backup_$DATE.tar.gz ($SIZE)"
        fi
    fi
}

# Função de backup da configuração
backup_config() {
    log_message "Iniciando backup da configuração..."
    
    # Backup do arquivo .env (sem secrets)
    if [ -f "$PROJECT_DIR/.env" ]; then
        # Criar versão sem secrets
        grep -v -E "(SECRET_KEY|JWT_SECRET|OPENAI_API_KEY|PASSWORD)" $PROJECT_DIR/.env > $BACKUP_DIR/config_backup_$DATE.env
        
        if [ $? -eq 0 ]; then
            log_message "Backup da configuração concluído: config_backup_$DATE.env"
        fi
    fi
    
    # Backup dos arquivos Docker
    tar -czf $BACKUP_DIR/docker_config_backup_$DATE.tar.gz -C $PROJECT_DIR docker-compose*.yml nginx/
    
    if [ $? -eq 0 ]; then
        SIZE=$(du -h $BACKUP_DIR/docker_config_backup_$DATE.tar.gz | cut -f1)
        log_message "Backup da configuração Docker concluído: docker_config_backup_$DATE.tar.gz ($SIZE)"
    fi
}

# Função de limpeza de backups antigos
cleanup_old_backups() {
    log_message "Iniciando limpeza de backups antigos..."
    
    # Manter apenas os últimos 7 dias
    find $BACKUP_DIR -name "postgres_backup_*.sql.gz" -mtime +7 -delete
    find $BACKUP_DIR -name "uploads_backup_*.tar.gz" -mtime +7 -delete
    find $BACKUP_DIR -name "*_logs_backup_*.tar.gz" -mtime +7 -delete
    find $BACKUP_DIR -name "config_backup_*.env" -mtime +7 -delete
    find $BACKUP_DIR -name "docker_config_backup_*.tar.gz" -mtime +7 -delete
    
    # Contar backups restantes
    POSTGRES_COUNT=$(find $BACKUP_DIR -name "postgres_backup_*.sql.gz" | wc -l)
    UPLOADS_COUNT=$(find $BACKUP_DIR -name "uploads_backup_*.tar.gz" | wc -l)
    
    log_message "Limpeza concluída. Backups restantes: PostgreSQL=$POSTGRES_COUNT, Uploads=$UPLOADS_COUNT"
}

# Função de verificação de backup
verify_backup() {
    log_message "Iniciando verificação de backup..."
    
    # Verificar se os arquivos de backup existem e não estão vazios
    BACKUP_FILES=(
        "$BACKUP_DIR/postgres_backup_$DATE.sql.gz"
        "$BACKUP_DIR/uploads_backup_$DATE.tar.gz"
        "$BACKUP_DIR/node_logs_backup_$DATE.tar.gz"
        "$BACKUP_DIR/flask_logs_backup_$DATE.tar.gz"
        "$BACKUP_DIR/docker_config_backup_$DATE.tar.gz"
    )
    
    ALL_VALID=true
    
    for file in "${BACKUP_FILES[@]}"; do
        if [ -f "$file" ] && [ -s "$file" ]; then
            log_message "OK: $file ($(du -h $file | cut -f1))"
        else
            log_message "ERRO: $file não existe ou está vazio"
            ALL_VALID=false
        fi
    done
    
    if [ "$ALL_VALID" = true ]; then
        log_message "SUCESSO: Todos os backups foram verificados"
        return 0
    else
        log_message "ERRO: Alguns backups falharam na verificação"
        return 1
    fi
}

# Função principal
main() {
    log_message "=== INÍCIO DO BACKUP AUTOMÁTICO ==="
    
    # Verificar espaço em disco
    AVAILABLE_SPACE=$(df $BACKUP_DIR | awk 'NR==2 {print $4}')
    REQUIRED_SPACE=1048576  # 1GB em KB
    
    if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
        log_message "ERRO: Espaço em disco insuficiente (${AVAILABLE_SPACE}KB disponível)"
        exit 1
    fi
    
    # Executar backups
    backup_postgresql
    POSTGRES_STATUS=$?
    
    backup_uploads
    UPLOADS_STATUS=$?
    
    backup_logs
    LOGS_STATUS=$?
    
    backup_config
    CONFIG_STATUS=$?
    
    # Verificar backup
    verify_backup
    VERIFY_STATUS=$?
    
    # Limpar backups antigos
    cleanup_old_backups
    
    # Status final
    if [ $POSTGRES_STATUS -eq 0 ] && [ $UPLOADS_STATUS -eq 0 ] && [ $CONFIG_STATUS -eq 0 ] && [ $VERIFY_STATUS -eq 0 ]; then
        log_message "=== BACKUP CONCLUÍDO COM SUCESSO ==="
        
        # Calcular tamanho total dos backups
        TOTAL_SIZE=$(du -sh $BACKUP_DIR/*backup_$DATE* 2>/dev/null | awk '{sum+=$1} END {print sum}')"B"
        log_message "Tamanho total do backup: $TOTAL_SIZE"
        
        exit 0
    else
        log_message "=== BACKUP CONCLUÍDO COM ERROS ==="
        exit 1
    fi
}

# Executar função principal
main "$@"
