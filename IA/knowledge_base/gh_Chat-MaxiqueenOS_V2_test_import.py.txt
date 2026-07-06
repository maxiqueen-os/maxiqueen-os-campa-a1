# test_import.py
try:
    from app.models import user
    print("✅ Módulo 'app.models.user' importado correctamente.")
    from app.database import get_db
    print("✅ Módulo 'app.database' importado correctamente.")
except Exception as e:
    print("❌ ERROR REAL:")
    import traceback
    traceback.print_exc()