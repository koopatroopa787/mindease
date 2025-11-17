from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://mindspace_user:dev123@localhost:5432/mindspace_db"

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        print("✅ Database connection successful!")
        print(f"PostgreSQL version: {result.fetchone()[0]}")
except Exception as e:
    print(f"❌ Connection failed: {e}")