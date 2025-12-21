@echo off
echo ==========================================
echo      TwoBolsos Development Launcher
echo ==========================================

echo [1/2] Iniciando Backend (FastAPI)...
start "TwoBolsos Backend" cmd /k "cd back_end && call ..\venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo [2/2] Iniciando Frontend (Vite/React)...
start "TwoBolsos Frontend" cmd /k "cd front_end && npm run dev"

echo.
echo Tudo iniciado! 
echo O Frontend deve abrir em: http://localhost:5173
echo.
pause
