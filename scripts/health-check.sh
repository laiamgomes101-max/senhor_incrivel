#!/bin/bash
# Script de Health Check - Plataforma de Currículos

# Configurações
PROJECT_DIR="/c/dev/plataforma-curriculos"
LOG_FILE="/var/log/health-check.log"
WEBHOOK_URL=""  # Opcional: URL para notificações

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de log
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Função para enviar notificação
send_notification() {
    local message=$1
    local status=$2
    
    if [ -n "$WEBHOOK_URL" ]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"Health Check - $status: $message\"}" \
            >/dev/null 2>&1
    fi
}

# Função para verificar serviço
check_service() {
    local service_name=$1
    local container_name=$2
    local health_url=$3
    local expected_status=$4
    
    echo -n "Verificando $service_name... "
    
    # Verificar se o container está rodando
    cd $PROJECT_DIR
    container_status=$(docker-compose -f docker-compose.prod.yml ps "$container_name" | grep -c "Up")
    
    if [ $container_status -eq 0 ]; then
        echo -e "${RED}DOWN${NC} (Container não está rodando)"
        log_message "CRITICAL: $service_name - Container não está rodando"
        send_notification "$service_name está DOWN" "CRITICAL"
        return 2
    fi
    
    # Verificar health check via HTTP se URL fornecida
    if [ -n "$health_url" ]; then
        http_status=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" --max-time 10)
        
        if [ "$http_status" = "$expected_status" ]; then
            echo -e "${GREEN}OK${NC} (HTTP $http_status)"
            log_message "INFO: $service_name - OK (HTTP $http_status)"
            return 0
        else
            echo -e "${RED}DOWN${NC} (HTTP $http_status, esperado $expected_status)"
            log_message "CRITICAL: $service_name - HTTP $http_status (esperado $expected_status)"
            send_notification "$service_name está DOWN (HTTP $http_status)" "CRITICAL"
            return 2
        fi
    else
        echo -e "${GREEN}OK${NC} (Container rodando)"
        log_message "INFO: $service_name - OK (Container rodando)"
        return 0
    fi
}

# Função para verificar banco de dados
check_database() {
    echo -n "Verificando PostgreSQL... "
    
    cd $PROJECT_DIR
    
    # Verificar se o container está rodando
    container_status=$(docker-compose -f docker-compose.prod.yml ps postgres | grep -c "Up")
    
    if [ $container_status -eq 0 ]; then
        echo -e "${RED}DOWN${NC} (Container não está rodando)"
        log_message "CRITICAL: PostgreSQL - Container não está rodando"
        send_notification "PostgreSQL está DOWN" "CRITICAL"
        return 2
    fi
    
    # Verificar se o banco está aceitando conexões
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U postgres >/dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}OK${NC} (Aceitando conexões)"
        log_message "INFO: PostgreSQL - OK (Aceitando conexões)"
        
        # Verificar número de conexões
        connections=$(docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ')
        log_message "INFO: PostgreSQL - $connections conexões ativas"
        
        return 0
    else
        echo -e "${RED}DOWN${NC} (Não está aceitando conexões)"
        log_message "CRITICAL: PostgreSQL - Não está aceitando conexões"
        send_notification "PostgreSQL está DOWN" "CRITICAL"
        return 2
    fi
}

# Função para verificar espaço em disco
check_disk_space() {
    echo -n "Verificando espaço em disco... "
    
    # Verificar espaço no diretório principal
    disk_usage=$(df $PROJECT_DIR | awk 'NR==2 {print $5}' | sed 's/%//')
    available_space=$(df $PROJECT_DIR | awk 'NR==2 {print $4}')
    
    if [ $disk_usage -gt 90 ]; then
        echo -e "${RED}CRITICAL${NC} (${disk_usage}% usado)"
        log_message "CRITICAL: Espaço em disco - ${disk_usage}% usado"
        send_notification "Espaço em disco crítico: ${disk_usage}% usado" "CRITICAL"
        return 2
    elif [ $disk_usage -gt 80 ]; then
        echo -e "${YELLOW}WARNING${NC} (${disk_usage}% usado)"
        log_message "WARNING: Espaço em disco - ${disk_usage}% usado"
        send_notification "Espaço em disco baixo: ${disk_usage}% usado" "WARNING"
        return 1
    else
        echo -e "${GREEN}OK${NC} (${disk_usage}% usado)"
        log_message "INFO: Espaço em disco - ${disk_usage}% usado"
        return 0
    fi
}

# Função para verificar uso de memória
check_memory() {
    echo -n "Verificando uso de memória... "
    
    # Verificar uso de memória do sistema
    memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ $memory_usage -gt 90 ]; then
        echo -e "${RED}CRITICAL${NC} (${memory_usage}% usado)"
        log_message "CRITICAL: Memória - ${memory_usage}% usado"
        send_notification "Uso de memória crítico: ${memory_usage}% usado" "CRITICAL"
        return 2
    elif [ $memory_usage -gt 80 ]; then
        echo -e "${YELLOW}WARNING${NC} (${memory_usage}% usado)"
        log_message "WARNING: Memória - ${memory_usage}% usado"
        return 1
    else
        echo -e "${GREEN}OK${NC} (${memory_usage}% usado)"
        log_message "INFO: Memória - ${memory_usage}% usado"
        return 0
    fi
}

