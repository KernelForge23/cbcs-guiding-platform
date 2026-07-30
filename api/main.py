from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# This is a simple data model to test receiving data from Aaditya's frontend
class StudentData(BaseModel):
    name: str
    gpa: float
    preferred_domain: str

@app.get("/api/health")
def health_check():
    return {"status": "CBCS AI Engine is online", "engineer": "Sumedh"}

@app.post("/api/recommend")
def get_recommendations(data: StudentData):
    # For now, we just echo the data back. Later, Gemini goes here!
    return {
        "message": f"Hello {data.name}, backend received your GPA of {data.gpa}",
        "recommended_courses": ["Course 1", "Course 2"]
    }