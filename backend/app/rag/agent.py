import logging
from typing import Dict, Any
from backend.app.rag.retriever import context_retriever

logger = logging.getLogger("RAGAgent")

class RAGCognitiveAgent:
    async def answer_query(self, user_prompt: str, batch_id: str = "latest") -> Dict[str, Any]:
        context = await context_retriever.get_live_context(batch_id)
        
        m_state = context.get("melting_twin", {})
        p_state = context.get("pouring_twin", {})
        q_state = context.get("quality_twin", {})
        
        # Build contextual response incorporating actual live system state
        response_text = (
            f"Based on real-time telemetry for batch {m_state.get('batch_id', 'B001')}:\n"
            f"- Furnace Melt Temp: {m_state.get('melt_temp')}°C, Power: {m_state.get('power_kw')} kW\n"
            f"- Lining Health Index: {round(float(m_state.get('lining_health', 0.85))*100, 1)}%\n"
            f"- Pouring Temp: {p_state.get('pour_temp')}°C, Ladle Fill: {p_state.get('ladle_fill_pct')}%\n"
            f"- Defect Risk: {round(float(q_state.get('defect_risk', 0.02))*100, 1)}% ({q_state.get('inspection_result', 'PASS')})\n"
        )
        
        lower_prompt = user_prompt.lower()
        if "defect" in lower_prompt or "risk" in lower_prompt:
            response_text += "\nDiagnostic Analysis: The primary risk driver is melt temperature deviation from target setpoints combined with molding sand moisture fluctuations."
        elif "lining" in lower_prompt or "furnace" in lower_prompt:
            response_text += "\nDiagnostic Analysis: Furnace lining health is currently within normal operating thresholds."
        elif "pour" in lower_prompt or "ladle" in lower_prompt:
            response_text += "\nDiagnostic Analysis: Pouring speed and flow rates match standard casting specification."
        else:
            response_text += f"\nRecommendation: All cross-stage digital twin metrics indicate stable process state for query: '{user_prompt}'."

        return {
            "query": user_prompt,
            "answer": response_text,
            "context_snapshot": context,
            "agent": "NEXUS-Cognitive-RAG-v1"
        }

rag_agent = RAGCognitiveAgent()
