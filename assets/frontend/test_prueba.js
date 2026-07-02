const keys = [
    "TU_LLAVE_MAIN",
    "TU_LLAVE_BACKUP_1",
    "TU_LLAVE_BACKUP_2"
];

async function checkAll() {
    for (let i = 0; i < keys.length; i++) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keys[i]}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
        });
        const data = await res.json();
        console.log(`Llave ${i}: ${data.error ? "BLOQUEADA" : "ACTIVA"}`);
    }
}
checkAll();