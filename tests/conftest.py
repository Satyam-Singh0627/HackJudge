import os
import sys

sys.path.insert(0, os.path.abspath("backend"))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set testing environment before importing app
os.environ["DATABASE_URL"] = "sqlite:///./test_hackathon.db"
os.environ["AUTO_SEED"] = "true"

from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.seed.seed_data import seed_database

TEST_DB_URL = "sqlite:///./test_hackathon.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_hackathon.db"):
        try:
            os.remove("./test_hackathon.db")
        except Exception:
            pass

@pytest.fixture(scope="function")
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="module")
def client():
    # Override get_db dependency
    with TestClient(app) as test_client:
        yield test_client
