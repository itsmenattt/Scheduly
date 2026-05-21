from sqlalchemy import Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.db.database import Base

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    max_shifts_per_week = Column(Integer, default=5)

    availabilities = relationship("Availability", back_populates="employee")

class Availability(Base):
    __tablename__ = "availabilities"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    available_date = Column(Date)
    shift_type = Column(String) # 'PAGI', 'SIANG', 'MALAM'

    employee = relationship("Employee", back_populates="availabilities")