from fastapi import FastAPI
import asyncio
from pydantic import BaseModel

app = FastAPI()

students ={
    1:{
        "name" : "Saran",
        "place": "Vizag"
    },
    2:{
        "name" : "Cat",
        "place" : "Japan"  
    }
    
}

@app.get("/start")
async def start():
    return {"name":"first"}

@app.get("/students/{student_id}")
async def read_student(student_id:int):
    return students[student_id]

@app.get("/students/name")
async def get_it(name :str):
    return{"this":name}