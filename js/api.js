// js/api.js (FRONTEND - CONTROL DE INTERFAZ Y RESPUESTAS LOCALES)

// --- FUNCIÓN CONECTORA: LLAMA AL SERVIDOR OCULTO DE VERCEL ---
async function chatWithMaxiQueen(message) {
  try {
    const response = await fetch('/api/chat', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        message: message,
        // Envía el prompt que está cargado en tu archivo systemPrompt.js
        systemPrompt: typeof SYSTEM_PROMPT !== 'undefined' ? SYSTEM_PROMPT : ""
      })
    });

    if (!response.ok) {
      throw new Error("Error en la respuesta del servidor central");
    }

    const data = await response.json();
    return data.text; 

  } catch (err) {
    console.error("[MQ_OS] Conexión fallida con el backend, activando respuestas locales...", err);
    return null; 
  }
}

// --- TU POOL DE RESPUESTAS LOCALES (FALLBACK DE SEGURIDAD) ---
const MQ_LOCAL_RESPONSES = [
  {
    keywords: ["hola", "buenas", "hey", "saludos"],
    response: "Hola. Estoy contigo. Dime si quieres ordenar ideas, revisar un proyecto o activar una ruta de venta."
  },
  {
    keywords: ["precio", "planes", "cuanto", "cuesta", "pago"],
    response: "Puedo orientarte por niveles: Starter para ordenar, Pro para convertir y Elite para una arquitectura completa. Para valor exacto es mejor continuar por WhatsApp."
  },
  {
    keywords: ["ia", "chat", "automatizacion", "automatización"],
    response: "El modulo IA ayuda a diagnosticar, ordenar informacion y convertir conversaciones en acciones concretas dentro del sistema."
  },
  {
    keywords: ["crm", "ventas", "cliente", "clientes"],
    response: "El CRM organiza oportunidades, contactos y rutas de seguimiento para que la conversacion no se pierda despues de la visita."
  },
  {
    keywords: ["notion", "centro", "panel", "operativo", "organizar"],
    response: "El Centro Operativo en Notion es tu panel integrado para centralizar flujos de trabajo, tareas y documentacion del sistema. Puedes verlo incrustado en la sección correspondiente."
  },
  {
    keywords: ["whatsapp", "contacto", "soporte", "humano", "hablar", "asesor"],
    response: "Para activaciones inmediatas o soporte personalizado, puedes usar el boton flotante de WhatsApp (WA) abajo a la izquierda o el enlace directo en la seccion de inicio."
  },
  {
    keywords: ["sic", "registro", "legal", "privacidad", "terminos", "manual"],
    response: "MaxiQueen OS cuenta con Registro Oficial ante la SIC, politicas de privacidad estrictas y el Manual de Integracion del Sistema listos para consulta en la seccion de Accesos."
  },
  {
    keywords: ["juegos", "play", "contenido", "galeria", "visuales", "h5"],
    response: "El modulo Play Core y la galeria contienen experiencias H5 interactiva y visuales del sistema para mostrar resultados reales de implementacion automatizada."
  },
  {
    keywords: ["google", "skillshop", "ads", "certificacion", "certificado"],
    response: "Puedes revisar y comprobar de forma directa mi perfil profesional y la certificacion oficial de Google Skillshop Ads en el bloque de Accesos Rapidos."
  },
  {
    keywords: ["creador", "autor", "desarrollador", "cesar", "julio", "bedoya"],
    response: "Este sistema digital integral ha sido disenado y desarrollado por Cesar Julio Bedoya Barragan como una arquitectura digital humana avanzada."
  }
];

function getLocalResponse(message) {
  const text = message.toLowerCase();
  const match = MQ_LOCAL_RESPONSES.find((item) =>
    item.keywords.some((keyword) => text.includes(keyword))
  );

  if (match) {
    return match.response;
  }

  return "Te leo. Para ayudarte mejor, cuentame si ahora necesitas claridad, ventas, automatizacion o soporte humano.";
}

async function sendMessage() {
  const input = document.getElementById("mqInput");
  const message = input.value.trim();

  if (!message) {
    return;
  }

  addMessage(message, "user");
  input.value = "";
  addMessage("Procesando...", "bot", true);

  try {
    const response =
      typeof chatWithMaxiQueen === "function"
        ? await chatWithMaxiQueen(message)
        : getLocalResponse(message);

    replacePendingMessage(response || getLocalResponse(message));
    speakText(response || getLocalResponse(message));
  } catch (err) {
    console.error("[MQ_OS] Chat fallback:", err);
    replacePendingMessage(getLocalResponse(message));
  }
}

function addMessage(text, type, pending = false) {
  const body = document.getElementById("mqChatBody");

  if (!body) {
    return;
  }

  const message = document.createElement("div");
  message.className = `mq-message ${type}`;

  if (pending) {
    message.dataset.pending = "true";
  }

  const bubble = document.createElement("div");
  bubble.className = "mq-bubble";
  bubble.innerText = text;

  message.appendChild(bubble);
  body.appendChild(message);
  body.scrollTop = body.scrollHeight;
}

function replacePendingMessage(text) {
  const body = document.getElementById("mqChatBody");
  const pending = body?.querySelector('[data-pending="true"] .mq-bubble');

  if (pending) {
    pending.innerText = text;
    pending.parentElement.removeAttribute("data-pending");
  } else {
    addMessage(text, "bot");
  }

  if (body) {
    body.scrollTop = body.scrollHeight;
  }
}

function toggleChat() {
  const chat = document.getElementById("mqChat");
  const toggle = chat?.querySelector(".chat-toggle");

  if (!chat) {
    return;
  }

  chat.classList.toggle("minimized");

  if (toggle) {
    toggle.innerText = chat.classList.contains("minimized") ? "Abrir" : "Cerrar";
  }

  if (!chat.classList.contains("minimized")) {
    document.getElementById("mqInput")?.focus();
  }
}

function speakText(text) {
  if (!text || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  
  // 🧹 LIMPIEZA CLAVE: Reemplaza los asteriscos y numerales por espacios vacíos
  // para que el lector no los pronuncie en voz alta.
  const cleanText = text.replace(/[*#]/g, ""); 

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = "es-CO";
  utterance.rate = 1;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const spanishVoice = voices.find((voice) => voice.lang.includes("es"));

  if (spanishVoice) {
    utterance.voice = spanishVoice;
  }

  window.speechSynthesis.speak(utterance);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("mqChatForm");

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
  });
});
