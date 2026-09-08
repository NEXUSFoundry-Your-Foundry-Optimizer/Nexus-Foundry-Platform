import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, JSON
from datetime import datetime
from backend.app.config import settings

logger = logging.getLogger("PostgresDB")

DATABASE_URL = f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

class BatchRecord(Base):
    __tablename__ = "batches"
    batch_id = Column(String, primary_key=True)
    part_name = Column(String)
    alloy_grade = Column(String)
    furnace_id = Column(String)
    mold_id = Column(String)
    production_date = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class DigitalTwinStateRecord(Base):
    __tablename__ = "digital_twin_states"
    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String, index=True)
    twin_type = Column(String)
    state = Column(JSON)
    updated_at = Column(DateTime, default=datetime.utcnow)

class AnomalyRecord(Base):
    __tablename__ = "anomalies"
    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String, index=True)
    sensor_id = Column(String)
    anomaly_score = Column(Float)
    is_anomaly = Column(Boolean)
    detected_at = Column(DateTime, default=datetime.utcnow)

class PredictionRecord(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String, index=True)
    model_name = Column(String)
    defect_probability = Column(Float)
    quality_prediction = Column(String)
    risk_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class SHAPExplanationRecord(Base):
    __tablename__ = "shap_explanations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    prediction_id = Column(Integer, index=True)
    batch_id = Column(String, index=True)
    feature_attributions = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

async def init_postgres():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("PostgreSQL tables initialized successfully")
    except Exception as e:
        logger.warning(f"PostgreSQL connection/initialization error: {e}")
