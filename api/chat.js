import { randomUUID } from 'crypto';

// 1. INICIALIZACIÓN DEL POOL DE LLAVES (Incluye la llave maestra sin número)
const GEMINI_POOL = [
  process.env.GEMINI_API_KEY,   // Tu llave principal de Vercel
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3, // Tu tercera llave de Vercel
  process.env.GEMINI_API_KEY_4, // Tu cuarta llave de Vercel
  process.env.GEMINI_API_KEY_5
].filter(Boolean);

export default async function handler(req, res) {
  // Configuración de Cabeceras CORS robustas
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  // 2. DESESTRUCTURACIÓN UNIFICADA (Mantiene compatibilidad absoluta entre frontends)
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

  // 3. NORMALIZACIÓN ESTRICTA DE ENTRADAS
  const file = files[0] || {};
  const finalFileName = file.name || file_name || filename || null;
  const finalFileType = file.mimeType || file_type || 'image/jpeg';
  const finalImageBase64 = file.base64Data || image_base64 || null;
  
  const session_id = clientSession || randomUUID();
  const userMsg = (message || 'Analiza este archivo').toString().substring(0, 2000);

  // Carga de Credenciales
  const GROQ_KEY = process.env.GROQ_API_KEY;
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Persistencia en base de datos Supabase
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

  // 4. MAPEO SEGURO DEL HISTORIAL PARA NÚCLEOS GEMINI (Previene amnesia y desestructuraciones inválidas)
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
  // BLOQUE A: GEMINI MULTIMODAL CON POOL DE RETRY ROTATIVO (Imágenes / Archivos nativos)
  // ==========================================
  if (finalImageBase64 && GEMINI_POOL.length > 0) {
    const currentParts = [
      { text: userMsg },
      { inlineData: { mimeType: finalFileType, data: finalImageBase64 } }
    ];
    
    const geminiPayloadContents = [...formattedContents, { role: 'user', parts: currentParts }];
    const defaultSystemInstruction = systemPrompt || "Eres el asistente del MAPA MAXIQUEEN OS v0.8. Conoces los 14 módulos completos con sus pitches, capacidades, clientes ideales y monetización. Responde en español, directo y técnico.";

    // El ciclo recorre el pool dinámicamente de forma local por petición
    for (let k = 0; k < GEMINI_POOL.length; k++) {
      const activeKey = GEMINI_POOL[k];
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${activeKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: geminiPayloadContents,
            systemInstruction: { parts: [{ text: defaultSystemInstruction }] }
          })
        });

        const j = await r.json();
        if (r.ok && j.candidates?.[0]?.content?.parts?.[0]?.text) {
          reply = j.candidates[0].content.parts[0].text;
          engine = `gemini-multimodal-pool-key-${k}`;
          break; // Llave funcional encontrada. Rompemos el ciclo.
        } else {
          geminiErrors.push(`Llave Index [${k}]: ${j.error?.message || 'Formato inesperado'}`);
        }
      } catch (e) {
        geminiErrors.push(`Llave Index [${k}] Exception: ${e.message}`);
      }
    }
  }

  // ==========================================
  // BLOQUE B: GROQ PARA TEXTO EXTRAÍDO DE DOCUMENTOS
  // ==========================================
  if (!reply && document_text && GROQ_KEY) {
    try {
      const groqMessages = [
        { role: 'system', content: systemPrompt || 'Eres MaxiBot de MQ NEXUS. Responde en español, directo y estratégico.' }
      ];

      if (Array.isArray(history)) {
        history.forEach(h => {
          const role = h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user';
          const text = h.text || h.content || (h.parts && h.parts[0]?.text) || '';
          if (text) groqMessages.push({ role, content: text });
        });
      }

      groqMessages.push({ 
        role: 'user', 
        content: `${userMsg}\n\nDOCUMENTO ADJUNTO [${finalFileName}]:\n${document_text.substring(0, 8000)}` 
      });

      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: groqMessages,
          max_tokens: 1000,
          temperature: 0.5
        })
      });
      const j = await r.json();
      if (r.ok && j.choices?.[0]?.message?.content) {
        reply = j.choices[0].message.content;
        engine = 'groq-doc';
      } else { 
        groqErr = j.error?.message; 
      }
    } catch (e) { 
      groqErr = e.message; 
    }
  }

  // ==========================================
  // BLOQUE C: FALLBACK DE VISIÓN CON GROQ (Si el pool de Gemini falló por completo con la imagen)
  // ==========================================
  if (!reply && finalImageBase64 && finalFileType.startsWith('image/') && GROQ_KEY) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.2-11b-vision-preview',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: userMsg },
              { type: 'image_url', image_url: { url: `data:${finalFileType};base64,${finalImageBase64}` } }
            ]
          }],
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
  // BLOQUE D: GROQ CONTEXTO CHAT REGULAR (Texto Puro)
  // ==========================================
  if (!reply && !finalImageBase64 && !document_text && GROQ_KEY) {
    try {
      const groqMessages = [
        { role: 'system', content: systemPrompt || 'Eres MaxiBot de MQ NEXUS. Responde en español, directo y estratégico.' }
      ];

      if (Array.isArray(history)) {
        history.forEach(h => {
          const role = h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user';
          const text = h.text || h.content || (h.parts && h.parts[0]?.text) || '';
          if (text) groqMessages.push({ role, content: text });
        });
      }

      groqMessages.push({ role: 'user', content: userMsg });

      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: groqMessages,
          max_tokens: 800,
          temperature: 0.7
        })
      });
      const j = await r.json();
      if (r.ok && j.choices?.[0]?.message?.content) {
        reply = j.choices[0].message.content;
        engine = 'groq-pure-text';
      } else { 
        groqErr = j.error?.message; 
      }
    } catch (e) { 
      groqErr = e.message; 
    }
  }

  // ==========================================
  // BLOQUE E: FALLBACK FINAL DE TEXTO PURO CON POOL DE GEMINI
  // ==========================================
  if (!reply && GEMINI_POOL.length > 0 && !finalImageBase64) {
    const geminiTextPayload = [...formattedContents, { role: 'user', parts: [{ text: userMsg }] }];
    
    for (let k = 0; k < GEMINI_POOL.length; k++) {
      const activeKey = GEMINI_POOL[k];
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${activeKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: geminiTextPayload })
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

  // Manejo de Error en caso de quiebre absoluto de todos los LLMs configurados
  if (!reply) {
    console.error('🚨 QUIEBRE DE OPERACIÓN EN CORE INTEGRAL:', { groqErr, geminiErrors });
    return res.status(500).json({
      error: 'Todos los núcleos de IA están saturados en este momento.',
      reply: 'MAXIQUEEN OS: Todos los núcleos de IA están saturados en este momento.',
      detalle_groq: groqErr,
      detalle_gemini_pool: geminiErrors
    });
  }

  // Registro exitoso en Supabase y respuesta compatible con ambos formatos frontend (`text` y `reply`)
  await guardar(reply, 'assistant', tipoEntrada);
  return res.status(200).json({ 
    reply, 
    text: reply, 
    engine, 
    session_id, 
    tipo: tipoEntrada 
  });
}