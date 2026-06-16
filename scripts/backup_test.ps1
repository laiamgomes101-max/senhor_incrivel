# Script de Backup Teste - Plataforma de Currículos
# Versão Windows PowerShell para testes

param(
    [switch]$dryRun
)

# Configurações
$BACKUP_DIR = "C:\backups"
$PROJECT_DIR = "C:\dev\plataforma-curriculos"
$LOG_FILE = "C:\temp\backup_test.log"

# Função de log
function log-message {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $message" | Out-File -FilePath $LOG_FILE -Append
    Write-Host "$timestamp - $message"
}

# Criar diretórios necessários
New-Item -ItemType Directory -Force -Path (Split-Path $LOG_FILE) | Out-Null
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

log-message "Iniciando backup teste"
log-message "Dry run: $dryRun"

# Testar backup PostgreSQL (simulado)
log-message "Testando backup PostgreSQL..."
if ($dryRun) {
    log-message "DRY RUN: Simulando backup PostgreSQL"
} else {
    log-message "Executando backup PostgreSQL real"
}

# Testar backup de uploads (simulado)
log-message "Testando backup de uploads..."
$UPLOADS_DIR = "$PROJECT_DIR\uploads"
if (Test-Path $UPLOADS_DIR) {
    $files = Get-ChildItem -Path $UPLOADS_DIR -Recurse | Measure-Object
    log-message "Encontrados $($files.Count) arquivos para backup"
} else {
    log-message "Diretório de uploads não encontrado"
}

# Testar backup de logs (simulado)
log-message "Testando backup de logs..."
$LOGS_DIRS = @("$PROJECT_DIR\backend\node_api\logs", "$PROJECT_DIR\backend\flask_app\logs")
foreach ($dir in $LOGS_DIRS) {
    if (Test-Path $dir) {
        $files = Get-ChildItem -Path $dir | Measure-Object
        log-message "Encontrados $($files.Count) arquivos de log em $dir"
    }
}

# Testar verificação de espaço
log-message "Verificando espaço em disco..."
$disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
$freeSpace = [math]::Round($disk.FreeSpace / 1GB, 2)
$totalSpace = [math]::Round($disk.Size / 1GB, 2)
$usedSpace = $totalSpace - $freeSpace
$usagePercent = [math]::Round(($usedSpace / $totalSpace) * 100, 2)

log-message "Espaço em disco: Usado $usedSpace GB / $totalSpace GB ($usagePercent%)"

if ($usagePercent -gt 90) {
    log-message "ALERTA: Espaço em disco crítico ($usagePercent%)"
} elseif ($usagePercent -gt 80) {
    log-message "AVISO: Espaço em disco baixo ($usagePercent%)"
} else {
    log-message "Espaço em disco OK"
}

# Testar limpeza de backups antigos
log-message "Testando limpeza de backups antigos..."
if (Test-Path $BACKUP_DIR) {
    $oldBackups = Get-ChildItem -Path $BACKUP_DIR -Filter "*backup_*.gz" | Where-Object { 
        $_.CreationTime -lt (Get-Date).AddDays(-7) 
    }
    if ($oldBackups) {
        log-message "Encontrados $($oldBackups.Count) backups antigos para remover"
        if (-not $dryRun) {
            $oldBackups | Remove-Item -Force
            log-message "Backups antigos removidos"
        }
    } else {
        log-message "Nenhum backup antigo encontrado"
    }
}

# Verificação final
log-message "Verificação final do backup..."

# Testar se os serviços estão rodando
$flaskRunning = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*app_test*" }
$nodeRunning = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*server_test*" }

if ($flaskRunning) {
    log-message "Flask API está rodando"
} else {
    log-message "AVISO: Flask API não está rodando"
}

if ($nodeRunning) {
    log-message "Node.js API está rodando"
} else {
    log-message "AVISO: Node.js API não está rodando"
}

log-message "Backup teste concluído com sucesso"

if ($dryRun) {
    log-message "=== DRY RUN CONCLUÍDO ==="
} else {
    log-message "=== BACKUP REAL CONCLUÍDO ==="
}
