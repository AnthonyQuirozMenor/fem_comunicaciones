@echo off
title Servidor - Linea de Tiempo FEM COMUNICACIONES
echo ========================================================
echo   Línea de Tiempo: FEM COMUNICACIONES
echo   Iniciando el servidor local...
echo ========================================================
echo.

:: Esperar un momento y abrir el navegador en la dirección local
echo Abriendo la aplicación en su navegador por defecto...
start http://localhost:8000/

:: Ejecutar el script del servidor web en PowerShell
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"

if %ERRORLEVEL% neq 0 (
    echo.
    echo Ocurrió un error al iniciar el servidor de PowerShell.
    echo Asegúrese de permitir la ejecución de scripts o ejecute PowerShell como Administrador.
    pause
)
