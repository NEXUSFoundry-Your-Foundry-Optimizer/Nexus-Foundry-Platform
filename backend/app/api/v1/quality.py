from fastapi import APIRouter
from pydantic import BaseModel
from backend.app.digital_twins.quality import quality_twin
from backend.app.ml.resnet import resnet_classifier

router = APIRouter(prefix="/quality", tags=["Quality"])

class InspectionRequest(BaseModel):
    batch_id: str
    image_id: str
    defect_present: bool = False
    defect_type: str = "none"
    severity: int = 0
    inspection_result: str = "PASS"

@router.get("/latest")
async def get_latest_quality():
    return quality_twin.get_state()

@router.post("/inspect")
async def inspect_quality(request: InspectionRequest):
    metadata = request.model_dump()
    prediction = resnet_classifier.classify_image(metadata)
    state = await quality_twin.process_event({**metadata, **prediction})
    return {"prediction": prediction, "state": state}
