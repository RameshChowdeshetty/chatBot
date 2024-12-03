import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_ingest_document():
    response = client.post("/ingest", json={"title": "Test Doc", "content": "This is a test document."})
    assert response.status_code == 200
    assert "id" in response.json()

def test_list_documents():
    response = client.get("/documents")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_qna():
    # Proper payload format for /qna
    response = client.post("/qna", json={"question": "What is the test document about?"})
    print(response.text)
    assert response.status_code == 200
    assert "best_match" in response.json()