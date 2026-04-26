from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("sqlite+aiosqlite:///"):
    path_part = DATABASE_URL.replace("sqlite+aiosqlite:///", "")
    if not path_part.startswith("/"):
        current_file = Path(__file__).resolve()
        project_root = current_file.parent.parent
        db_path = project_root / path_part
        DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"

engine = create_async_engine(DATABASE_URL)
session_local = async_sessionmaker(
    autoflush=False, autocommit=False, bind=engine)
