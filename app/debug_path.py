import sys
import os
print("Python está buscando en:")
for path in sys.path:
    print(path)
print("\n¿Existe app? :", os.path.exists("app"))