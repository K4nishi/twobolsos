"""
TwoBolsos - Square Cloud Entry Point (Full Stack)
===================================================

Este arquivo é o ponto de entrada para deploy na Square Cloud.
Serve tanto a API (FastAPI) quanto o frontend (React) juntos.

Estrutura esperada:
    /main.py              <- Este arquivo
    /back_end/app/...     <- API FastAPI
    /front_end/dist/...   <- Frontend buildado (React)
    /static/...           <- Arquivos estáticos do frontend

Uso:
    A Square Cloud executa:
    uvicorn main:app --host 0.0.0.0 --port 80
"""

import sys
import os
from pathlib import Path

# Adiciona back_end ao path para imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'back_end'))

# Importa a aplicação FastAPI do backend
from back_end.app.main import app

# Importação para servir arquivos estáticos
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# ============================================================
# CONFIGURAÇÃO PARA SERVIR FRONTEND (React)
# ============================================================

# Diretório do frontend buildado
FRONTEND_DIR = Path(__file__).parent / "front_end" / "dist"
STATIC_DIR = Path(__file__).parent / "static"

# Verifica se o frontend foi buildado
if FRONTEND_DIR.exists():
    # Monta os assets estáticos (JS, CSS, imagens)
    assets_dir = FRONTEND_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
    
    # Serve arquivos estáticos da raiz do dist
    @app.get("/vite.svg")
    async def serve_vite_svg():
        file_path = FRONTEND_DIR / "vite.svg"
        if file_path.exists():
            return FileResponse(file_path)
        return {"error": "Not found"}

    # Rota catch-all para o React Router (SPA)
    # IMPORTANTE: Deve ser a última rota registrada!
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """
        Serve o frontend React para todas as rotas não-API.
        
        Isso permite que o React Router funcione corretamente,
        retornando sempre o index.html para rotas como /login, /dashboard, etc.
        """
        # Se é uma rota de API, deixa o FastAPI tratar
        if full_path.startswith(("auth", "negocios", "transacoes", "docs", "redoc", "openapi.json", "ws")):
            return {"error": "Not found"}
        
        # Tenta servir arquivo específico primeiro
        file_path = FRONTEND_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        
        # Qualquer outra rota retorna o index.html (SPA)
        index_path = FRONTEND_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        
        return {"error": "Frontend not built. Run: cd front_end && npm run build"}

    print("✅ Frontend encontrado em:", FRONTEND_DIR)
else:
    print("⚠️ Frontend não encontrado. Apenas API disponível.")
    print("   Para servir o frontend, execute:")
    print("   cd front_end && npm run build")

# Servir arquivos estáticos adicionais se existirem
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# Para execução local de teste:
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
