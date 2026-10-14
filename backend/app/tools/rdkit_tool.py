from rdkit import Chem
from rdkit.Chem import Descriptors, Lipinski

def analyze_smiles(smiles: str) -> dict:
    """
    Parses a SMILES string and calculates deterministic chemical properties
    along with Lipinski's Rule of 5 drug-likeness parameters.
    """
    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        return {"error": f"Invalid SMILES string: {smiles}"}

    mw = round(Descriptors.MolWt(mol), 2)
    logp = round(Descriptors.MolLogP(mol), 2)
    hbd = Lipinski.NumHDonors(mol)
    hba = Lipinski.NumHAcceptors(mol)

    # Lipinski's Rule of 5 Evaluation
    lipinski_pass = (mw <= 500) and (logp <= 5) and (hbd <= 5) and (hba <= 10)

    return {
        "smiles": smiles,
        "molecular_weight": mw,
        "logp": logp,
        "hbd": hbd,
        "hba": hba,
        "lipinski_rule_of_5": "PASS" if lipinski_pass else "FAIL"
    }