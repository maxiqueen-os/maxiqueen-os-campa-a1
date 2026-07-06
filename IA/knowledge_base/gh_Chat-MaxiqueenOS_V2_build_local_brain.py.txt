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

if __name__ == "__main__":
    construir_cerebro()