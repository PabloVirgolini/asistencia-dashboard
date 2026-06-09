# Script para ejecutar el Dashboard en desarrollo en Windows
# Uso: .\dev-windows.ps1

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Dashboard de Asistencia - Modo Desarrollo" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que pnpm está instalado
Write-Host "Verificando pnpm..." -ForegroundColor Yellow
$pnpmVersion = pnpm --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ pnpm $pnpmVersion instalado" -ForegroundColor Green
} else {
    Write-Host "✗ pnpm no está instalado" -ForegroundColor Red
    Write-Host "Instálalo con: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

# Verificar que node_modules existe
Write-Host ""
Write-Host "Verificando dependencias..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✓ Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "✗ Dependencias no encontradas" -ForegroundColor Red
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Error al instalar dependencias" -ForegroundColor Red
        exit 1
    }
}

# Verificar que data2.db existe
Write-Host ""
Write-Host "Verificando base de datos..." -ForegroundColor Yellow
if (Test-Path "data2.db") {
    Write-Host "✓ Base de datos encontrada" -ForegroundColor Green
} else {
    Write-Host "⚠ Advertencia: data2.db no encontrado" -ForegroundColor Yellow
    Write-Host "El dashboard puede no mostrar datos" -ForegroundColor Yellow
}

# Iniciar el servidor
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Iniciando servidor..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "El servidor estará disponible en:" -ForegroundColor Green
Write-Host "http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

# Establecer NODE_ENV y ejecutar
$env:NODE_ENV = "development"
pnpm exec tsx watch server/_core/index.ts
