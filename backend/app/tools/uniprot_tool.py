import httpx
from pydantic import BaseModel, Field

class UniProtInput(BaseModel):
    gene_symbol: str = Field(..., description="Gene symbol to map to a UniProt entry, e.g., TP53")

class ProteinResult(BaseModel):
    uniprot_id: str
    protein_name: str
    gene_name: str
    sequence_length: int

def fetch_uniprot_protein(gene_symbol: str) -> dict:
    """Queries UniProt REST API to fetch verified protein data for a given gene symbol."""
    url = f"https://rest.uniprot.org/uniprotkb/search?query=gene_exact:{gene_symbol} AND organism_id:9606&format=json&size=1"
    
    try:
        response = httpx.get(url, timeout=10.0)
        response.raise_for_status()
        data = response.json()
        
        results = data.get("results", [])
        if not results:
            return {"error": f"No UniProt entry found for gene '{gene_symbol}' in Human (Taxonomy ID: 9606)."}
            
        entry = results[0]
        primary_accession = entry.get("primaryAccession", "")
        
        protein_description = entry.get("proteinDescription", {})
        recommended_name = protein_description.get("recommendedName", {}).get("fullName", {}).get("value", "Unknown Protein Name")
        sequence_length = entry.get("sequence", {}).get("length", 0)
        
        protein_data = ProteinResult(
            uniprot_id=primary_accession,
            protein_name=recommended_name,
            gene_name=gene_symbol.upper(),
            sequence_length=sequence_length
        )
        return protein_data.model_dump()
        
    except httpx.HTTPError as e:
        return {"error": f"UniProt API HTTP request failed: {str(e)}"}
    except Exception as e:
        return {"error": f"Unexpected error during UniProt fetch: {str(e)}"}