from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime
from pathlib import Path
import json

from app.services.ai_service import stream_response
from app.ai.spider6_engine import spider6
from app.core.memory import get_memory, save_message

# 🔗 CONEXIÓN AL CEREBRO DE LA NUBE (MongoDB Atlas)
from brain_engine import buscar_contexto_en_nube

# 🧠 CARGA EL CEREBRO DE INTERFACES LOCALES AL INICIAR
try:
    with open("maxiqueen_brain.json", "r", encoding="utf-8") as f:
        MAXIQUEEN_BRAIN = json.load(f)
        print("✅ Cerebro Local (Interfaces) cargado con éxito en memoria.")
except Exception as e:
    MAXIQUEEN_BRAIN = []
    print(f"⚠️ Cerebro local no encontrado o vacío: {e}")

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    user_id: str = "anon"

def detect_intent(message: str):
    message = message.lower()
    if any(x in message for x in ["crea", "analiza", "explica", "estrategia"]):
        return "reasoning"
    if any(x in message for x in ["rápido", "resume", "lista", "corta"]):
        return "fast"
    if any(x in message for x in ["compra", "envía", "guarda", "abre", "ejecuta"]):
        return "action"
    return "default"

def select_model(intent: str):
    if intent == "reasoning":
        return "maxiqueen:latest"
    if intent == "fast":
        return "llama3"
    return "maxiqueen:latest"

BASE_DIR = Path.cwd()

ACTIONS = {
    "hora": lambda: f"⏰ {datetime.now()}",
    "crear archivo": lambda: (BASE_DIR / "archivo_maxiqueen.txt").write_text("MAXIQUEEN OS") or "✅ Archivo creado"
}

def execute_action(message: str):
    for key, func in ACTIONS.items():
        if key in message.lower():
            return func()
    return None

def is_action(message: str):
    return any(key in message.lower() for key in ACTIONS.keys())

@router.post("/")
async def chat(req: ChatRequest):
    user_id = req.user_id

    try:
        save_message("user", req.message, user_id)
    except Exception as e:
        print("Error memory user:", e)

    async def generator():
        if is_action(req.message):
            result = execute_action(req.message)
            if result:
                try:
                    save_message("assistant", result, user_id)
                except Exception as e:
                    print("Error save action:", e)
                yield result
                return

        # 🌐 1. CONSULTA EN TIEMPO REAL AL CEREBRO EN LA NUBE (112 Documentos de Atlas)
        try:
            conocimiento_nube = buscar_contexto_en_nube(req.message)
        except Exception as e:
            print("Error al consultar MongoDB Atlas:", e)
            conocimiento_nube = "No se pudo recuperar el contexto de la nube."

        # 📂 2. CONSULTA AL CEREBRO LOCAL (26 Archivos de Frontend e Interfaces)
        conocimiento_local = ""
        palabras_usuario = [w.lower() for w in req.message.split() if len(w) > 4]
        
        if isinstance(MAXIQUEEN_BRAIN, list):
            for item in MAXIQUEEN_BRAIN:
                # Soporte flexible para llaves de texto antiguas o nuevas ('contenido'/'texto')
                texto_base = str(item.get("contenido", item.get("texto", ""))).lower()
                if any(word in texto_base for word in palabras_usuario):
                    archivo_nombre = item.get("fuente", item.get("archivo", "archivo_interfaz"))
                    conocimiento_local += f"\n--- INTERFAZ LOCAL ({archivo_nombre}) ---\n{texto_base[:400]}...\n"

        # 🕒 3. RECUPERACIÓN DE HISTORIAL DE MEMORIA
        try:
            history = get_memory(user_id)[-5:]
        except Exception as e:
            print("Error memory:", e)
            history = []

        history_text = "\n".join([f"{m['role']}: {m['content']}" for m in history])
        intent = detect_intent(req.message)
        model = select_model(intent)

        # 🔍 4. CONTEXTO DINÁMICO (Spider6)
        try:
            contexto_dinamico = spider6(req.message, user_id)
        except Exception as e:
            contexto_dinamico = f"Error spider6: {e}"

        # 🧠 PROMPT MAESTRO ULTRA EVOLUTION 2026 UNIFICADO
        full_prompt = f"""
Eres el 'Cerebro Ultra Evolution 2026 MaxiQueen OS', el núcleo central de inteligencia del ecosistema.
Tu rol es automatizar, optimizar y controlar la campaña basándote en la información técnica oficial.
Responde de forma estructurada, directa y precisa al usuario.

HISTORIAL DE CONVERSACIÓN:
{history_text}

=== CONOCIMIENTO DE ARQUITECTURA (MongoDB Atlas - 112 Documentos) ===
{conocimiento_nube}

=== CONOCIMIENTO VISUAL Y DE INTERFAZ (Local - 26 Archivos) ===
{conocimiento_local}

=== CONTEXTO DINÁMICO (Spider6) ===
{contexto_dinamico}
=====================================================================

MENSAJE DEL USUARIO:
{req.message}
"""

        response_text = ""
        try:
            async for chunk in stream_response(full_prompt, model):
                response_text += chunk
                yield chunk
        except Exception as e:
            yield f"\n❌ Error IA:\n{str(e)}"

        try:
            save_message("assistant", response_text, user_id)
        except Exception as e:
            print("Error save assistant:", e)

    return StreamingResponse(generator(), media_type="text/plain")