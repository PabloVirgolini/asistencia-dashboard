@echo off
REM Script para ejecutar el Dashboard en desarrollo en Windows CMD
REM Uso: dev-windows.bat

echo.
echo ======================================
echo Dashboard de Asistencia - Modo Desarrollo
echo ======================================
echo.

REM Verificar que pnpm está instalado
echo Verificando pnpm...
call pnpm --version >nul 2>&1
if errorlevel 1 (
    echo X pnpm no está instalado
    echo Instálalo con: npm install -g pnpm
    pause
    exit /b 1
)
echo OK - pnpm instalado

REM Verificar que node_modules existe
echo.
echo Verificando dependencias...
if exist "node_modules" (
    echo OK - Dependencias instaladas
) else (
    echo X Dependencias no encontradas
    echo Instalando dependencias...
    call pnpm install
    if errorlevel 1 (
        echo X Error al instalar dependencias
        pause
        exit /b 1
    )
)

REM Verificar que data2.db existe
echo.
echo Verificando base de datos...
if exist "data2.db" (
    echo OK - Base de datos encontrada
) else (
    echo ! Advertencia: data2.db no encontrado
    echo El dashboard puede no mostrar datos
)

REM Iniciar el servidor
echo.
echo ======================================
echo Iniciando servidor...
echo ======================================
echo.
echo El servidor estará disponible en:
echo http://localhost:3000
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

REM Establecer NODE_ENV y ejecutar
set NODE_ENV=development
call pnpm exec tsx watch server/_core/index.ts
