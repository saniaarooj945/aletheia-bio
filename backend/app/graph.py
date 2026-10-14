from typing import Annotated, TypedDict, List
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

from app.tools.ncbi_tool import fetch_gene_summary
from app.tools.uniprot_tool import fetch_uniprot_protein
from app.tools.rdkit_tool import analyze_smiles

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]

def execute_tools(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1]
    content = last_message.content.lower()
    
    tool_results = []

    # NCBI Gene Routing
    if "ncbi" in content or "gene" in content:
        gene = "TP53" if "tp53" in content else "BRCA1"
        data = fetch_gene_summary(gene)
        tool_results.append(ToolMessage(content=str(data), tool_call_id="ncbi_call"))
        
    # UniProt Protein Routing
    if "uniprot" in content or "protein" in content:
        gene = "TP53" if "tp53" in content else "BRCA1"
        data = fetch_uniprot_protein(gene)
        tool_results.append(ToolMessage(content=str(data), tool_call_id="uniprot_call"))

    # RDKit Chemical Routing
    if "smiles" in content or "aspirin" in content or "chemical" in content or "molecule" in content:
        smiles = "CC(=O)OC1=CC=CC=C1C(=O)O"  # Default to Aspirin SMILES
        data = analyze_smiles(smiles)
        tool_results.append(ToolMessage(content=str(data), tool_call_id="rdkit_call"))

    return {"messages": tool_results}

builder = StateGraph(AgentState)
builder.add_node("tools", execute_tools)
builder.add_edge(START, "tools")
builder.add_edge("tools", END)

graph = builder.compile()