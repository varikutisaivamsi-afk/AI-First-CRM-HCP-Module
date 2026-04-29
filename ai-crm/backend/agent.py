"""
LangGraph AI Agent for HCP CRM

This agent:
1. Receives user chat messages
2. Uses LangGraph to orchestrate tool calls
3. Uses Groq's gemma2-9b-it model as the LLM
4. Returns structured responses for logging interactions
"""

import os
import json
from typing import TypedDict, Annotated, List
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from tools import ALL_TOOLS

load_dotenv()

# ---- LLM Setup ----
llm = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="gemma2-9b-it",
    temperature=0.3,
    max_tokens=1024
)

# Bind tools to LLM so it knows what tools are available
llm_with_tools = llm.bind_tools(ALL_TOOLS)

# ---- Agent State ----
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]

# ---- System Prompt ----
SYSTEM_PROMPT = """You are an AI assistant for a pharmaceutical CRM system helping field sales representatives log and manage their interactions with Healthcare Professionals (HCPs).

Your role:
- Help reps log meetings, calls, and visits with doctors/HCPs
- Extract key information from conversational messages
- Suggest intelligent follow-up actions
- Search and retrieve past interaction records
- Summarize unstructured notes into clean records

When a user describes an interaction, extract:
- HCP name (doctor's name)
- Interaction type (Meeting/Call/Email/Conference/Other)
- Date and time
- Topics discussed (products, studies, patient cases, etc.)
- HCP sentiment (positive/neutral/negative)
- Outcomes and agreements
- Follow-up actions needed

Always be professional, concise, and helpful. If information is missing, ask for it politely.

Available tools:
1. log_interaction - Save a new HCP interaction to the database
2. edit_interaction - Update an existing interaction record
3. search_interactions - Find past interactions by filters
4. suggest_followups - Get AI-powered next-step recommendations
5. summarize_notes - Clean up messy voice/text notes
"""

# ---- Graph Nodes ----
def call_llm(state: AgentState) -> AgentState:
    """Node that calls the LLM with the current messages"""
    messages = state["messages"]
    
    # Add system prompt if not already there
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages
    
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState) -> str:
    """Router: decide whether to call tools or end"""
    last_message = state["messages"][-1]
    
    # If the LLM called a tool, go to tools node
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    
    # Otherwise, we're done
    return END


# ---- Build Graph ----
def build_agent():
    """Builds and compiles the LangGraph agent"""
    tool_node = ToolNode(ALL_TOOLS)
    
    graph = StateGraph(AgentState)
    
    # Add nodes
    graph.add_node("llm", call_llm)
    graph.add_node("tools", tool_node)
    
    # Set entry point
    graph.set_entry_point("llm")
    
    # Add edges
    graph.add_conditional_edges(
        "llm",
        should_continue,
        {
            "tools": "tools",
            END: END
        }
    )
    
    # After tools, go back to LLM
    graph.add_edge("tools", "llm")
    
    return graph.compile()


# Compile agent once at module load
agent = build_agent()


# ---- Main Chat Function ----
async def chat_with_agent(user_message: str, conversation_history: list = []) -> dict:
    """
    Send a message to the LangGraph agent and get a response.
    
    Args:
        user_message: The user's chat message
        conversation_history: List of previous messages [{"role": "user"/"assistant", "content": "..."}]
    
    Returns:
        dict with 'response' text and 'tool_results' if any tools were called
    """
    
    # Convert history to LangChain message format
    messages = []
    for msg in conversation_history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            messages.append(AIMessage(content=msg["content"]))
    
    # Add current user message
    messages.append(HumanMessage(content=user_message))
    
    # Run through LangGraph
    result = await agent.ainvoke({"messages": messages})
    
    # Extract the final AI response
    final_messages = result["messages"]
    
    # Get tool calls if any
    tool_results = []
    ai_response = ""
    
    for msg in final_messages:
        if isinstance(msg, AIMessage):
            ai_response = msg.content
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    tool_results.append({
                        "tool_name": tc["name"],
                        "tool_args": tc["args"]
                    })
    
    return {
        "response": ai_response,
        "tool_results": tool_results
    }
