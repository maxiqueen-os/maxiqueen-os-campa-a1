// Pega esto en la consola del navegador (F12) o un archivo .js local
async function testKey(key) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hola" }] }] })
    });
    const data = await res.json();
    console.log(data.error ? "LLAVE BLOQUEADA" : "LLAVE FUNCIONAL");
}
// testKey("TU_LLAVE_AQUI");