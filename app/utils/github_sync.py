import requests
import os
import base64
from pathlib import Path

# ==========================================
# CONFIGURACIÓN
# ==========================================
# 📂 Carpeta donde se guardará la "memoria"
BASE_DIR = Path("IA/knowledge_base")

# 👤 ¡IMPORTANTE! Cambia esto por tu usuario de GitHub (ejemplo: "cesarbedoya")
GITHUB_USER = "TU_USUARIO_DE_GITHUB" 

# 🔑 Tu Token (Ya está puesto correctamente)
GITHUB_TOKEN = "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"

# ==========================================

def save_to_knowledge(filename, content):
    """Guarda el contenido en la base de conocimiento de MaxiQueen."""
    if not BASE_DIR.exists():
        BASE_DIR.mkdir(parents=True)
    
    file_path = BASE_DIR / f"gh_{filename}.txt"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ Guardado: {file_path}")

def sync_github_repos():
    """Descarga archivos README de tus repositorios."""
    url = f"https://api.github.com/users/{GITHUB_USER}/repos"
    # Usamos el formato para Fine-Grained Tokens (Bearer)
    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 401:
        print("❌ Error: El Token es inválido o expiró.")
        return
    elif response.status_code != 200:
        print(f"❌ Error al acceder a GitHub: {response.status_code}")
        return

    repos = response.json()
    if not repos:
        print("ℹ️ No se encontraron repositorios públicos.")
        return

    for repo in repos:
        repo_name = repo['name']
        print(f"--- Procesando {repo_name} ---")
        
        # Intentamos obtener el README
        readme_url = f"https://api.github.com/repos/{GITHUB_USER}/{repo_name}/readme"
        readme_res = requests.get(readme_url, headers=headers)
        
        if readme_res.status_code == 200:
            content = base64.b64decode(readme_res.json()['content']).decode('utf-8')
            save_to_knowledge(f"{repo_name}_readme", content)
        else:
            print(f"⚠️ No se encontró README para {repo_name}")

if __name__ == "__main__":
    sync_github_repos()