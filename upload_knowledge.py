import os
import json
from pymongo import MongoClient
from pymongo.server_api import ServerApi

# 🔑 PON AQUÍ TU CADENA DE CONEXIÓN REAL DE MONGODB ATLAS
MONGODB_URI = "mongodb+srv://cesar_admin:MiClaveSegura123@cluster0.abcde.mongodb.net/maxiqueen_db?retryWrites=true&w=majority"

# 📂 Ruta exacta de la carpeta NotebookLM desde donde vas a jalar los datos originales
RUTA_TAKEOUT = r"C:\Users\ASUS\Downloads\takeout-20260519T014745Z-001 (1)\Takeout\NotebookLM"

def conectar_mongo():
    try:
        client = MongoClient(MONGODB_URI, server_api=ServerApi('1'))
        client.admin.command('ping')
        return client["maxiqueen_db"]
    except Exception as e:
        print(f"❌ Error crítico de conexión a MongoDB: {e}")
        return None

def cargar_conocimiento_universal():
    db = conectar_mongo()
    if db is None:
        return
        
    coleccion = db["ia_knowledge"]
    
    if not os.path.exists(RUTA_TAKEOUT):
        print(f"❌ No se encontró la carpeta de origen en: {RUTA_TAKEOUT}")
        return

    print(f"⏳ Indexando archivos desde la carpeta Takeout hacia tu ubicación actual en la nube de Atlas...\n")
    
    contador = 0
    for nombre_archivo in os.listdir(RUTA_TAKEOUT):
        ruta_completa = os.path.join(RUTA_TAKEOUT, nombre_archivo)
        
        if os.path.isdir(ruta_completa):
            continue
            
        ext = nombre_archivo.lower().split('.')[-1]
        
        try:
            # 1. Si el archivo es un JSON (Estructuras de Hotmart, Takeout, etc.)
            if ext == 'json':
                with open(ruta_completa, 'r', encoding='utf-8') as f:
                    contenido_json = json.load(f)
                
                if isinstance(contenido_json, list):
                    for idx, elemento in enumerate(contenido_json):
                        if isinstance(elemento, dict):
                            elemento["tipo"] = "documento_estructurado"
                            elemento["fuente"] = f"notebooklm_{nombre_archivo}_part_{idx}"
                            coleccion.update_one({"fuente": elemento["fuente"]}, {"$set": elemento}, upsert=True)
                elif isinstance(contenido_json, dict):
                    contenido_json["tipo"] = "documento_estructurado"
                    contenido_json["fuente"] = f"notebooklm_{nombre_archivo}"
                    coleccion.update_one({"fuente": f"notebooklm_{nombre_archivo}"}, {"$set": contenido_json}, upsert=True)
                
                contador += 1
                print(f"✅ JSON indexado con éxito: {nombre_archivo}")

            # 2. Para cualquier otra clase de documento (.txt, .md, transcripciones, etc.) sin cortar nada
            else:
                with open(ruta_completa, 'r', encoding='utf-8', errors='ignore') as f:
                    texto_plano = f.read()
                
                if texto_plano.strip():
                    documento = {
                        "tipo": "documento_soporte",
                        "fuente": f"notebooklm_{nombre_archivo}",
                        "contenido": texto_plano
                    }
                    coleccion.update_one({"fuente": documento["fuente"]}, {"$set": documento}, upsert=True)
                    contador += 1
                    print(f"📄 Documento de texto indexado completo [{contador}]: {nombre_archivo}")

        except Exception as e:
            print(f"❌ Error al procesar el archivo {nombre_archivo}: {e}")

    print(f"\n🚀 ¡Ecosistema cargado! Se subieron {contador} fuentes completas a MongoDB desde tu ubicación actual.")

if __name__ == "__main__":
    cargar_conocimiento_universal()