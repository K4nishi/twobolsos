import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import init_db
from app.routers import negocios, transacoes, fixas, auth

app = FastAPI(title="TwoBolsos V3 (Auth)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(auth.router)
app.include_router(negocios.router)
app.include_router(transacoes.router)
app.include_router(fixas.router)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONT_END_DIR = os.path.join(BASE_DIR, "..", "..", "front_end")

if os.path.exists(FRONT_END_DIR):
    app.mount("/", StaticFiles(directory=FRONT_END_DIR, html=True), name="static")
