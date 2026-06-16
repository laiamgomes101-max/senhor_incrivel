# Backup Script - Plataforma de Currículos (Windows PowerShell)
# Versão Windows PowerShell para compatibilidade

param(
    [switch]$dryRun,
    [string]$backupDir = "C:\backups",
    [string]$projectDir = "C:\dev\plataforma-curriculos"
)

# Configurações
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BACKUP_DIR = $backupDir
$PROJECT_DIR = $projectDir
$LOG_FILE = "$BACKUP_DIR\backup_$TIMESTAMP.log"

# Criar diretórios necessários
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

# Função de log
function Write-Log {
    param([string]$message, [string]$level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$level] $message"
    Add-Content -Path $LOG_FILE -Value $logEntry
    Write-Host $logEntry
}

# Função para backup PostgreSQL
function Backup-PostgreSQL {
    Write-Log "Iniciando backup PostgreSQL..."
    
    $pgHost = $env:DB_HOST
    $pgPort = $env:DB_PORT
    $pgUser = $env:DB_USER
    $pgPassword = $env:DB_PASSWORD
    $pgDatabase = $env:DB_NAME
    
    if ($pgUser) {
        $backupFile = "$BACKUP_DIR\postgres_backup_$TIMESTAMP.sql.gz"
        
        if (-not $dryRun) {
            try {
                $env:PGPASSWORD = $pgPassword
                $command = "pg_dump -h $pgHost -p $pgPort -U $pgUser -d $pgDatabase | gzip > `"$backupFile`""
                Write-Log "Executando: $command"
                
                # Executar backup
                $result = cmd /c $command 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "Backup PostgreSQL concluído: $backupFile"
                    return $backupFile
                } else {
                    Write-Log "Erro no backup PostgreSQL: $result" "ERROR"
                    return $null
                }
            } catch {
                Write-Log "Exceção no backup PostgreSQL: $($_.Exception.Message)" "ERROR"
                return $null
            }
        } else {
            Write-Log "DRY RUN: Simulando backup PostgreSQL para $backupFile"
            return "postgres_backup_$TIMESTAMP.sql.gz"
        }
    } else {
        Write-Log "PostgreSQL não configurado, ignorando backup"
        return $null
    }
}

# Função para backup de diretórios
function Backup-Directory {
    param([string]$sourceDir, [string]$backupName)
    
    if (Test-Path $sourceDir) {
        $backupFile = "$BACKUP_DIR\$backupName`_$TIMESTAMP.zip"
        
        if (-not $dryRun) {
            try {
                Write-Log "Compactando $sourceDir para $backupFile"
                Compress-Archive -Path $sourceDir -DestinationPath $backupFile -Force
                Write-Log "Backup de $backupName concluído: $backupFile"
                return $backupFile
            } catch {
                Write-Log "Erro no backup de $backupName`: $($_.Exception.Message)" "ERROR"
                return $null
            }
        } else {
            Write-Log "DRY RUN: Simulando backup de $backupName para $backupFile"
            return "$backupName`_$TIMESTAMP.zip"
        }
    } else {
        Write-Log "Diretório $sourceDir não encontrado, ignorando"
        return $null
    }
}

# Função para limpar backups antigos
function Clear-OldBackups {
    param([int]$daysToKeep = 7)
    
    Write-Log "Limpando backups antigos (mais de $daysToKeep dias)..."
    
    $cutoffDate = (Get-Date).AddDays(-$daysToKeep)
    $oldBackups = Get-ChildItem -Path $BACKUP_DIR -Filter "*backup_*.gz" -ErrorAction SilentlyContinue | 
                 Where-Object { $_.CreationTime -lt $cutoffDate }
    
    if ($oldBackups) {
        Write-Log "Encontrados $($oldBackups.Count) backups antigos para remover"
        
        if (-not $dryRun) {
            $oldBackups | ForEach-Object {
                Write-Log "Removendo: $($_.Name)"
                Remove-Item -Path $_.FullName -Force
            }
            Write-Log "Backups antigos removidos"
        } else {
            Write-Log "DRY RUN: Simulando remoção de $($oldBackups.Count) backups antigos"
        }
    } else {
        Write-Log "Nenhum backup antigo encontrado"
    }
}

# Função para verificar espaço em disco
function Check-DiskSpace {
    Write-Log "Verificando espaço em disco..."
    
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $freeSpace = [math]::Round($disk.FreeSpace / 1GB, 2)
    $totalSpace = [math]::Round($disk.Size / 1GB, 2)
    $usedSpace = $totalSpace - $freeSpace
    $usagePercent = [math]::Round(($usedSpace / $totalSpace) * 100, 2)
    
    Write-Log "Espaço em disco: Usado $usedSpace GB / $totalSpace GB ($usagePercent%)"
    
    if ($usagePercent -gt 90) {
        Write-Log "ALERTA: Espaço em disco crítico ($usagePercent%)" "ERROR"
        return $false
    } elseif ($usagePercent -gt 80) {
        Write-Log "AVISO: Espaço em disco baixo ($usagePercent%)" "WARN"
        return $true
    } else {
        Write-Log "Espaço em disco OK"
        return $true
    }
}

# Função principal de backup
function Start-Backup {
    Write-Log "=== INICIANDO BACKUP DA PLATAFORMA DE CURRÍCULOS ==="
    Write-Log "Timestamp: $TIMESTAMP"
    Write-Log "Dry Run: $dryRun"
    
    # Verificar espaço em disco
    if (-not (Check-DiskSpace)) {
        Write-Log "Backup cancelado devido a espaço em disco insuficiente" "ERROR"
        return $false
    }
    
    # Backup PostgreSQL
    $pgBackup = Backup-PostgreSQL
    
    # Backup de uploads
    $uploadsBackup = Backup-Directory "$PROJECT_DIR\uploads" "uploads"
    
    # Backup de logs
    $logsBackup = Backup-Directory "$PROJECT_DIR\backend\node_api\logs" "node_logs"
    $flaskLogsBackup = Backup-Directory "$PROJECT_DIR\backend\flask_app\logs" "flask_logs"
    
    # Backup de configurações (exceto arquivos sensíveis)
    $configBackup = Backup-Directory "$PROJECT_DIR\docker-compose*.yml" "docker_config"
    
    # Limpar backups antigos
    Clear-OldBackups
    
    # Resumo do backup
    Write-Log "=== RESUMO DO BACKUP ==="
    if ($pgBackup) { Write-Log "PostgreSQL: $pgBackup" }
    if ($uploadsBackup) { Write-Log "Uploads: $uploadsBackup" }
    if ($logsBackup) { Write-Log "Node.js Logs: $logsBackup" }
    if ($flaskLogsBackup) { Write-Log "Flask Logs: $flaskLogsBackup" }
    if ($configBackup) { Write-Log "Config: $configBackup" }
    
    Write-Log "=== BACKUP CONCLUÍDO ==="
    return $true
}

# Executar backup
try {
    $success = Start-Backup
    if ($success) {
        Write-Log "Backup executado com sucesso"
        exit 0
    } else {
        Write-Log "Backup falhou" "ERROR"
        exit 1
    }
} catch {
    Write-Log "Erro durante o backup: $($_.Exception.Message)" "ERROR"
    exit 1
}
