import os
from Bio import Entrez
from pydantic import BaseModel, Field

Entrez.email = os.getenv("NCBI_EMAIL", "your_email@example.com")

class GeneInput(BaseModel):
    gene_symbol: str = Field(..., description="Official gene symbol, e.g., BRCA1, TP53, EGFR")

class GeneResult(BaseModel):
    gene_id: str
    symbol: str
    description: str
    organism: str

def fetch_gene_summary(gene_symbol: str) -> dict:
    """Queries NCBI Entrez to retrieve verified gene metadata."""
    try:
        search_handle = Entrez.esearch(db="gene", term=f"{gene_symbol}[Gene Name] AND Homo sapiens[Organism]")
        search_results = Entrez.read(search_handle)
        search_handle.close()
        
        id_list = search_results.get("IdList", [])
        if not id_list:
            return {"error": f"No NCBI gene record found for '{gene_symbol}'."}
            
        gene_id = id_list[0]
        
        summary_handle = Entrez.esummary(db="gene", id=gene_id)
        summary_results = Entrez.read(summary_handle)
        summary_handle.close()
        
        doc_sum = summary_results["DocumentSummarySet"]["DocumentSummary"][0]
        
        result = GeneResult(
            gene_id=str(gene_id),
            symbol=doc_sum.get("NomenclatureSymbol", gene_symbol),
            description=doc_sum.get("Description", "No description provided."),
            organism=doc_sum.get("Organism", {}).get("ScientificName", "Homo sapiens")
        )
        return result.model_dump()
        
    except Exception as e:
        return {"error": f"NCBI API execution failed: {str(e)}"}