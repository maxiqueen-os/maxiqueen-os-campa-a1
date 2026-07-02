import json
import httpx

# =========================
# OLLAMA
# =========================

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

# =========================
# STREAM RESPONSE
# =========================

async def stream_response(
    prompt: str,
    model: str = "maxiqueen:latest"
):

    try:

        async with httpx.AsyncClient(timeout=None) as client:

            async with client.stream(
                "POST",
                OLLAMA_URL,
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": True
                }
            ) as response:

                # =========================
                # ERROR STATUS
                # =========================

                if response.status_code != 200:

                    error_text = await response.aread()

                    yield f"\n❌ Error Ollama ({response.status_code})\n"

                    yield error_text.decode("utf-8")

                    return

                # =========================
                # STREAM TOKENS
                # =========================

                async for line in response.aiter_lines():

                    if not line:
                        continue

                    try:

                        chunk = json.loads(line)

                        if "response" in chunk:

                            yield chunk["response"]

                        if chunk.get("done", False):

                            break

                    except json.JSONDecodeError:

                        continue

    # =========================
    # CONNECTION ERROR
    # =========================

    except httpx.RequestError as e:

        yield f"\n❌ Error de conexión con Ollama:\n{str(e)}"

    # =========================
    # UNKNOWN ERROR
    # =========================

    except Exception as e:

        yield f"\n❌ Error interno:\n{str(e)}"