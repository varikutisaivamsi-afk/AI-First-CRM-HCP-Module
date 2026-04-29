"""
FastAPI Backend for AI-First CRM HCP Module
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
import json
from typing import List, Optional

import models
import schemas
from database import engine, get_db
from agent import chat_with_agent

# Create all DB tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CRM HCP API", version="1.0.0")

# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =================== INTERACTION ENDPOINTS ===================

@app.get("/")
def root():
    return {"message": "CRM HCP API is running!"}


@app.post("/interactions", response_model=schemas.InteractionResponse)
def create_interaction(
    interaction: schemas.InteractionCreate,
    db: Session = Depends(get_db)
):
    """Log a new HCP interaction (from the structured form)"""
    db_interaction = models.Interaction(
        hcp_name=interaction.hcp_name,
        interaction_type=interaction.interaction_type,
        date=interaction.date,
        time=interaction.time,
        attendees=interaction.attendees,
        topics_discussed=interaction.topics_discussed,
        materials_shared=interaction.materials_shared or [],
        samples_distributed=interaction.samples_distributed or [],
        sentiment=interaction.sentiment,
        outcomes=interaction.outcomes,
        follow_up_actions=interaction.follow_up_actions,
        ai_suggested_followups=[],
        summary=""
    )
    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)
    return db_interaction


@app.get("/interactions", response_model=List[schemas.InteractionResponse])
def get_interactions(
    hcp_name: Optional[str] = None,
    interaction_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all logged interactions with optional filters"""
    query = db.query(models.Interaction)
    
    if hcp_name:
        query = query.filter(models.Interaction.hcp_name.ilike(f"%{hcp_name}%"))
    if interaction_type:
        query = query.filter(models.Interaction.interaction_type == interaction_type)
    
    return query.order_by(models.Interaction.created_at.desc()).offset(skip).limit(limit).all()


@app.get("/interactions/{interaction_id}", response_model=schemas.InteractionResponse)
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    """Get a specific interaction by ID"""
    interaction = db.query(models.Interaction).filter(
        models.Interaction.id == interaction_id
    ).first()
    
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    
    return interaction


@app.put("/interactions/{interaction_id}", response_model=schemas.InteractionResponse)
def update_interaction(
    interaction_id: int,
    update_data: schemas.InteractionUpdate,
    db: Session = Depends(get_db)
):
    """Edit an existing interaction"""
    interaction = db.query(models.Interaction).filter(
        models.Interaction.id == interaction_id
    ).first()
    
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    
    # Update only provided fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(interaction, field, value)
    
    db.commit()
    db.refresh(interaction)
    return interaction


@app.delete("/interactions/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    """Delete an interaction"""
    interaction = db.query(models.Interaction).filter(
        models.Interaction.id == interaction_id
    ).first()
    
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    
    db.delete(interaction)
    db.commit()
    return {"message": "Interaction deleted successfully"}


# =================== AI CHAT ENDPOINT ===================

@app.post("/chat")
async def chat(chat_msg: schemas.ChatMessage, db: Session = Depends(get_db)):
    """
    Chat with the LangGraph AI agent.
    The agent can log interactions, search records, suggest follow-ups, etc.
    """
    try:
        result = await chat_with_agent(
            user_message=chat_msg.message,
            conversation_history=chat_msg.conversation_history
        )
        
        # If the agent called log_interaction tool, save to DB
        for tool_result in result.get("tool_results", []):
            if tool_result["tool_name"] == "log_interaction":
                args = tool_result["tool_args"]
                db_interaction = models.Interaction(
                    hcp_name=args.get("hcp_name", ""),
                    interaction_type=args.get("interaction_type", "Meeting"),
                    date=args.get("date", ""),
                    time=args.get("time", ""),
                    attendees=args.get("attendees", ""),
                    topics_discussed=args.get("topics_discussed", ""),
                    sentiment=args.get("sentiment", "neutral"),
                    outcomes=args.get("outcomes", ""),
                    follow_up_actions=args.get("follow_up_actions", ""),
                    materials_shared=[],
                    samples_distributed=[],
                    ai_suggested_followups=[],
                    summary=""
                )
                db.add(db_interaction)
                db.commit()
                db.refresh(db_interaction)
                result["logged_interaction_id"] = db_interaction.id
            
            elif tool_result["tool_name"] == "edit_interaction":
                args = tool_result["tool_args"]
                interaction = db.query(models.Interaction).filter(
                    models.Interaction.id == args.get("interaction_id")
                ).first()
                if interaction:
                    field = args.get("field_to_update")
                    value = args.get("new_value")
                    if hasattr(interaction, field):
                        setattr(interaction, field, value)
                        db.commit()
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
