from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class Conversation(Base):

    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    role = Column(String)
    content = Column(Text)