@echo off
setlocal enabledelayedexpansion

:: Garante que estamos na pasta do projeto
cd /d "%~dp0"

echo ==========================================
echo      TwoBolsos Launcher (Commercial)
echo ==========================================

:: Verifica se o Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Python nao encontrado. Instale o Python e tente novamente.
    pause
    exit /b
)

:: Cria o ambiente virtual se não existir
if not exist "venv" (
    echo [INFO] Criando ambiente virtual...
    python -m venv venv
)

:: Ativa o ambiente virtual
call venv\Scripts\activate

:: Instala depedências (garante websockets e uvicorn standard)
echo [INFO] Verificando dependencias...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b
)

:: Inicia o servidor e abre o navegador
echo.
echo [INFO] Sistema pronto.
echo [INFO] Iniciando servidor em http://127.0.0.1:8000
echo.

:: Abre o navegador (aguarda 4 segundos)
start /min cmd /c "timeout /t 4 >nul && start http://127.0.0.1:8000"

:: Vai para a pasta do backend e roda o uvicorn com log_level info para reduzir ruido, mas avisos aparecerao se criticos
cd back_end
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --log-level warning

pause
