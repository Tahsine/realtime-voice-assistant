from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from livekit import api
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional
import random

load_dotenv(".env.local")

app = FastAPI()

# CORS pour permettre au frontend de se connecter
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://iris-visual-intelligence-voice-assi.vercel.app"
    ],  # For development purposes; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionRequest(BaseModel):
    room_config: Optional[dict] = None

class ConnectionDetails(BaseModel):
    serverUrl: str
    roomName: str
    participantName: str
    participantToken: str

@app.post("/api/connection-details", response_model=ConnectionDetails)
async def get_connection_details(request: ConnectionRequest):
    """Generate LiveKit connection token"""
    
    try:
        LIVEKIT_URL = os.getenv("LIVEKIT_URL")
        API_KEY = os.getenv("LIVEKIT_API_KEY")
        API_SECRET = os.getenv("LIVEKIT_API_SECRET")
        
        if not all([LIVEKIT_URL, API_KEY, API_SECRET]):
            raise HTTPException(
                status_code=500,
                detail="LiveKit credentials not configured"
            )
        
        # Generate room and participant info
        participant_name = "user"
        participant_identity = f"voice_assistant_user_{random.randint(1000, 9999)}"
        room_name = f"voice_assistant_room_{random.randint(1000, 9999)}"
        
        # Get agent name from request if provided
        agent_name = None
        if request.room_config and "agents" in request.room_config:
            agents = request.room_config.get("agents", [])
            if agents and len(agents) > 0:
                agent_name = agents[0].get("agent_name")
        
        # Create access token
        token = api.AccessToken(API_KEY, API_SECRET)
        token.with_identity(participant_identity).with_name(participant_name)
        token.with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_publish_data=True,
            can_subscribe=True,
        ))
        
        # Add agent configuration if specified
        if agent_name:
            token.with_room_config(
                api.RoomConfiguration(
                    agents=[api.AgentDispatch(agent_name=agent_name)]
                )
            )
        
        # Generate JWT
        participant_token = token.to_jwt()
        
        return ConnectionDetails(
            serverUrl=LIVEKIT_URL,
            roomName=room_name,
            participantName=participant_name,
            participantToken=participant_token,
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {"status": "API is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)