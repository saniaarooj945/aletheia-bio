from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import QueryRequest, QueryResponse
from app.graph import graph
from langchain_core.messages import HumanMessage

app = FastAPI(title="Aletheia Bio API", version="0.1.0")

# Configure CORS to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (including http://localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "online", "system": "Aletheia Bio Glass Box Engine"}

@app.post("/api/query", response_model=QueryResponse)
def query_agent(request: QueryRequest):
    inputs = {"messages": [HumanMessage(content=request.prompt)]}
    output = graph.invoke(inputs)
    
    messages = output.get("messages", [])
    response_text = "\n".join([m.content for m in messages if hasattr(m, "content")])
    
    return QueryResponse(
        query=request.prompt,
        result=response_text
    )