---
title: MaxiQueen OS v2 Backend
emoji: 👑
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# MaxiQueen OS v2 - Integración en Hugging Face Spaces

API de MaxiQueen desplegada en Hugging Face Spaces con soporte para MongoDB Atlas.

## 📋 Requisitos previos

- GitHub o GitLab (para conectar tu repositorio)
- Cuenta en [Hugging Face](https://huggingface.co)
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (para persistencia de datos)
- Node.js 20+ (para desarrollo local)

## 🚀 Pasos de integración

### 1. **Obtener URI de MongoDB Atlas**

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster (gratis está disponible)
3. Ve a **Database** → **Clusters** → Click en tu cluster
4. Selecciona **"Connect"** → **"Drivers"** → **"Node.js"**
5. Copia la URI (se verá como: `mongodb+srv://usuario:contraseña@cluster.mongodb.net/...`)

### 2. **Preparar tu repositorio local**

```bash
# Si aún no tienes git inicializado
git init
git add .
git commit -m "MaxiQueen OS v2 setup para Hugging Face Spaces"
