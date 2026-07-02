from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL de conexión (si usas SQLite, esta línea está perfecta)
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# Motor de base de datos
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Fábrica de sesiones
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ESTO ES LO QUE TE FALTA Y POR ESO DA EL ERROR
Base = declarative_base()

# Dependencia para obtener la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()