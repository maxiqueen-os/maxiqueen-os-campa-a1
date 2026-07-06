import os
import json
from bs4 import BeautifulSoup # Necesitarás instalarlo: pip install beautifulsoup4

RUTA_RAIZ = "./"  # Asegúrate de ejecutar esto desde la raíz de MAXIQUEEN_WEB_V2
ARCHIVO_SALIDA = "maxiqueen_brain.json"
EXTENSIONES_VALIDAS = ('.json', '.html')

def limpiar_html(texto):
    soup = BeautifulSoup(texto, 'html.parser')
    return soup.get_text(separator=' ', strip=True)

def construir_cerebro():
    base_conocimiento = []
    
    print("🚀 Iniciando absorción de MaxiQueen OS...")
    
    for raiz, directorios, archivos in os.walk(RUTA_RAIZ):
        for archivo in archivos:
            if archivo.endswith(EXTENSIONES_VALIDAS):
                ruta_completa = os.path.join(raiz, archivo)
                try:
                    contenido = ""
                    if archivo.endswith('.json'):
                        with open(ruta_completa, 'r', encoding='utf-8') as f:
                            contenido = json.dumps(json.load(f))
                    elif archivo.endswith('.html'):
                        with open(ruta_completa, 'r', encoding='utf-8', errors='ignore') as f:
                            contenido = limpiar_html(f.read())
                    
                    if contenido:
                        base_conocimiento.append({
                            "archivo": archivo,
                            "ruta": ruta_completa,
                            "texto": contenido[:5000] # Limitamos para no saturar la memoria
                        })
                        print(f"✅ Procesado: {archivo}")
                except Exception as e:
                    print(f"⚠️ Error en {archivo}: {e}")

    with open(ARCHIVO_SALIDA, 'w', encoding='utf-8') as f:
        json.dump(base_conocimiento, f, ensure_ascii=False, indent=2)
    
    print(f"\n🎉 ¡Cerebro consolidado! Se han integrado {len(base_conocimiento)} archivos en '{ARCHIVO_SALIDA}'.")

# 🌐 FUNCIÓN GLOBAL (Disponible para ser importada por app/routes/chat.py)
def buscar_contexto_en_nube(mensaje: str):
    """
    Busca palabras clave dentro de los 112 documentos de arquitectura
    consolidados en la base de conocimiento final.
    """
    import json
    contexto = ""
    # Filtramos palabras clave de más de 4 letras para buscar coincidencia real
    palabras = [w.lower() for w in mensaje.split() if len(w) > 4]
    
    try:
        with open("knowledge_base_final.json", "r", encoding="utf-8") as f:
            base_completa = json.load(f)
        
        if isinstance(base_completa, list):
            for item in base_completa:
                texto = str(item.get("texto", item.get("contenido", ""))).lower()
                if any(word in texto for word in palabras):
                    fuente = item.get("archivo", item.get("fuente", "Documento Técnico"))
                    contexto += f"\n--- DOC NUBE ({fuente}) ---\n{item.get('texto', item.get('contenido', ''))[:500]}...\n"
    except Exception as e:
        print("⚠️ Error al leer los 112 documentos en tiempo real:", e)
        
    return contexto if contexto else "No se encontró contexto técnico específico para esta consulta."

# El bloque de ejecución directa de este script
if __name__ == "__main__":
    construir_cerebro()