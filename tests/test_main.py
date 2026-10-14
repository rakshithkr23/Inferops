import sys
from pathlib import Path

from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend" 
sys.path.insert(0, str(BACKEND_DIR))

from app.main import app

client = TestClient(app)  #test FastAPI without starting a server
def test_root_endpoint():  
    response = client.get("/") #calls the root endpoint

    assert response.status_code == 200  #checks that the req succeeds 
    assert response.json() == { 
            "project" : "InferOps",
            "status" : "running",
            "message" : "InferOps backend is working",}  #checks that returned json marches the response 


