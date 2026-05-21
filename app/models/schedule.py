from sqlalchemy import Column, Integer, String, ForeignKey, Float, Date, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String) # 'GENERATING', 'COMPLETED', 'FAILED'
    total_cost = Column(Float, nullable=True)
    runtime_seconds = Column(Float, nullable=True)
    iterations_run = Column(Integer, nullable=True)
    
    assignments = relationship("ShiftAssignment", back_populates="schedule", cascade="all, delete-orphan")

class ShiftAssignment(Base):
    __tablename__ = "shift_assignments"
    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    date = Column(Date)
    shift_type = Column(String)

    schedule = relationship("Schedule", back_populates="assignments")