// api/chat.js (BACKEND PROTEGIDO - BÓVEDA CENTRAL v2 MULTIMODAL CORREGIDO)

const API_KEYS_POOL = [
    process.env.GEMINI_API_KEY_1, 
    process.env.GEMINI_API_KEY_2, 
    process.env.GEMINI_API_KEY_3, 
    process.env.GEMINI_API_KEY_4, 
    process.env.GEMINI_API_KEY_5  
].filter(Boolean); 

let currentKeyIndex = 0;

export default async function handler(req, res) {
    // Seguridad básica: bloquear si no es una petición de datos POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    // Recibimos los parámetros del frontend
    const { message, systemPrompt, files } = req.body;

    if (API_KEYS_POOL.length === 0) {
        return res.status(500).json({ text: "MAXIQUEEN OS: No se encontraron llaves de acceso en el servidor." });
    }

    // 1. CONSTRUCCIÓN DINÁMICA DEL CONTENIDO MULTIMODAL
    const parts = [];
    
    // Si el usuario envió texto, lo agregamos
    if (message) {
        parts.push({ text: message });
    }

    // Si el usuario adjuntó archivos
    if (files && Array.isArray(files)) {
        files.forEach(file => {
            if (file.mimeType && file.base64Data) {
                parts.push({
                    inlineData: {
                        mimeType: file.mimeType,
                        data: file.base64Data
                    }
                });
            }
        });
    }

    // Evitamos enviar una petición vacía
    if (parts.length === 0) {
        return res.status(400).json({ text: "MAXIQUEEN OS: No se envió ningún mensaje o archivo válido." });
    }

    // Ciclo de rotación de llaves
    for (let i = 0; i < API_KEYS_POOL.length; i++) {
        const activeKey = API_KEYS_POOL[currentKeyIndex];

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{ text: systemPrompt || "Eres MaxiQueen OS, una arquitectura digital avanzada." }]
                        },
                        contents: [{
                            parts: parts
                        }]
                    })
                }
            );

            const data = await response.json();

            // Si Google responde con un error estructurado, rotamos de inmediato
            if (data.error) {
                console.warn(`[MQ_API] Llave índice ${currentKeyIndex} falló:`, data.error.message);
                currentKeyIndex = (currentKeyIndex + 1) % API_KEYS_POOL.length;
                continue; 
            }

            // VALIDACIÓN PREMIUM SEGURO: Evita el crash al leer la respuesta de Gemini
            if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
            } else {
                // Si la estructura vino rara pero no tiró error explícito
                console.warn("[MQ_API] Respuesta inesperada de Gemini:", JSON.stringify(data));
                currentKeyIndex = (currentKeyIndex + 1) % API_KEYS_POOL.length;
                continue;
            }

        } catch (err) {
            console.error(`[MQ_API_EXCEPTION] Error en la petición con llave ${currentKeyIndex}:`, err);
            currentKeyIndex = (currentKeyIndex + 1) % API_KEYS_POOL.length;
        }
    }

    // Si todas las llaves fallaron o están vacías
    return res.status(500).json({ text: "MAXIQUEEN OS: Todos los núcleos de IA están saturados en este momento." });
}
