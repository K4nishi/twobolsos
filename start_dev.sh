#!/bin/bash

echo "=========================================="
echo "     TwoBolsos Development Launcher"
echo "=========================================="
echo ""

# Check if running from correct directory
if [ ! -d "back_end" ] || [ ! -d "front_end" ]; then
    echo "❌ Erro: Execute este script da raiz do projeto TwoBolsos"
    exit 1
fi

# Check Python virtual environment
if [ ! -d "venv" ]; then
    echo "⚠️  Ambiente virtual não encontrado. Criando..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Check Node modules
if [ ! -d "front_end/node_modules" ]; then
    echo "⚠️  Node modules não encontrados. Instalando..."
    cd front_end
    npm install
    cd ..
fi

echo ""
echo "[1/2] Iniciando Backend (FastAPI)..."
cd back_end
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
cd ..

echo "[2/2] Iniciando Frontend (Vite/React)..."
cd front_end
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Tudo iniciado!"
echo ""
echo "🌐 Frontend:  http://localhost:5173"
echo "📡 Backend:   http://localhost:8000"
echo "📚 API Docs:  http://localhost:8000/docs"
echo ""
echo "Pressione CTRL+C para encerrar ambos os servidores."
echo ""

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
