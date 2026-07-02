from fastapi import FastAPI, UploadFile, File


def extract_docx_text(path):
    doc = Document(path)
    return "\n".join([p.text for p in doc.paragraphs])


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(path, "wb") as f:
        f.write(await file.read())

    text = ""

    if file.filename.endswith(".pdf"):
        text = extract_pdf_text(path)

    elif file.filename.endswith(".docx"):
        text = extract_docx_text(path)

    else:
        return {"error": "Formato no soportado"}

    chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]

    for idx, chunk in enumerate(chunks):
        collection.add(
            documents=[chunk],
            ids=[f"{file.filename}-{idx}"]
        )

    return {
        "message": "Documento procesado correctamente",
        "chunks": len(chunks)
    }


@app.post("/chat")
async def chat(data: dict):
    question = data.get("message")

    results = collection.query(
        query_texts=[question],
        n_results=5
    )

    context = "\n".join(results["documents"][0])

    prompt = f"""
    Usa el siguiente contexto para responder:

    {context}

    Pregunta:
    {question}
    """

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "qwen2.5:7b",
            "prompt": prompt,
            "stream": False
        }
    )

    result = response.json()

    return {
        "response": result["response"]
    }