# Script para testar Flask API
$json = @{
    curriculo_texto = "Python, SQL, 5 anos"
    vaga_requisitos = @("Python", "SQL", "Machine Learning")
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/analisar' -Method POST -ContentType 'application/json' -Body $json -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
        Write-Host "Content: $($_.Exception.Response.Content)"
    }
}
