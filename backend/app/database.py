"""
Traffic Pulse — Database Setup
Async SQLAlchemy engine and session factory for PostgreSQL.
"""
import logging
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

logger = logging.getLogger("traffic_pulse.db")
settings = get_settings()

# Configure connection arguments conditionally (avoid breaking SQLite tests)
connect_args = {}
if settings.database_url.startswith("postgresql"):
    connect_args = {
        "prepared_statement_cache_size": 0,
        "ssl": "require",
    }

engine = create_async_engine(
    settings.database_url,
    echo=settings.log_level == "DEBUG",
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,   # drops stale connections automatically
    connect_args=connect_args,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency: yields a transactional async DB session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    """Create all tables at startup (idempotent — safe to call on every boot)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables ensured")
