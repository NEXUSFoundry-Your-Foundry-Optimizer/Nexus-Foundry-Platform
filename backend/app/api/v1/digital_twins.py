from fastapi import APIRouter, Query, HTTPException
from backend.app.digital_twins.melting import melting_twin
from backend.app.digital_twins.pouring import pouring_twin
from backend.app.digital_twins.quality import quality_twin
from backend.app.digital_twins.molding import molding_twin
from backend.app.db.redis import redis_manager

router = APIRouter(prefix="/digital-twins", tags=["Digital Twins"])

@router.get("/melting")
async def get_melting_twin_state(batch_id: str = Query("latest")):
    cached = await redis_manager.get_digital_twin_state("melting", batch_id)
    return cached or melting_twin.get_state()

@router.get("/pouring")
async def get_pouring_twin_state(batch_id: str = Query("latest")):
    cached = await redis_manager.get_digital_twin_state("pouring", batch_id)
    return cached or pouring_twin.get_state()

@router.get("/quality")
async def get_quality_twin_state(batch_id: str = Query("latest")):
    cached = await redis_manager.get_digital_twin_state("quality", batch_id)
    return cached or quality_twin.get_state()

@router.get("/molding")
async def get_molding_twin_state(batch_id: str = Query("latest")):
    cached = await redis_manager.get_digital_twin_state("molding", batch_id)
    return cached or molding_twin.get_state()

@router.get("/{twin}/state")
async def get_twin_state(twin: str, batch_id: str = Query("latest")):
    twins = {"melting": melting_twin, "molding": molding_twin, "pouring": pouring_twin, "quality": quality_twin}
    if twin not in twins:
        raise HTTPException(status_code=404, detail="Unknown digital twin")
    cached = await redis_manager.get_digital_twin_state(twin, batch_id)
    return cached or twins[twin].get_state()

@router.get("/{batch_id}")
async def get_all_twin_states(batch_id: str):
    m_state = await redis_manager.get_digital_twin_state("melting", batch_id) or melting_twin.get_state()
    p_state = await redis_manager.get_digital_twin_state("pouring", batch_id) or pouring_twin.get_state()
    q_state = await redis_manager.get_digital_twin_state("quality", batch_id) or quality_twin.get_state()
    
    return {
        "batch_id": batch_id,
        "melting": m_state,
        "pouring": p_state,
        "quality": q_state
    }
