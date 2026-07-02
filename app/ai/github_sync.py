import requests
import os
import base64
from pathlib import Path

# Configuración de rutas basada en tu estructura
BASE_DIR = Path("IA/knowledge_base")
GITHUB_USER = "MAXIQUEEN_OS"
# Es recomendable usar un Token para evitar límites de descarga
GITHUB_TOKEN = "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" 
def save_to_knowledge(filename, content):
    """Guarda el contenido en la base de conocimiento de MaxiQueen."""
    if not BASE_DIR.exists():
        BASE_DIR.mkdir(parents=True)
    
    file_path = BASE_DIR / f"gh_{filename}.txt"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ Guardado: {file_path}")

def sync_github_repos():
    """Descarga archivos README y código principal de tus repositorios."""
    url = f"https://api.github.com/users/{GITHUB_USER}/repos"
    headers = {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print("❌ Error al acceder a GitHub")
        return

    repos = response.json()
    for repo in repos:
        repo_name = repo['name']
        print(f"--- Procesando {repo_name} ---")
        
        # Intentamos obtener el README como fuente principal de conocimiento
        readme_url = f"https://api.github.com/repos/{GITHUB_USER}/{repo_name}/readme"
        readme_res = requests.get(readme_url, headers=headers)
        
        if readme_res.status_code == 200:
            content = base64.b64decode(readme_res.json()['content']).decode('utf-8')
            save_to_knowledge(f"{repo_name}_readme", content)

def get_repo_files(repo_name):
    url = f"https://api.github.com/repos/{GITHUB_USER}/{repo_name}/contents"
    headers = {"Authorization": f"token {GITHUB_TOKEN}"}

    res = requests.get(url, headers=headers)
    files = res.json()

    for file in files:
        if file["type"] == "file":
            name = file["name"]

            if name.endswith((".md",".py",".js",".txt",".json")):
                raw = requests.get(file["download_url"]).text
                save_to_knowledge(f"{repo_name}_{name}", raw)
                
# Ejecutar sincronización
if __name__ == "__main__":
    sync_github_repos()