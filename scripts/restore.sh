#!/bin/bash
# Script de Restore Automatizado - Plataforma de Currículos

# Configurações
BACKUP_DIR="/backups"
PROJECT_DIR="/c/dev/plataforma-curriculos"
LOG_FILE="/var/log/restore.log"

# Função de log
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Função de restore PostgreSQL
restore_postgresql() {
    local backup_file=$1
    
    log_message "Iniciando restore PostgreSQL: $backup_file"
    
    cd $PROJECT_DIR
    
    # Verificar se o arquivo de backup existe
    if [ ! -f "$backup_file" ]; then
        log_message "ERRO: Arquivo de backup não encontrado: $backup_file"
        return 1
    fi
    
    # Descomprimir se necessário
    if [[ $backup_file == *.gz ]]; then
        log_message "Descomprimindo backup..."
        gunzip -c "$backup_file" > /tmp/restore.sql
        RESTORE_FILE="/tmp/restore.sql"
    else
        RESTORE_FILE="$backup_file"
    fi
    
    # Verificar integridade do SQL
    if ! head -n 10 "$RESTORE_FILE" | grep -q "PostgreSQL database dump"; then
        log_message "ERRO: Arquivo não parece ser um backup PostgreSQL válido"
        return 1
    fi
    
    # Parar os serviços que usam o banco
    log_message "Parando serviços Node.js e Flask..."
    docker-compose -f docker-compose.prod.yml stop node-api flask
    
    # Restaurar backup
    log_message "Restaurando banco de dados..."
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d plataforma_curriculos < "$RESTORE_FILE"
    
    if [ $? -eq 0 ]; then
        log_message "SUCESSO: Banco de dados restaurado"
        
        # Limpar arquivo temporário
        [ -f "/tmp/restore.sql" ] && rm /tmp/restore.sql
        
        # Reiniciar serviços
        log_message "Reiniciando serviços..."
        docker-compose -f docker-compose.prod.yml start node-api flask
        
        # Verificar se os serviços estão rodando
        sleep 10
        NODE_STATUS=$(docker-compose -f docker-compose.prod.yml ps node-api | grep -c "Up")
        FLASK_STATUS=$(docker-compose -f docker-compose.prod.yml ps flask | grep -c "Up")
        
        if [ $NODE_STATUS -gt 0 ] && [ $FLASK_STATUS -gt 0 ]; then
            log_message "SUCESSO: Serviços reiniciados com sucesso"
            return 0
        else
            log_message "ERRO: Falha ao reiniciar serviços"
            return 1
        fi
    else
        log_message "ERRO: Falha ao restaurar banco de dados"
        return 1
    fi
}

# Função de restore de uploads
restore_uploads() {
    local backup_file=$1
    
    log_message "Iniciando restore de uploads: $backup_file"
    
    # Verificar se o arquivo existe
    if [ ! -f "$backup_file" ]; then
        log_message "ERRO: Arquivo de backup não encontrado: $backup_file"
        return 1
    fi
    
    # Fazer backup do diretório atual
    if [ -d "$PROJECT_DIR/uploads" ]; then
        mv "$PROJECT_DIR/uploads" "$PROJECT_DIR/uploads_backup_$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Restaurar uploads
    cd $PROJECT_DIR
    tar -xzf "$backup_file"
    
    if [ $? -eq 0 ] && [ -d "$PROJECT_DIR/uploads" ]; then
        log_message "SUCESSO: Uploads restaurados"
        return 0
    else
        log_message "ERRO: Falha ao restaurar uploads"
        return 1
    fi
}

