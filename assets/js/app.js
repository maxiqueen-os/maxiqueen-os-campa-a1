const API_URL = "http://127.0.0.1:11434/api/generate";

async function sendMessage() {

  const input = document.getElementById("message");
  const chatBox = document.getElementById("chat-box");

  const userMessage = input.value.trim();

  if (!userMessage) return;

  // Mensaje usuario
  chatBox.innerHTML += `
    <div class="user-msg">
      Tú: ${userMessage}
    </div>
  `;

  input.value = "";

  // Loading
  chatBox.innerHTML += `
    <div class="ai-msg" id="loading">
      MAXIQUEEN está pensando...
    </div>
  `;

  chatBox.scrollTop = chatBox.scrollHeight;

  try {

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({

        model: "maxiqueen-lite:latest",

        prompt: `
Eres MAXIQUEEN OS.

El fundador es Cesar Bedoya.

Responde corto, rápido y profesional.

Usuario:
${userMessage}
        `,

        stream: false,

        options: {
          temperature: 0.4,
          num_predict: 60,
          num_thread: 4
        }

      })
    });

    const data = await response.json();

    // quitar loading
    const loading = document.getElementById("loading");

    if (loading) {
      loading.remove();
    }

    // respuesta IA
    chatBox.innerHTML += `
      <div class="ai-msg">
        MAXIQUEEN: ${data.response}
      </div>
    `;

    chatBox.scrollTop = chatBox.scrollHeight;

  } catch (error) {

    const loading = document.getElementById("loading");

    if (loading) {
      loading.remove();
    }

    chatBox.innerHTML += `
      <div class="error-msg">
        Error conectando con MAXIQUEEN
      </div>
    `;

    console.error(error);
  }
}

// ENTER
document.getElementById("message")
.addEventListener("keypress", function(e){

  if(e.key === "Enter"){
    sendMessage();
  }

});