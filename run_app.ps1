# Script para executar a aplicação Flask com Python via Microsoft Store removido
# Ativa o ambiente virtual e inicia a aplicação

$ErrorActionPreference = "Stop"

try {
    # Navegar para o diretório da aplicação
    Set-Location "C:\dev\plataforma-curriculos\backend\flask_app"
    
    # Tentar ativar o ambiente virtual
    $venvPath = ".venv\Scripts\Activate.ps1"
    if (Test-Path $venvPath) {
        Write-Host "Ativando ambiente virtual..." -ForegroundColor Green
        & $venvPath
    }
    
    # Executar com Python direto
    Write-Host "Iniciando aplicação Flask..." -ForegroundColor Green
    
    # Se estamos em um venv ativado, python deve estar disponível
    python app.py
}
catch {
    Write-Host "Erro: $_" -ForegroundColor Red
    Write-Host "`nTentando solução alternativa..." -ForegroundColor Yellow
    
    # Solução alternativa: reinstalar venv
    Write-Host "Reinstalando ambiente virtual..." -ForegroundColor Yellow
    
    # Remover venv antigo
    if (Test-Path ".venv") {
        Remove-Item ".venv" -Recurse -Force
    }
    
    # Criar novo venv
    python -m venv .venv
    
    # Ativar novo venv
    & ".venv\Scripts\Activate.ps1"
    
    # Instalar requisitos
    pip install --upgrade pip
    if (Test-Path "requirements.txt") {
        pip install -r requirements.txt
    }
    
    # Executar aplicação
    python app.py
}
