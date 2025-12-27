# ============================================================
# TwoBolsos - Script de Build e Deploy
# ============================================================
# Este script prepara o projeto para deploy na Square Cloud
# Executa: PowerShell .\build_deploy.ps1
# ============================================================

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   TwoBolsos - Build para Square Cloud   " -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Build do Frontend
Write-Host "[1/3] Buildando Frontend React..." -ForegroundColor Yellow
Set-Location front_end
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Build do frontend falhou!" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "Frontend buildado com sucesso!" -ForegroundColor Green
Write-Host ""

# 2. Verificar arquivos
Write-Host "[2/3] Verificando arquivos..." -ForegroundColor Yellow
if (Test-Path "front_end/dist/index.html") {
    Write-Host "  index.html OK" -ForegroundColor Green
} else {
    Write-Host "  ERRO: index.html nao encontrado!" -ForegroundColor Red
    exit 1
}
if (Test-Path "squarecloud.app") {
    Write-Host "  squarecloud.app OK" -ForegroundColor Green
} else {
    Write-Host "  ERRO: squarecloud.app nao encontrado!" -ForegroundColor Red
    exit 1
}
if (Test-Path "main.py") {
    Write-Host "  main.py OK" -ForegroundColor Green
} else {
    Write-Host "  ERRO: main.py nao encontrado!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 3. Instruções de commit
Write-Host "[3/3] Pronto para deploy!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Agora execute:" -ForegroundColor Cyan
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'build: preparando para Square Cloud'" -ForegroundColor White
Write-Host "  git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "Depois, na Square Cloud:" -ForegroundColor Cyan
Write-Host "  1. Va em squarecloud.app/dashboard" -ForegroundColor White
Write-Host "  2. Clique em 'Add Application'" -ForegroundColor White
Write-Host "  3. Selecione 'Import from GitHub'" -ForegroundColor White
Write-Host "  4. Escolha o repositorio TwoBolsos" -ForegroundColor White
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   Build concluido com sucesso!          " -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
