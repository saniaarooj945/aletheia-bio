from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class QueryRequest(BaseModel):
    prompt: str

class QueryResponse(BaseModel):
    query: str
    result: str
    tool_calls: List[Dict[str, Any]] = []