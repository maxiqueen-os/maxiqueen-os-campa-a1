import sys
import os
from pathlib import Path
import os
import sys
# Elimina cualquier sys.path.append que tengas arriba
# Esto asegura que busquemos desde la carpeta raíz del proyecto
sys.path.append(os.getcwd())

from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

# 2. Imports de tus módulos (esto asume que app/database.py, app/models/user.py etc existen)
from app.database import get_db, engine
from app.models import user as user_model
from app.routes import users, chat, rpg

# 3. Inicialización
app = FastAPI()

# 4. Configuración de Directorios
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "ACTIVE_SYSTEM" # Ajusta si 'ACTIVE_SYSTEM' está en otro lado
STATIC_DIR = FRONTEND_DIR / "static"

# 5. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 6. Crear tablas (¡OJO! Si esto falla, es porque user_model.Base no está bien definido)
user_model.Base.metadata.create_all(bind=engine)

# 7. Rutas
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(rpg.router, prefix="/rpg", tags=["rpg"])

# 8. Archivos estáticos
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def read_index():
    index_file = FRONTEND_DIR / "index.html"
    return FileResponse(index_file) if index_file.exists() else {"error": "index.html no encontrado"}

# 9. Lógica XP
class XPRequest(BaseModel):
    user_id: int
    xp: int

@app.post("/add-xp")
def add_xp(data: XPRequest, db: Session = Depends(get_db)):
    user_db = db.query(user_model.User).filter(user_model.User.id == data.user_id).first()
    if not user_db:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user_db.xp += data.xp
    while user_db.xp >= 100:
        user_db.level += 1
        user_db.xp -= 100

    db.commit()
    db.refresh(user_db)
    return {"user_id": user_db.id, "level": user_db.level, "xp": user_db.xp}