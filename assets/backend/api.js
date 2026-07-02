const API_URL = "http://localhost:11434/api/generate";

async function askMaxiQueen(prompt) {

    try {

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "maxiqueen:latest",
                prompt: prompt,
                stream: false
            })
        });

        const data = await response.json();

        return data.response;

    } catch (error) {

        console.error(error);

        return "Error conectando con MaxiQueen.";

    }
}