import json
import os

MEMORY_FILE = "chat_memory.json"

def load_memory():
    if not os.path.exists(MEMORY_FILE):
        return []
    with open(MEMORY_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except:
            return []

def save_message(role, content, user_id):
    memory = load_memory()
    memory.append({"role": role, "content": content, "user_id": user_id})
    with open(MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(memory, f, indent=4)

def get_memory(user_id):
    memory = load_memory()
    return [m for m in memory if m["user_id"] == user_id]