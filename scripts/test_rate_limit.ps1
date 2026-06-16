# Script para testar Rate Limiting

Write-Host "=== TESTE DE RATE LIMITING ===" -ForegroundColor Green
Write-Host ""

# Testar rota livre
Write-Host "1. Testando rota livre (/free):" -ForegroundColor Yellow
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3001/free' -UseBasicParsing
        Write-Host "Requisição $i: $($response.StatusCode) - OK"
    } catch {
        Write-Host "Requisição $i: ERRO - $($_.Exception.Message)"
    }
}

Write-Host ""

# Testar rota com rate limiting
Write-Host "2. Testando rota com rate limiting (/limited):" -ForegroundColor Yellow
for ($i = 1; $i -le 15; $i++) {
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3001/limited' -UseBasicParsing
        Write-Host "Requisição $i: $($response.StatusCode) - OK"
    } catch {
        if ($_.Exception.Response) {
            Write-Host "Requisição $i: $($_.Exception.Response.StatusCode) - Rate Limit!"
        } else {
            Write-Host "Requisição $i: ERRO - $($_.Exception.Message)"
        }
    }
    Start-Sleep -Milliseconds 100
}

Write-Host ""

# Testar rate limiting de autenticação
Write-Host "3. Testando rate limiting de autenticação (/api/auth/login):" -ForegroundColor Yellow

$body = @{
    email = 'test@example.com'
    password = 'wrongpassword'
} | ConvertTo-Json -Depth 3

for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/auth/login' -Method POST -ContentType 'application/json' -Body $body -UseBasicParsing
        Write-Host "Login $i: $($response.StatusCode) - $($response.Content | ConvertFrom-Json).message"
    } catch {
        if ($_.Exception.Response) {
            $content = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($content)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Login $i: $($_.Exception.Response.StatusCode) - Rate Limit!"
        } else {
            Write-Host "Login $i: ERRO - $($_.Exception.Message)"
        }
    }
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "=== TESTE CONCLUÍDO ===" -ForegroundColor Green
