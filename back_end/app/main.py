"""
TwoBolsos Backend - Main Application Entry Point
FastAPI application with real-time WebSocket support.
"""
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import negocios, transacoes, fixas, auth
from app.realtime.manager import manager

app = FastAPI(
    title="TwoBolsos API",
    description="Financial management API with real-time updates for personal finance and driver tracking.",
    version="3.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    """Initialize database on application startup."""
    init_db()

# Include Routers
app.include_router(auth.router)
app.include_router(negocios.router)
app.include_router(transacoes.router)
app.include_router(fixas.router)

# WebSocket Endpoint for Real-Time Updates
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """
    WebSocket endpoint for real-time dashboard updates.
    Clients connect with their user_id to receive notifications
    when wallet data changes (transactions, members, etc.).
    """
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
