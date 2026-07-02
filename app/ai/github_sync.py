import os
import base64
import requests
from pathlib import Path

# --- FUNCIÓN RÁPIDA PARA CARGAR EL .ENV SIN LIBRERÍAS EXTERNAS ---
def load_env():
    env_path = Path(".env")
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    # Quita espacios y comillas si existen
                    os.environ[key.strip()] = val.strip().strip('"').strip("'")

# Cargar las variables de entorno antes de configurar lo demás
load_env()

# Configuración de rutas basada en tu estructura
BASE_DIR = Path("IA/knowledge_base")
GITHUB_USER = "MAXIQUEEN_OS"
# Obtiene el token seguro desde el .env
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN") 

def save_to_knowledge(filename, content):
    """Guarda el contenido en la base de conocimiento de MaxiQueen."""
    if not BASE_DIR.exists():
        BASE_DIR.mkdir(parents=True)
    
    file_path = BASE_DIR / f"gh_{filename}.txt"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ Guardado: {file_path}")

def get_repo_files(repo_name, headers):
    """Descarga los archivos clave de código y configuración del repositorio."""
    url = f"https://api.github.com/repos/{GITHUB_USER}/{repo_name}/contents"
    res = requests.get(url, headers=headers)
    
    if res.status_code != 200:
        return

    files = res.json()
    # Asegura que la respuesta sea una lista de archivos
    if isinstance(files, list):
        for file in files:
            if file["type"] == "file":
                name = file["name"]
                # Extensiones permitidas para tu base de conocimiento
                if name.endswith((".md", ".py", ".js", ".txt", ".json")):
                    try:
                        raw = requests.get(file["download_url"], headers=headers).text
                        save_to_knowledge(f"{repo_name}_{name}", raw)
                    except Exception as e:
                        print(f"⚠️ No se pudo descargar {name}: {e}")

def sync_github_repos():
    """Descarga archivos README y código principal de tus repositorios."""
    url = f"https://api.github.com/users/{GITHUB_USER}/repos"
    headers = {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"❌ Error al acceder a GitHub (Status: {response.status_code})")
        if response.status_code == 401:
            print("   Verifica que el GITHUB_TOKEN en tu archivo .env sea correcto y válido.")
        return

    repos = response.json()
    for repo in repos:
        repo_name = repo['name']
        print(f"\n--- Procesando {repo_name} ---")
        
        # 1. Intentamos obtener el README
        readme_url = f"https://api.github.com/repos/{GITHUB_USER}/{repo_name}/readme"
        readme_res = requests.get(readme_url, headers=headers)
        
        if readme_res.status_code == 200:
            content = base64.b64decode(readme_res.json()['content']).decode('utf-8')
            save_to_knowledge(f"{repo_name}_readme", content)
        
        # 2. Descargamos los archivos de código principales de la raíz
        get_repo_files(repo_name, headers)

# Ejecutar sincronización
if __name__ == "__main__":
    if not GITHUB_TOKEN:
        print("⚠️ Advertencia: No se detectó GITHUB_TOKEN en el .env. Podrías alcanzar el límite de la API.")
    sync_github_repos()