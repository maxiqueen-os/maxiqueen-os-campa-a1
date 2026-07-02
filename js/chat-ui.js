// =========================================================================
// ARCHIVO: chat-ui.js (INTERFAZ CONECTADA, AUDIO LIMPIO Y MULTIMODAL v2)
// =========================================================================

// --- 1. BASE DE DATOS LOCAL DE RESPUESTAS ---
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

// --- 2. MÓDULO DE AUDIO PREMIUM (MAXIQUEEN AUDIO CORE) ---
const MQAudio = {
  synth: window.speechSynthesis,
  utterance: null,
  currentVolume: 1.0, 
  lastText: "",

  speak(text) {
    if (!text || !this.synth) return;
    this.synth.cancel(); // Detener cualquier audio previo
    this.lastText = text;

    // LIMPIEZA PREMIUM: Evita que la voz pronuncie los caracteres de formato Markdown (*, #)
    const cleanText = text.replace(/[*#]/g, ""); 

    this.utterance = new SpeechSynthesisUtterance(cleanText);
    this.utterance.lang = "es-CO";
    this.utterance.volume = this.currentVolume;
    this.utterance.rate = 1.0;

    const voices = this.synth.getVoices();
    const spanishVoice = voices.find((voice) => voice.lang.includes("es"));
    if (spanishVoice) this.utterance.voice = spanishVoice;

    this.synth.speak(this.utterance);
  },

  pause() {
    if (this.synth.speaking && !this.synth.paused) this.synth.pause();
  },

  resume() {
    if (this.synth.paused) this.synth.resume();
  },

  stop() {
    this.synth.cancel();
  },

  volumeUp() {
    this.currentVolume = Math.min(1.0, this.currentVolume + 0.1);
    if (this.utterance) this.utterance.volume = this.currentVolume;
    console.log(`[MQ_AUDIO] Volumen: ${Math.round(this.currentVolume * 100)}%`);
  },

  volumeDown() {
    this.currentVolume = Math.max(0.0, this.currentVolume - 0.1);
    if (this.utterance) this.utterance.volume = this.currentVolume;
    console.log(`[MQ_AUDIO] Volumen: ${Math.round(this.currentVolume * 100)}%`);
  }
};

// --- 3. ALMACENAMIENTO TEMPORAL DE ARCHIVOS ADJUNTOS ---
let mqAttachedFiles = [];

function handleMqFileInput(event) {
  const files = event.target.files;
  if (!files.length) return;

  Array.from(files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const base64Data = e.target.result.split(",")[1];

      mqAttachedFiles.push({
        name: file.name,
        mimeType: file.type,
        base64Data: base64Data
      });

      const badge = document.getElementById("mqFileBadge");
      if (badge) {
        badge.innerText = `📎 ${file.name} listo`;
        badge.style.display = "inline-block";
      }
    };
    reader.readAsDataURL(file);
  });
}

function clearAttachedFiles() {
  mqAttachedFiles = [];
  const badge = document.getElementById("mqFileBadge");
  if (badge) {
    badge.innerText = "";
    badge.style.display = "none";
  }
  const fileInput = document.getElementById("mqFileInput");
  if (fileInput) fileInput.value = "";
}

// --- 4. FUNCIÓN CONECTORA CON LA BÓVEDA CENTRAL (CON SOPORTE DE ARCHIVOS) ---
async function chatWithMaxiQueen(message, filesToSend = []) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        systemPrompt: "Eres MaxiQueen OS, un ecosistema de automatización premium. Responde con seguridad, claridad y enfoque corporativo de alto rendimiento.",
        files: filesToSend 
      }),
    });

    if (!response.ok) throw new Error("Error en la pasarela del servidor central");

    const data = await response.json();
    return data.text; 
  } catch (error) {
    console.error("[MQ_BRIDGE_ERROR]:", error);
    return null; 
  }
}

function getLocalResponse(message) {
  const text = message.toLowerCase();
  const match = MQ_LOCAL_RESPONSES.find((item) =>
    item.keywords.some((keyword) => text.includes(keyword))
  );

  if (match) return match.response;
  return "Te leo. Para ayudarte mejor, cuentame si ahora necesitas claridad, ventas, automatizacion o soporte humano.";
}

// --- 5. GESTIÓN DE ENVÍO DE MENSAJES ---
async function sendMessage() {
  const input = document.getElementById("mqInput");
  const message = input.value.trim();

  if (!message && mqAttachedFiles.length === 0) return;

  let userDisplayMessage = message;
  if (mqAttachedFiles.length > 0) {
    const fileNames = mqAttachedFiles.map(f => f.name).join(", ");
    userDisplayMessage += `\n\n[📎 Archivo: ${fileNames}]`;
  }

  addMessage(userDisplayMessage, "user");
  input.value = "";
  addMessage("Procesando...", "bot", true);

  const filesToSend = [...mqAttachedFiles];
  clearAttachedFiles();

  try {
    const response = await chatWithMaxiQueen(message, filesToSend);
    const finalResponse = response || getLocalResponse(message);
    
    replacePendingMessage(finalResponse);
    MQAudio.speak(finalResponse);
  } catch (err) {
    console.error("[MQ_OS] Chat fallback:", err);
    replacePendingMessage(getLocalResponse(message));
  }
}

// --- 6. CONTROLADORES VISUALES DE RENDERIZADO ---
function addMessage(text, type, pending = false) {
  const body = document.getElementById("mqChatBody");
  if (!body) return;

  const message = document.createElement("div");
  message.className = `mq-message ${type}`;
  if (pending) message.dataset.pending = "true";

  const bubble = document.createElement("div");
  bubble.className = "mq-bubble";
  bubble.innerText = text;

  message.appendChild(bubble);
  body.appendChild(message);
  body.scrollTop = body.scrollHeight;
}

// Reemplaza el texto "Procesando..." con la respuesta final obtenida de Gemini
function replacePendingMessage(text) {
  const body = document.getElementById("mqChatBody");
  const pending = body?.querySelector('[data-pending="true"] .mq-bubble');

  if (pending) {
    pending.innerText = text;
    pending.parentElement.removeAttribute("data-pending");
  } else {
    addMessage(text, "bot");
  }

  if (body) body.scrollTop = body.scrollHeight;
}

function toggleChat() {
  const chat = document.getElementById("mqChat");
  const toggle = chat?.querySelector(".chat-toggle");
  if (!chat) return;

  chat.classList.toggle("minimized");

  if (toggle) {
    toggle.innerText = chat.classList.contains("minimized") ? "Abrir" : "Cerrar";
  }

  if (!chat.classList.contains("minimized")) {
    document.getElementById("mqInput")?.focus();
  }
}

function speakText(text) {
  MQAudio.speak(text);
}

// --- 7. EXPOSICIÓN GLOBAL DEL MÓDULO DE AUDIO ---
// Esto permite que los atributos onclick="MQAudio.pause()" de tu HTML funcionen directamente
window.MQAudio = MQAudio;

// --- 8. CONFIGURACIÓN ÚNICA DE ESCUCHAS AUTOMÁTICAS ---
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("mqChatForm");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
  });

  const fileInput = document.getElementById("mqFileInput");
  fileInput?.addEventListener("change", handleMqFileInput);
});
