from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("sqlite+aiosqlite:///"):
    original_path = DATABASE_URL[len("sqlite+aiosqlite://"):]
    
    db_path = None
    
    current_file = Path(__file__).resolve()
    project_root = current_file.parent.parent
    project_db = project_root / "data" / "database.db"
    if project_db.exists():
        db_path = project_db
    
    if not db_path:
        cwd = Path.cwd()
        cwd_db = cwd / "data" / "database.db"
        if cwd_db.exists():
            db_path = cwd_db
    
    if not db_path and original_path.startswith("/"):
        abs_path = Path(original_path)
        if abs_path.exists():
            db_path = abs_path
    
    if not db_path:
        cwd = Path.cwd()
        if original_path.startswith("/"):
            db_path = Path(original_path)
        else:
            db_path = cwd / original_path
    
    if db_path:
        DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"

engine = create_async_engine(DATABASE_URL)
session_local = async_sessionmaker(
    autoflush=False, autocommit=False, bind=engine)
