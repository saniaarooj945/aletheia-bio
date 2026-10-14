from app.tools.ncbi_tool import fetch_gene_summary
from app.tools.uniprot_tool import fetch_uniprot_protein

print("--- NCBI Entrez Data ---")
print(fetch_gene_summary("TP53"))

print("\n--- UniProt Protein Data ---")
print(fetch_uniprot_protein("TP53"))