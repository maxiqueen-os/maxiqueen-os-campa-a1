from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = model.encode(['Hola mundo', 'MaxiQueen OS'])
print(embeddings)