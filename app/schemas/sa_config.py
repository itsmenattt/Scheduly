from pydantic import BaseModel

class SAConfig(BaseModel):
    initial_temperature: float = 1000.0
    cooling_rate: float = 0.95
    min_temperature: float = 0.1
    max_iterations: int = 5000