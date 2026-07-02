import requests
import json
from app.core.memory import save_message # Asegúrate de que este nombre coincida con memory.py

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

def generate_response(prompt, user_id):
    payload = {
        "model": "maxiqueen",  # <--- USAMOS TU MODELO REAL
        "prompt": prompt,
        "stream": True,
        "options": {
            "num_predict": 500,
            "temperature": 0.5, # Menos temperatura = más enfocado en negocios
            "num_ctx": 4096
        }
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, stream=True, timeout=120)
        full_reply = ""

        for line in response.iter_lines(decode_unicode=True):
            if line:
                data = json.loads(line)
                token = data.get("response", "")
                full_reply += token
                yield token
                
                if data.get("done", False):
                    # Guardamos en TU base de datos local al terminar
                    save_message("assistant", full_reply, user_id)
                    break

    except Exception as e:
        yield f"⚠️ Error en MaxiQueen Engine: {str(e)}"