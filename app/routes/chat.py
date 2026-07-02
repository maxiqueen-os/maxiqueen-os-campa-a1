from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime
from pathlib import Path

from app.services.ai_service import stream_response
from app.ai.spider6_engine import spider6
from app.core.memory import get_memory, save_message
import json

# 🧠 CARGA EL CEREBRO UNA SOLA VEZ AL INICIAR
try:
    with open("maxiqueen_brain.json", "r", encoding="utf-8") as f:
        MAXIQUEEN_BRAIN = json.load(f)
        print("✅ Cerebro MaxiQueen OS cargado en memoria.")
except:
    MAXIQUEEN_BRAIN = []
    print("⚠️ Cerebro no encontrado, operando sin conocimiento local.")

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

        try:
            contexto = spider6(req.message, user_id)
        except Exception as e:
            contexto = f"Error spider6: {e}"

        try:
            history = get_memory(user_id)[-5:]
        except Exception as e:
            print("Error memory:", e)
            history = []

        history_text = "\n".join([f"{m['role']}: {m['content']}" for m in history])
        intent = detect_intent(req.message)
        model = select_model(intent)

        conocimiento_local = ""
        palabras_usuario = [w.lower() for w in req.message.split() if len(w) > 4]
        
        for item in MAXIQUEEN_BRAIN:
            texto_base = item.get("texto", "").lower()
            if any(word in texto_base for word in palabras_usuario):
                archivo_nombre = item.get("archivo", "archivo_maxiqueen")
                conocimiento_local += f"\n--- RECUERDO ({archivo_nombre}) ---\n{texto_base[:300]}..."

        full_prompt = f"""
Eres el núcleo de inteligencia de MaxiQueen OS.
Tu rol: Automatizar, optimizar, analizar y proponer acciones.
Responde estructurado, sin relleno, enfocado en resultados.

HISTORIAL:
{history_text}

CONTEXTO TÉCNICO (Cerebro Local):
{conocimiento_local}

CONTEXTO DINÁMICO (Spider6):
{contexto}

USUARIO:
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

    # AQUÍ ES DONDE ESTABA EL ERROR. Retorno limpio:
    return StreamingResponse(generator(), media_type="text/plain")