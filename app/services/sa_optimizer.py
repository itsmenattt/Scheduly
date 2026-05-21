import random
import math
import copy
import time
from typing import List, Dict

class SimulatedAnnealingScheduler:
    def __init__(self, employees, availabilities, shift_configs, params):
        self.employees = employees
        self.availabilities = availabilities 
        self.shift_configs = shift_configs   
        
        self.initial_temp = params.get("initial_temperature", 1000.0)
        self.cooling_rate = params.get("cooling_rate", 0.95)
        self.min_temp = params.get("min_temperature", 0.1)
        self.max_iter = params.get("max_iterations", 5000)
        
        # Bobot Penalti
        self.HARD_PENALTY = 1000 # Sangat fatal (Jadwal bentrok)
        self.SOFT_PENALTY = 10   # Kurang optimal (Kerja trus terusan)

    def _generate_initial_state(self) -> Dict:
        """Buat jadwal ngasal dulu sebagai pijakan awal."""
        state = {}
        employee_ids = [e.id for e in self.employees]
        
        for dt, shifts in self.shift_configs.items():
            state[dt] = {}
            for shift_type, req in shifts.items():
                # Isi shift dengan pegawai secara random sesuai jumlah kebutuhan
                assigned = random.sample(employee_ids, min(req, len(employee_ids)))
                state[dt][shift_type] = assigned
        return state

    def _calculate_cost(self, state: Dict) -> float:
        """Fungsi Objektif: Hitung total pelanggaran (Cost/Energy). Makin kecil makin bagus."""
        cost = 0.0
        employee_shift_counts = {e.id: 0 for e in self.employees}
        
        for dt, shifts in state.items():
            daily_emp_shifts = {e.id: [] for e in self.employees}
            
            for shift_type, assigned_emps in shifts.items():
                req = self.shift_configs[dt][shift_type]
                
                # Hard 1: Shift kekurangan orang
                if len(assigned_emps) < req:
                    cost += (req - len(assigned_emps)) * self.HARD_PENALTY
                
                for emp_id in assigned_emps:
                    employee_shift_counts[emp_id] += 1
                    daily_emp_shifts[emp_id].append(shift_type)
                    
                    # Hard 2: Pegawai di-plot di hari/jam dia ga available
                    avail_shifts = self.availabilities.get(emp_id, {}).get(dt, [])
                    if shift_type not in avail_shifts:
                        cost += self.HARD_PENALTY
            
            for emp_id, s_types in daily_emp_shifts.items():
                # Hard 3: Pegawai dapet 2 shift di hari yang sama
                if len(s_types) > 1:
                    cost += (len(s_types) - 1) * self.HARD_PENALTY
                
                # Hard 4: Transisi ngawur (Malam besoknya Pagi, disederhanakan dalam hari sama dulu)
                if 'MALAM' in s_types and 'PAGI' in s_types:
                    cost += self.HARD_PENALTY

        # Soft 1: Lewat batas shift per minggu (overwork)
        for emp_id, count in employee_shift_counts.items():
            max_shift = next((e.max_shifts_per_week for e in self.employees if e.id == emp_id), 5)
            if count > max_shift:
                cost += (count - max_shift) * self.SOFT_PENALTY
            # Soft 2: Pegawai gak dapet shift sama sekali
            if count == 0:
                cost += self.SOFT_PENALTY 

        return cost

    def _get_neighbor(self, state: Dict) -> Dict:
        """Mutasi jadwal saat ini dengan swap orang atau masukin orang baru (Neighborhood Search)."""
        new_state = copy.deepcopy(state)
        dates = list(new_state.keys())
        date1 = random.choice(dates)
        
        action = random.choice(['swap', 'reassign'])
        employee_ids = [e.id for e in self.employees]
        
        shift_types = list(new_state[date1].keys())
        if not shift_types: return new_state
        
        shift1 = random.choice(shift_types)
        
        if action == 'swap':
            date2 = random.choice(dates)
            shift2 = random.choice(list(new_state[date2].keys()))
            
            if new_state[date1][shift1] and new_state[date2][shift2]:
                emp1 = random.choice(new_state[date1][shift1])
                emp2 = random.choice(new_state[date2][shift2])
                
                # Tukar pegawai
                new_state[date1][shift1].remove(emp1)
                new_state[date1][shift1].append(emp2)
                new_state[date2][shift2].remove(emp2)
                new_state[date2][shift2].append(emp1)
                
        elif action == 'reassign':
            if new_state[date1][shift1]:
                emp_to_remove = random.choice(new_state[date1][shift1])
                emp_to_add = random.choice(employee_ids)
                if emp_to_add not in new_state[date1][shift1]:
                    new_state[date1][shift1].remove(emp_to_remove)
                    new_state[date1][shift1].append(emp_to_add)
                    
        return new_state

    def optimize(self):
        """Main Loop Simulated Annealing."""
        start_time = time.time()
        current_state = self._generate_initial_state()
        current_cost = self._calculate_cost(current_state)
        
        best_state = copy.deepcopy(current_state)
        best_cost = current_cost
        
        T = self.initial_temp
        iterations = 0
        
        while T > self.min_temp and iterations < self.max_iter:
            neighbor = self._get_neighbor(current_state)
            neighbor_cost = self._calculate_cost(neighbor)
            
            delta_e = neighbor_cost - current_cost
            
            # Acceptance Logic
            # Kalau jadwal baru lebih bagus (delta_e < 0) -> Terima.
            # Kalau lebih jelek, jangan langsung ditolak, terima berdasarkan probabilitas suhu.
            if delta_e < 0 or random.random() < math.exp(-delta_e / T):
                current_state = neighbor
                current_cost = neighbor_cost
                
                if current_cost < best_cost:
                    best_state = copy.deepcopy(current_state)
                    best_cost = current_cost
            
            T *= self.cooling_rate # Pendinginan
            iterations += 1
            
            if best_cost == 0:  # Kalau udah nemu jadwal sempurna, stop.
                break
                
        return {
            "schedule": best_state,
            "cost": best_cost,
            "runtime": time.time() - start_time,
            "iterations": iterations
        }