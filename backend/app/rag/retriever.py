from typing import Dict, Any
from backend.app.db.redis import redis_manager
from backend.app.digital_twins.melting import melting_twin
from backend.app.digital_twins.pouring import pouring_twin
from backend.app.digital_twins.quality import quality_twin
from backend.app.digital_twins.molding import molding_twin

class ContextRetriever:
    async def get_live_context(self, batch_id: str = "latest") -> Dict[str, Any]:
        m_state = await redis_manager.get_digital_twin_state("melting", batch_id) or melting_twin.get_state()
        p_state = await redis_manager.get_digital_twin_state("pouring", batch_id) or pouring_twin.get_state()
        q_state = await redis_manager.get_digital_twin_state("quality", batch_id) or quality_twin.get_state()
        mold_state = await redis_manager.get_digital_twin_state("molding", batch_id) or molding_twin.get_state()
        
        return {
            "melting_twin": m_state,
            "pouring_twin": p_state,
            "quality_twin": q_state
            ,"molding_twin": mold_state
        }

context_retriever = ContextRetriever()
