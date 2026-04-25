from sqlalchemy import text, inspect
from database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def check_and_migrate_database():
    async with engine.begin() as conn:
        def inspect_and_migrate(sync_conn):
            inspector = inspect(sync_conn)
            
            tables = inspector.get_table_names()
            logger.info(f"Existing tables: {tables}")
            
            if "categories" not in tables:
                logger.info("Creating categories table...")
                sync_conn.execute(text("""
                    CREATE TABLE categories (
                        category_id VARCHAR NOT NULL,
                        category_name VARCHAR,
                        user_id VARCHAR,
                        date_created INTEGER,
                        PRIMARY KEY (category_id),
                        UNIQUE (user_id, category_name),
                        FOREIGN KEY(user_id) REFERENCES users (user_id)
                    )
                """))
                sync_conn.execute(text("CREATE INDEX ix_categories_category_id ON categories (category_id)"))
                sync_conn.execute(text("CREATE INDEX ix_categories_category_name ON categories (category_name)"))
                logger.info("Categories table created successfully")
            
            if "habits" not in tables:
                logger.info("habits table does not exist yet, skipping column migration")
                sync_conn.commit()
                return

            columns = [col["name"] for col in inspector.get_columns("habits")]
            logger.info(f"Existing columns in habits table: {columns}")
            
            if "category_id" not in columns:
                logger.info("Adding category_id column to habits table...")
                sync_conn.execute(text("""
                    ALTER TABLE habits ADD COLUMN category_id VARCHAR
                """))
                sync_conn.execute(text("""
                    CREATE INDEX ix_habits_category_id ON habits (category_id)
                """))
                logger.info("category_id column added successfully")
            
            sync_conn.commit()
        
        await conn.run_sync(inspect_and_migrate)
    
    logger.info("Database migration completed")
