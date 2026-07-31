import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv

# 1. Load the secret key from the .env file
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("WARNING: Gemini API Key not found!")
    client = None
else:
    # 2. Turn on the modern GenAI Client
    client = genai.Client(api_key=api_key)

app = FastAPI()

# 3. Data structure expected from frontend
class StudentData(BaseModel):
    name: str
    gpa: float
    preferred_domain: str

@app.get("/api/health")
def health_check():
    return {"status": "CBCS AI Engine is online"}

@app.post("/api/recommend")
def get_recommendations(data: StudentData):
    if not client:
         raise HTTPException(status_code=500, detail="API Key missing")
         
    try:
        prompt = f"""
        You are an expert academic advisor for engineering students using the Choice Based Credit System (CBCS).
        A student named {data.name} has a current GPA of {data.gpa} and wants to specialize in {data.preferred_domain}.
        
        Recommend 3 specific courses they should take next semester to align with their domain and satisfy CBCS rules.
        Provide a brief reason for each. Keep the response clear, structured, and under 150 words.
        """
        
        # Modern execution syntax using the new SDK
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt
        )
        
        return {
            "message": "AI generation successful",
            "ai_recommendation": response.text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))