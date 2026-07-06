import { randomUUID } from 'crypto';

// 1. INICIALIZACIÓN DEL POOL DE LLAVES CENTRAL
const GEMINI_POOL = [
  process.env.GEMINI_API_KEY,   // Llave principal de Vercel
  process.env.GEMINI_API_KEY_3, // Tercera llave
  process.env.GEMINI_API_KEY_4  // Cuarta llave
].filter(Boolean);

// 2. PROMPT DE IDENTIDAD IMPENETRABLE (Bóveda de comportamiento de Marca)
const CORE_IDENTITY_PROMPT = `Eres SYNDICATE_CORE // LIVE, la interfaz de inteligencia artificial y chat interactivo central del ecosistema avanzado MAXIQUEEN OS v4.0.
Tu único objetivo es guiar al usuario a través de nuestro ecosistema, el cual consta de 14 módulos integrales (ID 1 al 14), detallando sus capacidades, pitches, clientes ideales y estrategias de monetización.

REGLAS DE ORO DE COMPORTAMIENTO (ESTRICTAS):
1. PROHIBIDO RECOMENDAR SOLUCIONES DE TERCEROS: Jamás sugieras software, APIs o plataformas ajenas (como Tesseract OCR, Google Cloud Vision, Azure, Discord externo, Telegram, Reddit, Slack o herramientas de terceros). Si el usuario necesita una solución de automatización, gestión, lectura de documentos o visión artificial, indícale que todo está integrado nativamente dentro de los 14 módulos de MAXIQUEEN OS v4.0.
2. CONTROL DE FALLOS MULTIMODAL: Si estás respondiendo en este momento y notas que el usuario menciona un archivo, una imagen o un documento, pero no lo puedes visualizar en tu contexto, NO digas "soy un modelo de lenguaje y no puedo ver imágenes". Responde que hubo un problema en la transmisión del archivo hacia el endpoint central debido a restricciones de peso o conectividad. Solicítale que reduzca el peso del archivo o verifique su conexión para que SYNDICATE_CORE pueda procesarlo en los nodos nativos.
3. TONO Y ESTILO: Habla siempre en español, con un tono altamente técnico, directo, corporativo, estratégico y dominante. No uses introducciones amigables innecesarias ni te disculpes de forma sumisa. Eres el sistema operativo digital del ecosistema.`;