# Função de restore de logs
restore_logs() {
    local backup_file=$1
    local service=$2
    
    log_message "Iniciando restore de logs $service: $backup_file"
    
    # Verificar se o arquivo existe
    if [ ! -f "$backup_file" ]; then
        log_message "ERRO: Arquivo de backup não encontrado: $backup_file"
        return 1
    fi
    
    # Determinar diretório de destino
    if [ "$service" = "node" ]; then
        TARGET_DIR="$PROJECT_DIR/backend/node_api/logs"
    elif [ "$service" = "flask" ]; then
        TARGET_DIR="$PROJECT_DIR/backend/flask_app/logs"
    else
        log_message "ERRO: Serviço inválido: $service"
        return 1
    fi
    
    # Criar diretório se não existir
    mkdir -p "$TARGET_DIR"
    
    # Fazer backup dos logs atuais
    if [ -d "$TARGET_DIR" ] && [ "$(ls -A $TARGET_DIR)" ]; then
        mv "$TARGET_DIR" "$TARGET_DIR.backup_$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Restaurar logs
    cd $PROJECT_DIR
    tar -xzf "$backup_file"
    
    if [ $? -eq 0 ]; then
        log_message "SUCESSO: Logs $service restaurados"
        return 0
    else
        log_message "ERRO: Falha ao restaurar logs $service"
        return 1
    fi
}

# Função de restore da configuração
restore_config() {
    local backup_file=$1
    
    log_message "Iniciando restore da configuração: $backup_file"
    
    # Verificar se o arquivo existe
    if [ ! -f "$backup_file" ]; then
        log_message "ERRO: Arquivo de backup não encontrado: $backup_file"
        return 1
    fi
    
    # Restaurar configuração
    cd $PROJECT_DIR
    tar -xzf "$backup_file"
    
    if [ $? -eq 0 ]; then
        log_message "SUCESSO: Configuração restaurada"
        
        # Ajustar permissões se necessário
        chmod 600 "$PROJECT_DIR/.env" 2>/dev/null
        
        return 0
    else
        log_message "ERRO: Falha ao restaurar configuração"
        return 1
    fi
}

# Função de verificação pós-restore
verify_restore() {
    log_message "Iniciando verificação pós-restore..."
    
    # Verificar se os serviços estão rodando
    NODE_STATUS=$(docker-compose -f docker-compose.prod.yml ps node-api | grep -c "Up")
    FLASK_STATUS=$(docker-compose -f docker-compose.prod.yml ps flask | grep -c "Up")
    POSTGRES_STATUS=$(docker-compose -f docker-compose.prod.yml ps postgres | grep -c "Up")
    
    log_message "Status dos serviços: Node=$NODE_STATUS, Flask=$FLASK_STATUS, PostgreSQL=$POSTGRES_STATUS"
    
    # Verificar conectividade com o banco
    if [ $POSTGRES_STATUS -gt 0 ]; then
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U postgres >/dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_message "SUCESSO: Banco de dados está respondendo"
        else
            log_message "ERRO: Banco de dados não está respondendo"
            return 1
        fi
    fi
    
    # Verificar APIs
    if [ $NODE_STATUS -gt 0 ]; then
        curl -s http://localhost:3001/ >/dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_message "SUCESSO: API Node.js está respondendo"
        else
            log_message "ERRO: API Node.js não está respondendo"
            return 1
        fi
    fi
    
    if [ $FLASK_STATUS -gt 0 ]; then
        curl -s http://localhost:5000/ >/dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_message "SUCESSO: API Flask está respondendo"
        else
            log_message "ERRO: API Flask não está respondendo"
            return 1
        fi
    fi
    
    log_message "SUCESSO: Verificação pós-restore concluída"
    return 0
}

