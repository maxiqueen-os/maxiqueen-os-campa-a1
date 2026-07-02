import os
from pathlib import Path
from sentence_transformers import SentenceTransformer
import numpy as np
import scipy.spatial.distance as dist

# Ruta a la base de conocimiento
BASE_DIR = Path(__file__).resolve().parent.parent.parent / "knowledge_base"

# Modelo de embeddings
model = SentenceTransformer("all-MiniLM-L6-v2")


def search_knowledge(query):
    """Busca el documento más relevante para la pregunta del usuario"""

    if not BASE_DIR.exists():
        return ""

    files = list(BASE_DIR.glob("*.txt"))

    if not files:
        return ""

    docs = []

    for file in files:
        try:
            with open(file, "r", encoding="utf-8") as f:
                docs.append(f.read())
        except:
            continue

    if not docs:
        return ""

    query_emb = model.encode([query])[0]
    doc_embs = model.encode(docs)

    distances = [dist.cosine(query_emb, emb) for emb in doc_embs]

    best_index = np.argmin(distances)

    return docs[best_index][:80000]