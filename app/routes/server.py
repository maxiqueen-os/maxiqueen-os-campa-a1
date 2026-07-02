app.post("/chat", async (req, res)) => {
  try {
    const { message } = req.body;

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "maxiqueen", // o phi3
        prompt: message,
        stream: false
      })
    });
}
    const data = await response.json();

    res.json({
      reply: data.response
    });

  } catch (error) {
  console.error("🔥 ERROR REAL:", error.message);

  res.status(500).json({
    error: error.message
  });
}