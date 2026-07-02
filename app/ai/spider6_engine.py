import re
from typing import List, Dict
from duckduckgo_search import DDGS
from app.core.memory import get_memory

# ... el resto de tus funciones (clean_text, chunk_text, etc.)
# 🔹 UTIL: limpieza básica
def clean_text(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


# 🔹 CHUNKING inteligente (mejorado)
def chunk_text(text: str, size: int = 300, overlap: int = 50) -> List[str]:
    words = text.split()
    chunks = []

    if not words:
        return chunks

    step = size - overlap

    for i in range(0, len(words), step):
        chunk = " ".join(words[i:i + size])
        chunks.append(chunk)

    return chunks


# 🔹 SIMILITUD SIMPLE (optimizada)
def simple_score(query: str, text: str) -> float:
    query_words = set(query.lower().split())
    text_words = set(text.lower().split())

    if not query_words or not text_words:
        return 0.0

    intersection = query_words & text_words

    return len(intersection) / len(query_words)


# 🔹 SEARCH DOCS
def search_docs(query: str) -> List[str]:
    fake_docs = [
        "MaxiQueen OS es un sistema SaaS inteligente.",
        "El módulo de automatización permite crear flujos.",
        "El sistema usa IA con memoria y contexto dinámico."
    ]
    return fake_docs


# 🔹 SEARCH WEB
def search_web(query: str) -> List[str]:
    """Busca en internet en tiempo real sin pagar un centavo."""
    print(f"🔍 Spider6 buscando en la web: {query}")
    results = []
    try:
        # Usamos el motor de búsqueda DuckDuckGo de forma anónima
        with DDGS() as ddgs:
            # Buscamos los 3 mejores resultados del último año para tener datos frescos
            search_results = ddgs.text(query, region='wt-wt', safesearch='off', timelimit='y', max_results=3)
            for r in search_results:
                content = f"TÍTULO: {r['title']}\nRESUMEN: {r['body']}\nURL: {r['href']}"
                results.append(content)
        return results
    except Exception as e:
        print(f"⚠️ Error en Spider6 Web: {e}")
        return ["No se pudo acceder a internet, usando base de datos local."]


# 🔹 SEARCH MEMORY
def search_memory(user_id: str) -> List[str]:
    history = get_memory(user_id)

    if not history:
        return []

    return [f"{msg['role']}: {msg['content']}" for msg in history]


# 🔥 MOTOR CENTRAL
def combinar_contextos(query: str, sources: Dict[str, List[str]], top_k: int = 5) -> str:

    scored_chunks = []

    for source_name, texts in sources.items():

        if not texts:
            continue

        for text in texts:
            clean = clean_text(text)

            if not clean:
                continue

            chunks = chunk_text(clean)

            for chunk in chunks:
                score = simple_score(query, chunk)

                scored_chunks.append({
                    "text": chunk,
                    "score": score,
                    "source": source_name
                })

    if not scored_chunks:
        return "Sin contexto relevante."

    # 🔥 ordenar por relevancia
    ranked = sorted(scored_chunks, key=lambda x: x["score"], reverse=True)

    # 🔥 eliminar duplicados (MUY PRO)
    seen = set()
    unique_chunks = []

    for item in ranked:
        if item["text"] not in seen:
            seen.add(item["text"])
            unique_chunks.append(item)

    # 🔥 top resultados
    top_chunks = unique_chunks[:top_k]

    # 🔥 formateo final
    contexto_final = "\n\n".join(
        f"[{c['source'].upper()} | score={round(c['score'], 2)}]\n{c['text']}"
        for c in top_chunks
    )

    return contexto_final


# 🕷️ SPIDER6
# 🕷️ SPIDER6 (Mejorado)
def spider6(query: str, user_id: str) -> str:
    docs = search_docs(query)
    memory = search_memory(user_id)

    # 🔥 Si la pregunta parece una búsqueda de información sobre alguien o algo nuevo
    intentos_de_busqueda = ["quien es", "informacion sobre", "que es", "cesar", "noticia", "precio"]
    
    if any(word in query.lower() for word in intentos_de_busqueda) or len(docs) < 1:
        web = search_web(query)
    else:
        web = []

    sources = {"docs": docs, "memory": memory, "web": web}
    return combinar_contextos(query, sources)