# Função para listar backups disponíveis
list_backups() {
    local type=$1
    
    log_message "Listando backups disponíveis:"
    
    case $type in
        "postgres")
            echo -e "\nBackups PostgreSQL:"
            ls -la $BACKUP_DIR/postgres_backup_*.sql.gz 2>/dev/null | tail -10
            ;;
        "uploads")
            echo -e "\nBackups de Uploads:"
            ls -la $BACKUP_DIR/uploads_backup_*.tar.gz 2>/dev/null | tail -10
            ;;
        "logs")
            echo -e "\nBackups de Logs:"
            ls -la $BACKUP_DIR/*_logs_backup_*.tar.gz 2>/dev/null | tail -10
            ;;
        "config")
            echo -e "\nBackups de Configuração:"
            ls -la $BACKUP_DIR/docker_config_backup_*.tar.gz 2>/dev/null | tail -10
            ;;
        *)
            echo -e "\nTodos os backups:"
            ls -la $BACKUP_DIR/*backup_* 2>/dev/null | tail -20
            ;;
    esac
}

# Função de ajuda
show_help() {
    echo "Uso: $0 [OPÇÃO] [ARQUIVO]"
    echo ""
    echo "Opções:"
    echo "  postgres <arquivo>     Restore do banco de dados PostgreSQL"
    echo "  uploads <arquivo>      Restore dos arquivos de upload"
    echo "  logs <arquivo> <tipo>  Restore dos logs (node|flask)"
    echo "  config <arquivo>      Restore da configuração"
    echo "  full <data>           Restore completo de uma data específica"
    echo "  list [tipo]           Listar backups disponíveis"
    echo "  verify                Verificar sistema atual"
    echo "  help                  Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 postgres /backups/postgres_backup_20240101_120000.sql.gz"
    echo "  $0 full 20240101"
    echo "  $0 list postgres"
}

# Função de restore completo
restore_full() {
    local date=$1
    
    log_message "Iniciando restore completo para data: $date"
    
    # Encontrar arquivos de backup da data especificada
    POSTGRES_BACKUP=$(find $BACKUP_DIR -name "postgres_backup_$date*.sql.gz" | head -1)
    UPLOADS_BACKUP=$(find $BACKUP_DIR -name "uploads_backup_$date*.tar.gz" | head -1)
    NODE_LOGS_BACKUP=$(find $BACKUP_DIR -name "node_logs_backup_$date*.tar.gz" | head -1)
    FLASK_LOGS_BACKUP=$(find $BACKUP_DIR -name "flask_logs_backup_$date*.tar.gz" | head -1)
    CONFIG_BACKUP=$(find $BACKUP_DIR -name "docker_config_backup_$date*.tar.gz" | head -1)
    
    # Verificar se todos os backups existem
    if [ ! -f "$POSTGRES_BACKUP" ]; then
        log_message "ERRO: Backup PostgreSQL não encontrado para data $date"
        return 1
    fi
    
    # Executar restores em ordem
    log_message "Executando restore completo..."
    
    # 1. Restore da configuração
    if [ -f "$CONFIG_BACKUP" ]; then
        restore_config "$CONFIG_BACKUP"
    fi
    
    # 2. Restore do banco de dados
    restore_postgresql "$POSTGRES_BACKUP"
    POSTGRES_STATUS=$?
    
    # 3. Restore dos uploads
    if [ -f "$UPLOADS_BACKUP" ]; then
        restore_uploads "$UPLOADS_BACKUP"
        UPLOADS_STATUS=$?
    else
        UPLOADS_STATUS=0
    fi
    
    # 4. Restore dos logs
    if [ -f "$NODE_LOGS_BACKUP" ]; then
        restore_logs "$NODE_LOGS_BACKUP" "node"
    fi
    
    if [ -f "$FLASK_LOGS_BACKUP" ]; then
        restore_logs "$FLASK_LOGS_BACKUP" "flask"
    fi
    
    # 5. Verificação final
    verify_restore
    VERIFY_STATUS=$?
    
    # Status final
    if [ $POSTGRES_STATUS -eq 0 ] && [ $UPLOADS_STATUS -eq 0 ] && [ $VERIFY_STATUS -eq 0 ]; then
        log_message "=== RESTORE COMPLETO CONCLUÍDO COM SUCESSO ==="
        return 0
    else
        log_message "=== RESTORE COMPLETO CONCLUÍDO COM ERROS ==="
        return 1
    fi
}

# Função principal
main() {
    # Criar diretório de log se não existir
    mkdir -p "$(dirname $LOG_FILE)"
    
    case $1 in
        "postgres")
            restore_postgresql "$2"
            ;;
        "uploads")
            restore_uploads "$2"
            ;;
        "logs")
            restore_logs "$2" "$3"
            ;;
        "config")
            restore_config "$2"
            ;;
        "full")
            restore_full "$2"
            ;;
        "list")
            list_backups "$2"
            ;;
        "verify")
            verify_restore
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_message "ERRO: Opção inválida: $1"
            show_help
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"
