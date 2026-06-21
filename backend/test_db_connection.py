import asyncio
import sys
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


db_url = None
try:
    with open(".env", "r") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                db_url = line.split("=", 1)[1].strip()
except Exception as e:
    print(f"Error reading .env: {e}")

if not db_url:
    print("DATABASE_URL not found in .env")
    sys.exit(1)

print(f"Testing connection to: {db_url.split('@')[-1]} (password hidden)")

async def test_connection():
    try:
        engine = create_async_engine(db_url, pool_pre_ping=True)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print("Connection successful! Result:", result.scalar())
    except Exception as e:
        print("\n=== Connection Failed ===")
        print(type(e).__name__, ":", e)
        print("=========================")

asyncio.run(test_connection())