# Função para verificar uso de CPU
check_cpu() {
    echo -n "Verificando uso de CPU... "
    
    # Verificar uso de CPU (média dos últimos 5 minutos)
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    
    # Converter para número inteiro
    cpu_usage_int=$(echo "$cpu_usage" | cut -d. -f1)
    
    if [ $cpu_usage_int -gt 90 ]; then
        echo -e "${RED}CRITICAL${NC} (${cpu_usage}% usado)"
        log_message "CRITICAL: CPU - ${cpu_usage}% usado"
        send_notification "Uso de CPU crítico: ${cpu_usage}% usado" "CRITICAL"
        return 2
    elif [ $cpu_usage_int -gt 80 ]; then
        echo -e "${YELLOW}WARNING${NC} (${cpu_usage}% usado)"
        log_message "WARNING: CPU - ${cpu_usage}% usado"
        return 1
    else
        echo -e "${GREEN}OK${NC} (${cpu_usage}% usado)"
        log_message "INFO: CPU - ${cpu_usage}% usado"
        return 0
    fi
}

# Função para verificar logs de erros recentes
check_error_logs() {
    echo -n "Verificando logs de erros... "
    
    cd $PROJECT_DIR
    
    # Verificar logs de erros do Node.js (últimas 2 horas)
    node_errors=0
    if [ -f "backend/node_api/logs/error.log" ]; then
        node_errors=$(find backend/node_api/logs -name "*.log" -mmin -120 -exec grep -l "ERROR\|CRITICAL" {} \; | wc -l)
    fi
    
    # Verificar logs de erros do Flask (últimas 2 horas)
    flask_errors=0
    if [ -f "backend/flask_app/logs/error.log" ]; then
        flask_errors=$(find backend/flask_app/logs -name "*.log" -mmin -120 -exec grep -l "ERROR\|CRITICAL" {} \; | wc -l)
    fi
    
    total_errors=$((node_errors + flask_errors))
    
    if [ $total_errors -gt 10 ]; then
        echo -e "${RED}CRITICAL${NC} ($total_errors erros nas últimas 2 horas)"
        log_message "CRITICAL: Logs - $total_errors erros nas últimas 2 horas"
        send_notification "Muitos erros nos logs: $total_errors" "CRITICAL"
        return 2
    elif [ $total_errors -gt 5 ]; then
        echo -e "${YELLOW}WARNING${NC} ($total_errors erros nas últimas 2 horas)"
        log_message "WARNING: Logs - $total_errors erros nas últimas 2 horas"
        return 1
    else
        echo -e "${GREEN}OK${NC} ($total_errors erros nas últimas 2 horas)"
        log_message "INFO: Logs - $total_errors erros nas últimas 2 horas"
        return 0
    fi
}

# Função para verificar métricas
check_metrics() {
    echo -n "Verificando métricas... "
    
    # Verificar se o endpoint de métricas está respondendo
    node_metrics_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/metrics" --max-time 5)
    flask_metrics_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/metrics" --max-time 5)
    
    if [ "$node_metrics_status" = "200" ] && [ "$flask_metrics_status" = "200" ]; then
        echo -e "${GREEN}OK${NC} (Métricas disponíveis)"
        log_message "INFO: Métricas - OK (Node.js e Flask)"
        return 0
    else
        echo -e "${YELLOW}WARNING${NC} (Node: $node_metrics_status, Flask: $flask_metrics_status)"
        log_message "WARNING: Métricas - Node: $node_metrics_status, Flask: $flask_metrics_status"
        return 1
    fi
}

# Função principal
main() {
    local overall_status=0
    
    echo "=== HEALTH CHECK - PLATAFORMA DE CURRÍCULOS ==="
    echo "Data: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Criar diretório de log se não existir
    mkdir -p "$(dirname $LOG_FILE)"
    
    # Executar verificações
    check_service "Nginx" "nginx" "http://localhost:80" "200"
    nginx_status=$?
    overall_status=$((overall_status + nginx_status))
    
    check_service "Node.js API" "node-api" "http://localhost:3001/" "200"
    node_status=$?
    overall_status=$((overall_status + node_status))
    
    check_service "Flask API" "flask" "http://localhost:5000/" "200"
    flask_status=$?
    overall_status=$((overall_status + flask_status))
    
    check_database
    db_status=$?
    overall_status=$((overall_status + db_status))
    
    check_disk_space
    disk_status=$?
    overall_status=$((overall_status + disk_status))
    
    check_memory
    memory_status=$?
    overall_status=$((overall_status + memory_status))
    
    check_cpu
    cpu_status=$?
    overall_status=$((overall_status + cpu_status))
    
    check_error_logs
    logs_status=$?
    overall_status=$((overall_status + logs_status))
    
    check_metrics
    metrics_status=$?
    overall_status=$((overall_status + metrics_status))
    
    echo ""
    echo "=== RESUMO ==="
    
    if [ $overall_status -eq 0 ]; then
        echo -e "Status geral: ${GREEN}TUDO OK${NC}"
        log_message "INFO: Health check concluído - TUDO OK"
        send_notification "Health check concluído - TUDO OK" "INFO"
        exit 0
    elif [ $overall_status -le 4 ]; then
        echo -e "Status geral: ${YELLOW}AVISO${NC} (Alguns warnings)"
        log_message "WARNING: Health check concluído - Alguns warnings"
        send_notification "Health check concluído - Alguns warnings" "WARNING"
        exit 1
    else
        echo -e "Status geral: ${RED}CRÍTICO${NC} (Problemas detectados)"
        log_message "CRITICAL: Health check concluído - Problemas detectados"
        send_notification "Health check concluído - Problemas detectados" "CRITICAL"
        exit 2
    fi
}

# Executar função principal
main "$@"
