#!/bin/bash

# Script de Deploy para Produção
# Execute este script na raiz do projeto

echo "🚀 Iniciando deploy para produção..."

# 1. Verificar se estamos na raiz do projeto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Execute este script na raiz do projeto (onde está docker-compose.yml)"
    exit 1
fi

# 2. Verificar se .env.production existem
if [ ! -f "backend/flask_app/.env.production" ]; then
    echo "❌ Arquivo backend/flask_app/.env.production não encontrado!"
    echo "   Copie .env.example para .env.production e configure as variáveis"
    exit 1
fi

if [ ! -f "backend/node_api/.env.production" ]; then
    echo "❌ Arquivo backend/node_api/.env.production não encontrado!"
    echo "   Copie .env.example para .env.production e configure as variáveis"
    exit 1
fi

# 3. Build do Frontend
echo "📦 Fazendo build do frontend..."
cd frontend
npm install
npm run build
cd ..

# 4. Copiar arquivos .env.production para .env
echo "🔧 Configurando variáveis de ambiente..."
cp backend/flask_app/.env.production backend/flask_app/.env
cp backend/node_api/.env.production backend/node_api/.env

# 5. Build das imagens Docker
echo "🐳 Fazendo build das imagens Docker..."
docker-compose build

# 6. Executar migrations do banco
echo "🗄️ Executando migrations do banco..."
docker-compose run --rm flask flask db upgrade

# 7. Iniciar serviços
echo "▶️ Iniciando serviços..."
docker-compose up -d

# 8. Verificar se tudo está rodando
echo "🔍 Verificando status dos serviços..."
sleep 10
docker-compose ps

echo "✅ Deploy concluído!"
echo ""
echo "📋 URLs dos serviços:"
echo "   Frontend: http://localhost:5173 (ou configure seu domínio)"
echo "   Node API: http://localhost:3001"
echo "   Flask API: http://localhost:5000"
echo ""
echo "🔧 Para parar: docker-compose down"
echo "📊 Para logs: docker-compose logs -f"