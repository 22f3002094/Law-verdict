import os
import asyncio
from functools import lru_cache
from datetime import datetime
from typing import List

import requests
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Security, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, func
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from supabase import acreate_client, AsyncClient
from realtime.types import RealtimeSubscribeStates

load_dotenv()
security_scheme = HTTPBearer()

@lru_cache(maxsize=1)
def get_jwks():
    jwks_url = f"{os.environ['AUTH0_DOMAIN']}.well-known/jwks.json"
    response = requests.get(jwks_url)
    response.raise_for_status()
    return response.json()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security_scheme)):
    try:
        token = credentials.credentials
        jwks = get_jwks()
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {key["kid"]: {"kty": key["kty"], "kid": key["kid"], "use": key["use"], "n": key["n"], "e": key["e"]} for key in jwks["keys"]}[unverified_header["kid"]]
        payload = jwt.decode(token, rsa_key, algorithms=["RS256"], audience=os.environ["AUTH0_AUDIENCE"], issuer=os.environ["AUTH0_DOMAIN"])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")


DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ActiveSession(Base):
    __tablename__ = "active_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    session_id = Column(String(255), unique=True, nullable=False)
    device_info = Column(Text)
    ip_address = Column(String(50))
    logged_in_at = Column(DateTime(timezone=True), server_default=func.now())

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class SessionCreate(BaseModel):
    session_id: str
    device_info: str | None = "Unknown Device"

class SessionDelete(BaseModel):
    session_id: str

class ActiveSessionResponse(BaseModel):
    session_id: str
    device_info: str | None
    ip_address: str | None
    logged_in_at: datetime


origins = [
    "http://localhost:3000",          # Your local development frontend
    "https://law-verdict.vercel.app", # YOUR LIVE VERCEL FRONTEND URL
]
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["GET", "POST", "DELETE", "OPTIONS"], allow_headers=["*"])


@app.get("/")
def read_root():
    return {"status": "ok"}


@app.post("/api/session/register")
def register_session(session_data: SessionCreate, request: Request, db: Session = Depends(get_db), payload: dict = Depends(verify_token)):
    user_id = payload.get("sub")
    device_limit = int(os.environ.get("N_DEVICES_LIMIT", 3))
    current_sessions = db.query(ActiveSession).filter(ActiveSession.user_id == user_id).all()
    if len(current_sessions) >= device_limit:
        return {"status": "limit_reached", "message": "Device limit reached.", "active_devices": [s.__dict__ for s in current_sessions]}
    new_session = ActiveSession(user_id=user_id, session_id=session_data.session_id, device_info=session_data.device_info, ip_address=request.client.host)
    db.add(new_session)
    db.commit()
    return {"status": "success", "message": "Session registered successfully."}

@app.post("/api/session/logout")
def logout_session(session_data: SessionDelete, db: Session = Depends(get_db), payload: dict = Depends(verify_token)):
    user_id = payload.get("sub")
    session = db.query(ActiveSession).filter(ActiveSession.session_id == session_data.session_id, ActiveSession.user_id == user_id).first()
    if session:
        db.delete(session)
        db.commit()
    return {"status": "ok", "message": "Session successfully deleted."}

@app.get("/api/sessions", response_model=List[ActiveSessionResponse])
def get_user_sessions(db: Session = Depends(get_db), payload: dict = Depends(verify_token)):
    user_id = payload.get("sub")
    sessions = db.query(ActiveSession).filter(ActiveSession.user_id == user_id).all()
    return sessions


@app.delete("/api/session/{session_id_to_delete}")
async def force_logout_session(session_id_to_delete: str, db: Session = Depends(get_db), payload: dict = Depends(verify_token)):
    user_id = payload.get("sub")
    session = db.query(ActiveSession).filter(ActiveSession.session_id == session_id_to_delete, ActiveSession.user_id == user_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or you do not have permission to delete it.")
    
    db.delete(session)
    db.commit()
    
    channel_name = f"user-updates:{user_id}"
    try:
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        supabase: AsyncClient = await acreate_client(supabase_url, supabase_key)
        
        
        broadcast_sent_event = asyncio.Event()
        async def send_broadcast_on_subscribe():
            try:
                await channel.send_broadcast(
                    "session-change",
                    {"terminated_session_id": session_id_to_delete}
                )
            finally:
                broadcast_sent_event.set()
        def on_subscribe_callback(status, err):
            if status == RealtimeSubscribeStates.SUBSCRIBED:
                asyncio.create_task(send_broadcast_on_subscribe())
            else:
                print(f"Subscription failed: {err}")
                broadcast_sent_event.set()
        
        channel = supabase.channel(channel_name)
        await channel.subscribe(on_subscribe_callback)
        await asyncio.wait_for(broadcast_sent_event.wait(), timeout=5.0)
        await channel.unsubscribe()

    except Exception as e:
        print(f"Failed to broadcast Supabase message: {e}")

    return {"status": "ok", "message": f"Session {session_id_to_delete} terminated."}


@app.get("/api/session/status")
def get_session_status(session_id: str, db: Session = Depends(get_db), payload: dict = Depends(verify_token)):
    user_id = payload.get("sub")
    session = db.query(ActiveSession).filter(ActiveSession.session_id == session_id, ActiveSession.user_id == user_id).first()
    if session:
        return {"status": "active"}
    else:
        return {"status": "inactive"}

