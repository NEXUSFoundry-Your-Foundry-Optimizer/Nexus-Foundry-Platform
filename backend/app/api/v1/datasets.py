from fastapi import APIRouter, HTTPException
from backend.app.simulator.dataset_loader import dataset_loader

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("")
async def list_datasets():
    return dataset_loader.list_datasets()

@router.get("/{dataset_id}")
async def get_dataset_info(dataset_id: str):
    try:
        df = dataset_loader.load_csv(dataset_id)
        return {
            "filename": dataset_id,
            "rows": len(df),
            "columns": list(df.columns),
            "sample": df.head(3).to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Dataset error: {e}")
