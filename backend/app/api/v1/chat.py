from fastapi import APIRouter
from pydantic import BaseModel
from backend.app.rag.agent import rag_agent

router = APIRouter(prefix="/chat", tags=["RAG Assistant"])

class ChatRequest(BaseModel):
    message: str
    batch_id: str = "latest"

@router.post("")
async def chat_with_rag_agent(request: ChatRequest):
    return await rag_agent.answer_query(request.message, batch_id=request.batch_id)
