from sqlalchemy import Column, Integer, String, Date
from app.db.database import Base

class ShiftConfig(Base):
    __tablename__ = "shift_configs"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    shift_type = Column(String) # 'PAGI', 'SIANG', 'MALAM'
    min_required = Column(Integer)