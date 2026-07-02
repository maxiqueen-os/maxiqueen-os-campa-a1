from flask import Flask, request, jsonify
from ia_service import generar_respuesta

app = Flask(__name__)

@app.route("/api/ia", methods=["POST"])
def ia():
    data = request.json
    prompt = data.get("prompt", "")

    respuesta = generar_respuesta(prompt)

    return jsonify({
        "respuesta": respuesta
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)