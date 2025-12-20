import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import init_db
from app.routers import negocios, transacoes, fixas

app = FastAPI(title="TwoBolsos V2 (Refactored)")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Startup
@app.on_event("startup")
def on_startup():
    init_db()

# Include Routers
app.include_router(negocios.router)
app.include_router(transacoes.router)
app.include_router(fixas.router)

# Static Files (Frontend)
# Current file is in back_end/app/main.py. Frontend is in front_end/ relative to root.
# Root is ../../
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONT_END_DIR = os.path.join(BASE_DIR, "..", "..", "front_end")

if os.path.exists(FRONT_END_DIR):
    app.mount("/", StaticFiles(directory=FRONT_END_DIR, html=True), name="static")
else:
    print(f"WARNING: Frontend directory not found at {FRONT_END_DIR}")
