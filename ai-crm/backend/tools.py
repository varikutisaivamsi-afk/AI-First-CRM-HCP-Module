"""
LangGraph Tools for the HCP CRM AI Agent

These are the 5 tools the agent uses:
1. log_interaction     - Logs a new HCP interaction to DB
2. edit_interaction    - Edits an existing logged interaction
3. search_interactions - Searches past interactions
4. suggest_followups   - AI suggests follow-up actions
5. summarize_notes     - Summarizes voice/text notes using LLM
"""

from langchain_core.tools import tool
from sqlalchemy.orm import Session
from typing import Optional
import json


# --- Tool 1: Log Interaction ---
@tool
def log_interaction(
    hcp_name: str,
    interaction_type: str,
    date: str,
    topics_discussed: str,
    sentiment: str = "neutral",
    outcomes: str = "",
    follow_up_actions: str = "",
    attendees: str = "",
    time: str = ""
) -> str:
    """
    Logs a new interaction with an HCP (Healthcare Professional) to the database.
    Use this tool when the user wants to record a meeting, call, or visit with a doctor/HCP.

    Args:
        hcp_name: Full name of the Healthcare Professional
        interaction_type: Type - Meeting, Call, Email, Conference, or Other
        date: Date of interaction in YYYY-MM-DD format
        topics_discussed: Key topics covered in the interaction
        sentiment: Observed HCP sentiment - positive, neutral, or negative
        outcomes: Key outcomes or agreements from the interaction
        follow_up_actions: Next steps or tasks to follow up on
        attendees: Other people present during the interaction
        time: Time of the interaction (HH:MM format)

    Returns:
        Confirmation message with the interaction ID
    """
    # This is called from main.py with db session injected
    return json.dumps({
        "action": "log_interaction",
        "hcp_name": hcp_name,
        "interaction_type": interaction_type,
        "date": date,
        "topics_discussed": topics_discussed,
        "sentiment": sentiment,
        "outcomes": outcomes,
        "follow_up_actions": follow_up_actions,
        "attendees": attendees,
        "time": time
    })


# --- Tool 2: Edit Interaction ---
@tool
def edit_interaction(
    interaction_id: int,
    field_to_update: str,
    new_value: str
) -> str:
    """
    Edits/updates an existing logged HCP interaction.
    Use this when the user wants to correct or update information in a previously logged interaction.

    Args:
        interaction_id: The ID number of the interaction to edit
        field_to_update: The field name to change (e.g., 'topics_discussed', 'outcomes', 'sentiment')
        new_value: The new value to set for the field

    Returns:
        Confirmation message of the update
    """
    return json.dumps({
        "action": "edit_interaction",
        "interaction_id": interaction_id,
        "field_to_update": field_to_update,
        "new_value": new_value
    })


# --- Tool 3: Search Interactions ---
@tool
def search_interactions(
    hcp_name: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    interaction_type: Optional[str] = None
) -> str:
    """
    Searches previously logged interactions based on filters.
    Use this when the user asks about past meetings, calls, or interactions with HCPs.

    Args:
        hcp_name: Filter by HCP name (partial match allowed)
        date_from: Start date filter in YYYY-MM-DD format
        date_to: End date filter in YYYY-MM-DD format
        interaction_type: Filter by type - Meeting, Call, Email, Conference, Other

    Returns:
        JSON list of matching interactions
    """
    return json.dumps({
        "action": "search_interactions",
        "filters": {
            "hcp_name": hcp_name,
            "date_from": date_from,
            "date_to": date_to,
            "interaction_type": interaction_type
        }
    })


# --- Tool 4: Suggest Follow-ups ---
@tool
def suggest_followups(
    hcp_name: str,
    topics_discussed: str,
    outcomes: str,
    sentiment: str
) -> str:
    """
    Uses AI to generate intelligent follow-up action suggestions based on interaction details.
    Use this after logging an interaction to get AI-powered next-step recommendations.

    Args:
        hcp_name: Name of the HCP
        topics_discussed: What was discussed in the interaction
        outcomes: What was agreed upon or resulted from the meeting
        sentiment: The HCP's observed sentiment (positive/neutral/negative)

    Returns:
        List of 3-5 suggested follow-up actions
    """
    return json.dumps({
        "action": "suggest_followups",
        "hcp_name": hcp_name,
        "topics_discussed": topics_discussed,
        "outcomes": outcomes,
        "sentiment": sentiment
    })


# --- Tool 5: Summarize Notes ---
@tool
def summarize_notes(
    raw_notes: str,
    hcp_name: str
) -> str:
    """
    Uses the LLM to summarize raw voice notes or unstructured text into a clean interaction summary.
    Use this when the user provides messy or verbose notes that need to be cleaned up.

    Args:
        raw_notes: The raw unstructured notes or transcribed voice memo
        hcp_name: Name of the HCP the notes are about

    Returns:
        A clean, structured summary of the interaction
    """
    return json.dumps({
        "action": "summarize_notes",
        "raw_notes": raw_notes,
        "hcp_name": hcp_name
    })


# Export all tools as a list
ALL_TOOLS = [
    log_interaction,
    edit_interaction,
    search_interactions,
    suggest_followups,
    summarize_notes
]
