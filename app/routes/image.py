from fastapi import APIRouter, UploadFile, File, HTTPException
import cloudinary
import cloudinary.uploader

# Mantenemos el prefijo para que la URL sea: http://localhost:8000/image/upload
router = APIRouter(prefix="/image", tags=["Assets"])

# Configuración con tus datos de MAMAmaxiqueen-os
cloudinary.config( 
  cloud_name = "maxiqueen-os", 
  api_key = "833393951928619", 
  api_secret = "fjiU4dL5rXlVZfcOlpfUFbkyJgE" 
)

@router.post("/upload")
async def upload_asset(file: UploadFile = File(...)):
    try:
        # Aquí usamos el preset 'maxiqueen-os' que tienes en verde (Signed)
        # Esto hace que la subida sea PRIVADA y SEGURA.
        result = cloudinary.uploader.upload(
            file.file,
            upload_preset="maxiqueen-os",
            folder="maxiqueenos" # La carpeta que ya creaste
        )
        
        # Devolvemos la URL real de internet, no una ruta de tu PC
        return {
            "status": "success", 
            "url": result.get("secure_url"),
            "public_id": result.get("public_id")
        }
    except Exception as e:
        # Si algo falla (ej. internet o llaves mal), te dirá qué pasó
        raise HTTPException(status_code=500, detail=str(e))