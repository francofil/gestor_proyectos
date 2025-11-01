# Fix line endings and restart containers
Write-Host 'Convirtiendo archivos a LF...' -ForegroundColor Yellow
Get-ChildItem -Path docker -Filter *.sh | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "``
", "`
"
    [System.IO.File]::WriteAllText($_.FullName, $content)
    Write-Host "  Convertido: $($_.Name)" -ForegroundColor Green
}

Write-Host '
Bajando contenedores...' -ForegroundColor Yellow
docker-compose down -v

Write-Host '
Levantando contenedores...' -ForegroundColor Yellow
docker-compose up -d

Write-Host '
Esperando 10 segundos...' -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host '
Estado de los contenedores:' -ForegroundColor Yellow
docker-compose ps

Write-Host '
Logs de la replica:' -ForegroundColor Yellow
docker-compose logs --tail=50 db-replica
