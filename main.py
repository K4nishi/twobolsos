"""
TwoBolsos - Square Cloud Entry Point (Full Stack)
===================================================

Este arquivo é o ponto de entrada para deploy na Square Cloud.
Serve tanto a API (FastAPI) quanto o frontend (React) juntos.

Autor: K4nishi
Versão: 3.0.0
"""

import sys
import os
from pathlib import Path

# ============================================================
# CONFIGURAÇÃO DE LOGS COLORIDOS
# ============================================================

class Colors:
    """Cores ANSI para terminal."""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'


def log_success(msg: str):
    """Log de sucesso (verde)."""
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")


def log_warning(msg: str):
    """Log de aviso (amarelo)."""
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.END}")


def log_error(msg: str):
    """Log de erro (vermelho)."""
    print(f"{Colors.RED}❌ {msg}{Colors.END}")


def log_info(msg: str):
    """Log informativo (azul)."""
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.END}")


def print_banner():
    """Imprime banner de inicialização."""
    print(f"""
{Colors.CYAN}{Colors.BOLD}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎒 TwoBolsos - Sistema de Gestão Financeira            ║
║                                                           ║
║   Versão: 3.0.0                                          ║
║   Autor: K4nishi                                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
{Colors.END}""")


# ============================================================
# INICIALIZAÇÃO
# ============================================================

print_banner()

# Adiciona back_end ao path para imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'back_end'))

log_info("Carregando backend FastAPI...")

try:
    # Importa a aplicação FastAPI do backend
    from back_end.app.main import app
    log_success("Backend carregado com sucesso!")
except Exception as e:
    log_error(f"Erro ao carregar backend: {e}")
    raise

# Importação para servir arquivos estáticos
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# ============================================================
# CONFIGURAÇÃO DO FRONTEND (React)
# ============================================================

# Diretório do frontend buildado
FRONTEND_DIR = Path(__file__).parent / "front_end" / "dist"
STATIC_DIR = Path(__file__).parent / "static"

log_info("Verificando frontend React...")

# Verifica se o frontend foi buildado
if FRONTEND_DIR.exists():
    log_success(f"Frontend encontrado em: {FRONTEND_DIR}")
    
    # Monta os assets estáticos (JS, CSS, imagens)
    assets_dir = FRONTEND_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
        log_success("Assets (JS/CSS) montados em /assets")
    
    # Serve arquivos estáticos da raiz do dist
    @app.get("/vite.svg")
    async def serve_vite_svg():
        file_path = FRONTEND_DIR / "vite.svg"
        if file_path.exists():
            return FileResponse(file_path)
        return {"error": "Not found"}

    # Rota catch-all para o React Router (SPA)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """
        Serve o frontend React para todas as rotas não-API.
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
        
        return {"error": "Frontend not built"}

    log_success("Rotas do frontend configuradas!")
    
else:
    log_warning("Frontend não encontrado. Apenas API disponível.")
    log_info("Para servir o frontend, execute:")
    log_info("  cd front_end && npm run build")

# Servir arquivos estáticos adicionais se existirem
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
    log_success("Pasta /static montada")

# ============================================================
# RESUMO DA INICIALIZAÇÃO
# ============================================================

print(f"""
{Colors.CYAN}{'='*60}{Colors.END}
{Colors.BOLD}📊 STATUS DA APLICAÇÃO:{Colors.END}
{Colors.CYAN}{'='*60}{Colors.END}
""")

log_success("Backend FastAPI: ONLINE")

if FRONTEND_DIR.exists():
    log_success("Frontend React:  ONLINE")
else:
    log_warning("Frontend React:  OFFLINE (não buildado)")

print(f"""
{Colors.CYAN}{'='*60}{Colors.END}
{Colors.BOLD}🌐 ENDPOINTS DISPONÍVEIS:{Colors.END}
{Colors.CYAN}{'='*60}{Colors.END}

  📄 Documentação API:  /docs
  📄 ReDoc:             /redoc
  🔐 Autenticação:      /auth/*
  💼 Carteiras:         /negocios/*
  💰 Transações:        /transacoes/*
  🔌 WebSocket:         /ws/{{user_id}}
  
{Colors.CYAN}{'='*60}{Colors.END}
{Colors.GREEN}{Colors.BOLD}🚀 Aplicação pronta para receber requisições!{Colors.END}
{Colors.CYAN}{'='*60}{Colors.END}
""")


# ============================================================
# EXECUÇÃO LOCAL
# ============================================================

if __name__ == "__main__":
    import uvicorn
    
    print(f"\n{Colors.YELLOW}Iniciando servidor de desenvolvimento...{Colors.END}\n")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )
