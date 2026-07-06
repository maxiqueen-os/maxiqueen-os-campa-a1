import os
import json
from pymongo import MongoClient

# 📂 Ruta exacta donde están tus archivos sincronizados de GitHub
RUTA_TAKEOUT = os.path.join(os.getcwd(), "IA", "knowledge_base")

# 💾 Archivo donde se guardará tu conocimiento consolidado
ARCHIVO_SALIDA = "knowledge_base_final.json"

# 🔗 Configura tu URI real de Atlas (¡REEMPLAZA TU_CONTRASEÑA_REAL!)
MONGO_URI = "mongodb+srv://Vercel-Admin-Maxi-Queen_OS:3125482523Max@maxi-queen-os.nh1tkn7.mongodb.net/?appName=Maxi-Queen-OS"

def cargar_conocimiento_local():
    if not os.path.exists(RUTA_TAKEOUT):
        print(f"❌ No se encontró la carpeta de origen en: {RUTA_TAKEOUT}")
        return

    print(f"⏳ Indexando archivos localmente hacia {ARCHIVO_SALIDA}...\n")
    
    # Aquí acumularemos todo el conocimiento
    base_de_conocimiento = []
    contador = 0

    # 1. CICLO PARA PROCESAR LOS 112 ARCHIVOS LOCALES
    for nombre_archivo in os.listdir(RUTA_TAKEOUT):
        ruta_completa = os.path.join(RUTA_TAKEOUT, nombre_archivo)
        
        if os.path.isdir(ruta_completa):
            continue
            
        ext = nombre_archivo.lower().split('.')[-1]
        
        try:
            # A. Procesamiento de archivos JSON
            if ext == 'json':
                with open(ruta_completa, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Agregamos metadatos de origen
                    if isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict):
                                item["tipo"] = "documento_estructurado"
                                item["fuente"] = nombre_archivo
                                base_de_conocimiento.append(item)
                    elif isinstance(data, dict):
                        data["tipo"] = "documento_estructurado"
                        data["fuente"] = nombre_archivo
                        base_de_conocimiento.append(data)
                contador += 1
                print(f"✅ Procesado JSON: {nombre_archivo}")

            # B. Procesamiento de archivos de texto (.txt, .md, etc)
            else:
                with open(ruta_completa, 'r', encoding='utf-8', errors='ignore') as f:
                    texto = f.read()
                
                if texto.strip():
                    doc = {
                        "tipo": "documento_soporte",
                        "fuente": nombre_archivo,
                        "contenido": texto
                    }
                    base_de_conocimiento.append(doc)
                    contador += 1
                    print(f"📄 Procesado Documento [{contador}]: {nombre_archivo}")

        except Exception as e:
            print(f"❌ Error al procesar {nombre_archivo}: {e}")

    # 2. GUARDAR TODO EN UN SOLO ARCHIVO JSON LOCAL
    with open(ARCHIVO_SALIDA, 'w', encoding='utf-8') as f:
        json.dump(base_de_conocimiento, f, ensure_ascii=False, indent=4)
    
    print(f"\n🚀 ¡Éxito! Se consolidó el conocimiento en: {ARCHIVO_SALIDA}")
    print(f"Total de fuentes indexadas: {contador}")

    # =====================================================================
    # 3. 🌐 SUBIDA A MONGODB ATLAS (Se ejecuta al finalizar la consolidación)
    # =====================================================================
    try:
        print("\n⏳ Conectando a MongoDB Atlas para cargar el conocimiento...")
        client = MongoClient(MONGO_URI)
        
        # Selecciona la base de datos y la colección destino
        db = client["Maxi-Queen-OS"]
        coleccion = db["knowledge_base"]
        
        # Cargar los datos desde el archivo que se acaba de crear
        with open(ARCHIVO_SALIDA, "r", encoding="utf-8") as f:
            datos_conocimiento = json.load(f)
            
        # Validar la estructura e insertar los documentos en la nube
        if isinstance(datos_conocimiento, list) and len(datos_conocimiento) > 0:
            print("🧹 Limpiando registros antiguos en la colección...")
            coleccion.delete_many({}) 
            
            print("📤 Subiendo el nuevo conocimiento consolidado...")
            resultado = coleccion.insert_many(datos_conocimiento)
            print(f"✅ ¡Conocimiento cargado en la nube! Se subieron {len(resultado.inserted_ids)} registros con éxito.")
        elif isinstance(datos_conocimiento, dict):
            print("🧹 Limpiando registros antiguos en la colección...")
            coleccion.delete_many({})
            resultado = coleccion.insert_one(datos_conocimiento)
            print("✅ ¡Conocimiento cargado en la nube! Se subió la estructura correctamente.")
        else:
            print("⚠️ El archivo JSON está vacío o no tiene un formato válido para MongoDB.")

    except Exception as e:
        print(f"❌ Error al subir los datos a MongoDB Atlas: {e}")

if __name__ == "__main__":
    cargar_conocimiento_local()