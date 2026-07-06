import os
import subprocess
import sys

def ejecutar_comando(comando):
    """Ejecuta un comando en la terminal y muestra la salida en tiempo real."""
    print(f"\n🚀 Ejecutando: {comando}")
    proceso = subprocess.Popen(comando, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    
    while True:
        linea = proceso.stdout.readline()
        if not linea and proceso.poll() is not None:
            break
        if linea:
            print(linea.strip())
            
    return proceso.poll()

def desplegar_a_vercel():
    print("=== MAXIQUEEN OS - DESPLIEGUE AUTOMÁTICO CON PYTHON ===")
    
    # 1. Verificar si vercel CLI está instalado
    print("\n🔍 Verificando herramientas...")
    if ejecutar_comando("vercel --version") != 0:
        print("❌ Error: Vercel CLI no está instalado. Ejecuta primero: npm install -g vercel")
        sys.exit(1)
        
    # 2. Iniciar sesión (Si no estás logueado, te abrirá el navegador)
    print("\n🔑 Asegurando inicio de sesión en Vercel...")
    ejecutar_comando("vercel login")

    # 3. Vincular y desplegar el proyecto
    # --yes acepta todas las configuraciones por defecto automáticamente
    print("\n📦 Creando el despliegue en Vercel...")
    codigo_salida = ejecutar_comando("vercel --prod --yes")
    
    if codigo_salida == 0:
        print("\n🎉 ¡BRUTAL! Tu proyecto se ha subido correctamente sin usar Git.")
        print("Recuerda revisar que las variables GEMINI_API_KEY y GROQ_API_KEY estén asignadas en el panel web si es un proyecto nuevo.")
    else:
        print("\n❌ Hubo un problema durante el despliegue. Revisa los mensajes de arriba.")

if __name__ == "__main__":
    desplegar_a_vercel()