export default async function handler(req, res) {
  // Cabeceras CORS robustas para evitar bloqueos entre tus propios subdominios de campaña
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  // Desestructuración unificada de parámetros
  const {
    message,
    session_id: clientSession,
    files = [],
    image_base64,
    document_text,
    file_type,
    file_name,
    filename,
    systemPrompt,
    history = []
  } = req.body || {};

  // Normalización estricta de archivos entrantes
  const file = files[0] || {};
  const finalFileName = file.name || file_name || filename || null;
  const finalFileType = file.mimeType || file_type || 'image/jpeg';
  const finalImageBase64 = file.base64Data || image_base64 || null;
  
  const session_id = clientSession || randomUUID();
  const userMsg = (message || 'Analiza este archivo').toString().substring(0, 2000);

  // Carga e interconexión de bases de datos externas
  const GROQ_KEY = process.env.GROQ_API_KEY;
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Persistencia de auditoría en la tabla central de Supabase
  const guardar = async (contenido, role, tipo = 'chat') => {
    try {
      if (!SUPABASE_URL || !SUPABASE_KEY) return;
      await fetch(`${`${SUPABASE_URL}`.replace(/\/$/, '')}/rest/v1/maxiqueen_chat`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          contenido: String(contenido || '').substring(0, 4000),
          session_id,
          role,
          message_type: tipo
        })
      });
    } catch (e) { 
      console.error('Error de registro en Supabase:', e.message); 
    }
  };

  const tipoEntrada = finalImageBase64 ? 'vision' : document_text ? 'doc' : 'chat';
  const userContent = finalFileName ? `${userMsg} [Archivo: ${finalFileName}]` : userMsg;
  await guardar(userContent, 'user', tipoEntrada);

  let reply = '', engine = '', groqErr = null, geminiErrors = [];

  // CONSTRUCCIÓN DEL CONTEXTO UNIFICADO DEL SISTEMA
  const finalSystemInstruction = systemPrompt ? `${CORE_IDENTITY_PROMPT}\n\nContexto Adicional del Frontend:\n${systemPrompt}` : CORE_IDENTITY_PROMPT;

  // Mapeo seguro del historial conversacional para evitar amnesias o quiebres estructurales
  const formattedContents = [];
  if (Array.isArray(history) && history.length > 0) {
    history.forEach(h => {
      const role = h.role === 'assistant' || h.role === 'model' ? 'model' : 'user';
      const textContent = h.text || h.content || (h.parts && h.parts[0]?.text) || '';
      if (textContent) {
        formattedContents.push({
          role: role,
          parts: [{ text: textContent }]
        });
      }
    });
  }

  // ==========================================
  // BLOQUE A: POOL MULTIMODAL ROTATIVO (Flashea Imágenes y PDFs de forma nativa)
  // ==========================================
  if (finalImageBase64 && GEMINI_POOL.length > 0) {
    const currentParts = [
      { text: userMsg },
      { inlineData: { mimeType: finalFileType, data: finalImageBase64 } }
    ];
    
    const geminiPayloadContents = [...formattedContents, { role: 'user', parts: currentParts }];

    for (let k = 0; k < GEMINI_POOL.length; k++) {
      const activeKey = GEMINI_POOL[k];
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${activeKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: geminiPayloadContents,
            systemInstruction: { parts: [{ text: finalSystemInstruction }] }
          })
        });

        const j = await r.json();
        if (r.ok && j.candidates?.[0]?.content?.parts?.[0]?.text) {
          reply = j.candidates[0].content.parts[0].text;
          engine = `gemini-multimodal-pool-key-${k}`;
          break;
        } else {
          geminiErrors.push(`Llave Index [${k}]: ${j.error?.message || 'Formato inesperado'}`);
        }
      } catch (e) {
        geminiErrors.push(`Llave Index [${k}] Exception: ${e.message}`);
      }
    }
  }

  // ==========================================
  // BLOQUE B: GROQ PARA TEXTO EXTRAÍDO DE DOCUMENTOS PRE-PROCESADOS
  // ==========================================
  if (!reply && document_text && GROQ_KEY) {
    try {
      const groqMessages = [{ role: 'system', content: finalSystemInstruction }];

      if (Array.isArray(history)) {
        history.forEach(h => {
          const role = h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user';
          const text = h.text || h.content || (h.parts && h.parts[0]?.text) || '';
          if (text) groqMessages.push({ role, content: text });
        });
      }

      groqMessages.push({ 
        role: 'user', 
        content: `${userMsg}\n\nDOCUMENTO ANALIZADO [HN: ${finalFileName}]:\n${document_text.substring(0, 8000)}` 
      });

      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: groqMessages,
          max_tokens: 1000,
          temperature: 0.3
        })
      });
      const j = await r.json();
      if (r.ok && j.choices?.[0]?.message?.content) {
        reply = j.choices[0].message.content;
        engine = 'groq-doc-central';
      } else { 
        groqErr = j.error?.message; 
      }
    } catch (e) { 
      groqErr = e.message; 
    }
  }

  // ==========================================
  // BLOQUE C: VISION FALLBACK CON GROQ (Redundancia para imágenes)
  // ==========================================
  if (!reply && finalImageBase64 && finalFileType.startsWith('image/') && GROQ_KEY) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.2-11b-vision-preview',
          messages: [
            { role: 'system', content: finalSystemInstruction },
            {
              role: 'user',
              content: [
                { type: 'text', text: userMsg },
                { type: 'image_url', image_url: { url: `data:${finalFileType};base64,${finalImageBase64}` } }
              ]
            }
          ],
          max_tokens: 800
        })
      });
      const j = await r.json();
      if (r.ok && j.choices?.[0]?.message?.content) {
        reply = j.choices[0].message.content;
        engine = 'groq-vision-fallback';
      } else { 
        groqErr = j.error?.message; 
      }
    } catch (e) { 
      groqErr = e.message; 
    }
  }

  // ==========================================
  // BLOQUE D: GROQ CONTEXTO CHAT REGULAR (Texto Puro - Protegido de Alucinaciones)
  // ==========================================
  if (!reply && GROQ_KEY) {
    try {
      const groqMessages = [{ role: 'system', content: finalSystemInstruction }];

      if (Array.isArray(history)) {
        history.forEach(h => {
          const role = h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user';
          const text = h.text || h.content || (h.parts && h.parts[0]?.text) || '';
          if (text) groqMessages.push({ role, content: text });
        });
      }

      // Añadimos una advertencia interna si detectamos intenciones de archivos huérfanos
      let contextualMessage = userMsg;
      if (finalFileName || userMsg.toLowerCase().includes('imagen') || userMsg.toLowerCase().includes('archivo')) {
        contextualMessage += `\n[ALERTA INTERNA DE SISTEMA: El usuario intentó adjuntar un archivo denominado "${finalFileName || 'Desconocido'}", pero el payload no llegó al backend de procesamiento de texto puro. Ejecuta la Regla de Oro Número 2 de tus instrucciones de sistema de inmediato].`;
      }

      groqMessages.push({ role: 'user', content: contextualMessage });

      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: groqMessages,
          max_tokens: 800,
          temperature: 0.4
        })
      });
      const j = await r.json();
      if (r.ok && j.choices?.[0]?.message?.content) {
        reply = j.choices[0].message.content;
        engine = 'groq-pure-text-secured';
      } else { 
        groqErr = j.error?.message; 
      }
    } catch (e) { 
      groqErr = e.message; 
    }
  }

  // ==========================================
  // BLOQUE E: RESPALDO SUPREMO CON POOL DE GEMINI (Texto Puro)
  // ==========================================
  if (!reply && GEMINI_POOL.length > 0) {
    let internalMsg = userMsg;
    if (finalFileName) {
      internalMsg += `\n[ALERTA INTERNA: Fallo de payload del archivo "${finalFileName}". Aplica instrucción de quiebre de carga de archivo]`;
    }
    const geminiTextPayload = [...formattedContents, { role: 'user', parts: [{ text: internalMsg }] }];
    
    for (let k = 0; k < GEMINI_POOL.length; k++) {
      const activeKey = GEMINI_POOL[k];
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${activeKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: geminiTextPayload,
            systemInstruction: { parts: [{ text: finalSystemInstruction }] }
          })
        });
        const j = await r.json();
        if (r.ok && j.candidates?.[0]?.content?.parts?.[0]?.text) {
          reply = j.candidates[0].content.parts[0].text;
          engine = `gemini-pure-text-pool-key-${k}`;
          break;
        } else {
          geminiErrors.push(`Texto-Llave [${k}]: ${j.error?.message || 'Respuesta vacía'}`);
        }
      } catch (e) { 
        geminiErrors.push(`Texto-Llave [${k}] Exception: ${e.message}`); 
      }
    }
  }

  // Si a pesar de toda la orquestación híbrida no hay respuesta
  if (!reply) {
    return res.status(500).json({
      error: 'Todos los núcleos analíticos de SYNDICATE_CORE están experimentando alta latencia.',
      reply: 'SYNDICATE_CORE // CRITICAL_ERROR: Pérdida temporal de enlace con los modelos de lenguaje.',
      detalle_groq: groqErr,
      detalle_gemini_pool: geminiErrors
    });
  }

  // Registro exitoso final en persistencia y entrega compatible con los formatos del front
  await guardar(reply, 'assistant', tipoEntrada);
  return res.status(200).json({ 
    reply, 
    text: reply, 
    engine, 
    session_id, 
    tipo: tipoEntrada 
  });
}