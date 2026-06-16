#!/bin/bash
# Script de Verificação de Configuração - Plataforma de Currículos
# Execute após aplicar as correções

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}Verificação de Configuração - Plataforma ${NC}"
echo -e "${BLUE}===============================================${NC}\n"

# ==================== REDIS ====================
echo -e "${YELLOW}[1/5] Verificando Redis...${NC}"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis está rodando${NC}"
        redis-cli INFO server | grep redis_version
    else
        echo -e "${RED}✗ Redis não está respondendo${NC}"
        echo "  → Execute: redis-server (ou docker run -p 6379:6379 redis)"
    fi
else
    echo -e "${RED}✗ Redis CLI não está instalado${NC}"
fi

# ==================== NODE.JS API ====================
echo -e "\n${YELLOW}[2/5] Verificando Node.js API (.env)...${NC}"
NODE_API_DIR="backend/node_api"
if [ -f "$NODE_API_DIR/.env" ]; then
    if grep -q "REDIS_URL" "$NODE_API_DIR/.env"; then
        echo -e "${GREEN}✓ REDIS_URL configurado${NC}"
        grep "REDIS_URL" "$NODE_API_DIR/.env"
    else
        echo -e "${RED}✗ REDIS_URL não encontrado${NC}"
    fi
    
    if grep -q "OPENAI_API_KEY" "$NODE_API_DIR/.env"; then
        echo -e "${GREEN}✓ OPENAI_API_KEY configurado${NC}"
    else
        echo -e "${YELLOW}⚠ OPENAI_API_KEY não configurado (opcional para funcionalidade básica)${NC}"
    fi
else
    echo -e "${RED}✗ $NODE_API_DIR/.env não encontrado${NC}"
fi

# ==================== FLASK API ====================
echo -e "\n${YELLOW}[3/5] Verificando Flask API (.env)...${NC}"
FLASK_API_DIR="backend/flask_app"
if [ -f "$FLASK_API_DIR/.env" ]; then
    if grep -q "REDIS_URL" "$FLASK_API_DIR/.env"; then
        echo -e "${GREEN}✓ REDIS_URL configurado${NC}"
        grep "REDIS_URL" "$FLASK_API_DIR/.env"
    else
        echo -e "${RED}✗ REDIS_URL não encontrado${NC}"
    fi
    
    if grep -q "DATABASE_URL" "$FLASK_API_DIR/.env"; then
        echo -e "${GREEN}✓ DATABASE_URL configurado${NC}"
    else
        echo -e "${RED}✗ DATABASE_URL não encontrado${NC}"
    fi
else
    echo -e "${RED}✗ $FLASK_API_DIR/.env não encontrado${NC}"
fi

# ==================== SEGURANÇA ====================
echo -e "\n${YELLOW}[4/5] Verificando Segurança...${NC}"

# Checar .env.mysql
if [ -f ".env.mysql" ]; then
    if grep -q "sk-proj-" ".env.mysql" 2>/dev/null; then
        echo -e "${RED}✗ .env.mysql contém chaves reais! (Risco de segurança)${NC}"
        echo "  → Remova chaves reais do .env.mysql"
    else
        echo -e "${GREEN}✓ .env.mysql não contém chaves expostas${NC}"
    fi
else
    echo -e "${YELLOW}⚠ .env.mysql não encontrado${NC}"
fi

# Checar .gitignore
if grep -q ".env.mysql" ".gitignore" 2>/dev/null; then
    echo -e "${GREEN}✓ .gitignore protege .env.mysql${NC}"
else
    echo -e "${RED}✗ .gitignore não protege .env.mysql${NC}"
fi

# ==================== DEPENDÊNCIAS ====================
echo -e "\n${YELLOW}[5/5] Verificando Dependências...${NC}"

if [ -d "$NODE_API_DIR/node_modules" ]; then
    echo -e "${GREEN}✓ Node.js dependencies instaladas${NC}"
else
    echo -e "${RED}✗ Node.js dependencies não instaladas${NC}"
    echo "  → Execute: cd $NODE_API_DIR && npm install"
fi

if [ -d "$FLASK_API_DIR/venv" ] || [ -d "$FLASK_API_DIR/.venv" ]; then
    echo -e "${GREEN}✓ Python virtual environment existe${NC}"
else
    echo -e "${RED}✗ Python virtual environment não existe${NC}"
    echo "  → Execute: cd $FLASK_API_DIR && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
fi

# ==================== RESULTADO ====================
echo -e "\n${BLUE}===============================================${NC}"
echo -e "${BLUE}Verificação Concluída${NC}"
echo -e "${BLUE}===============================================${NC}\n"

echo -e "${YELLOW}Próximos passos recomendados:${NC}"
echo "1. Configure OPENAI_API_KEY com sua chave real"
echo "2. Certifique-se que Redis está rodando"
echo "3. Execute: npm run dev (Node.js API)"
echo "4. Execute: python run.py (Flask API em outro terminal)"
echo "5. Verifique logs para erros de conexão"
