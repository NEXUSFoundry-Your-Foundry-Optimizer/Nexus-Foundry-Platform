from fastapi import APIRouter, HTTPException

from backend.app.workflows import workflow_store


router = APIRouter(prefix="/workflows", tags=["Live workflows"])


@router.get("/latest")
async def get_latest_workflow():
    """Return the latest persisted anomaly cascade and its real step payloads."""
    return {"workflow": await workflow_store.latest()}


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str):
    workflow = await workflow_store.latest()
    if workflow is None or workflow.get("workflow_id") != workflow_id:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"workflow": workflow}
