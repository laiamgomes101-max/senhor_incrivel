#!/bin/bash
# Script para configurar cron jobs automatizados

# Configurações
PROJECT_DIR="/c/dev/plataforma-curriculos"
SCRIPTS_DIR="$PROJECT_DIR/scripts"
LOG_DIR="/var/log/plataforma-curriculos"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== CONFIGURAÇÃO DE CRON JOBS - PLATAFORMA DE CURRÍCULOS ===${NC}"
echo ""

# Criar diretórios necessários
echo "Criando diretórios..."
sudo mkdir -p $LOG_DIR
sudo mkdir -p /backups
sudo chown -R $USER:$USER /backups
sudo chown -R $USER:$USER $LOG_DIR
echo -e "${GREEN}Diretórios criados${NC}"

# Tornar scripts executáveis
echo ""
echo "Tornando scripts executáveis..."
chmod +x $SCRIPTS_DIR/*.sh
echo -e "${GREEN}Scripts executáveis${NC}"

# Criar arquivo de cron temporário
TEMP_CRON="/tmp/plataforma_cron"

# Backup do crontab atual
echo ""
echo "Fazendo backup do crontab atual..."
crontab -l > $TEMP_CRON.backup 2>/dev/null || echo "# Sem crontab anterior" > $TEMP_CRON.backup
echo -e "${GREEN}Backup criado: $TEMP_CRON.backup${NC}"

# Criar novo crontab
echo ""
echo "Configurando cron jobs..."

cat > $TEMP_CRON << EOF
# Cron jobs - Plataforma de Currículos
# Gerado automaticamente em $(date)

# Health check - A cada 5 minutos
*/5 * * * * $SCRIPTS_DIR/health-check.sh >> $LOG_DIR/health-check.log 2>&1

# Backup diário - 02:00 da manhã
0 2 * * * $SCRIPTS_DIR/backup.sh >> $LOG_DIR/backup.log 2>&1

# Backup semanal completo - Domingo 03:00
0 3 * * 0 $SCRIPTS_DIR/backup.sh full >> $LOG_DIR/backup-weekly.log 2>&1

# Limpeza de logs antigos - Todo dia 04:00
0 4 * * * find $LOG_DIR -name "*.log" -mtime +30 -delete >> $LOG_DIR/cleanup.log 2>&1

# Limpeza de backups antigos - Todo dia 05:00
0 5 * * * find /backups -name "*backup_*.gz" -mtime +7 -delete >> $LOG_DIR/cleanup.log 2>&1

# Verificação de espaço em disco - A cada hora
0 * * * * df -h / >> $LOG_DIR/disk-usage.log 2>&1

# Reinício semanal dos serviços - Domingo 06:00
0 6 * * 0 cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml restart >> $LOG_DIR/restart.log 2>&1

# Verificação de atualizações de segurança - Todo dia 01:00 (Segunda-feira)
0 1 * * 1 cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml pull >> $LOG_DIR/updates.log 2>&1

EOF

# Adicionar cron jobs existentes (se houver)
echo ""
echo "Preservando cron jobs existentes..."
if [ -s "$TEMP_CRON.backup" ] && ! grep -q "Plataforma de Currículos" "$TEMP_CRON.backup"; then
    echo "# Cron jobs existentes:" >> $TEMP_CRON
    cat $TEMP_CRON.backup >> $TEMP_CRON
    echo -e "${YELLOW}Cron jobs existentes preservados${NC}"
else
    echo -e "${GREEN}Nenhum cron job existente para preservar${NC}"
fi

# Instalar novo crontab
echo ""
echo "Instalando novo crontab..."
crontab $TEMP_CRON

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Crontab instalado com sucesso${NC}"
    
    # Mostrar cron jobs configurados
    echo ""
    echo "Cron jobs configurados:"
    echo "----------------------------------------"
    crontab -l | grep -v "^#" | grep -v "^$"
    echo "----------------------------------------"
    
    # Testar scripts
    echo ""
    echo "Testando scripts..."
    
    # Testar health check
    echo -n "Health check: "
    $SCRIPTS_DIR/health-check.sh >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${YELLOW}AVISO${NC}"
    fi
    
    # Testar backup (dry run)
    echo -n "Backup script: "
    $SCRIPTS_DIR/backup.sh --dry-run >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${YELLOW}AVISO${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}=== CONFIGURAÇÃO CONCLUÍDA COM SUCESSO ===${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Verifique os logs em: $LOG_DIR/"
    echo "2. Backups serão salvos em: /backups/"
    echo "3. Health checks rodarão a cada 5 minutos"
    echo "4. Para editar cron jobs: crontab -e"
    echo "5. Para ver logs: tail -f $LOG_DIR/health-check.log"
    echo ""
    echo "Para remover esta configuração:"
    echo "  crontab $TEMP_CRON.backup"
    
else
    echo -e "${RED}ERRO: Falha ao instalar crontab${NC}"
    echo "Verifique o arquivo: $TEMP_CRON"
    exit 1
fi

# Limpar arquivo temporário
rm -f $TEMP_CRON

echo ""
echo -e "${GREEN}Configuração concluída!${NC}"
