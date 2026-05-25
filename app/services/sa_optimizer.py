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
        
        # Bobot Penalti - Balanced (constraints enforced in algorithm)
        self.HARD_PENALTY = 3000  # Violation penalty
        self.SOFT_PENALTY = 200   # Imbalance penalty

    def _generate_initial_state(self) -> Dict:
        """Buat jadwal valid awal dengan constraint enforcement."""
        state = {}
        all_emp_ids = [e.id for e in self.employees]
        
        # Track employee-day assignments to prevent double shifts
        emp_day_assignments = {emp_id: [] for emp_id in all_emp_ids}
        
        for dt in sorted(self.shift_configs.keys()):
            state[dt] = {}
            for shift_type, req in self.shift_configs[dt].items():
                # Find employees available for this shift (not already assigned this day)
                available = [e for e in all_emp_ids if dt not in emp_day_assignments[e]]
                
                # If not enough available, use least assigned employees
                if len(available) < req:
                    available = sorted(all_emp_ids, 
                                     key=lambda e: len(emp_day_assignments[e]))[:req]
                
                # Assign unique employees
                assigned = random.sample(available, min(req, len(available)))
                state[dt][shift_type] = assigned
                
                # Track assignments
                for emp_id in assigned:
                    if dt not in emp_day_assignments[emp_id]:
                        emp_day_assignments[emp_id].append(dt)
                        
        return state

    def _calculate_cost(self, state: Dict) -> float:
        """Fungsi Objektif: Hitung total pelanggaran (Cost/Energy). Makin kecil makin bagus."""
        cost = 0.0
        employee_shift_counts = {e.id: 0 for e in self.employees}
        
        for dt, shifts in state.items():
            daily_emp_shifts = {e.id: [] for e in self.employees}
            
            for shift_type, assigned_emps in shifts.items():
                req = self.shift_configs[dt][shift_type]
                
                # Check for duplicates in assigned_emps
                unique_emps = list(set(assigned_emps))
                duplicate_count = len(assigned_emps) - len(unique_emps)
                if duplicate_count > 0:
                    cost += duplicate_count * self.HARD_PENALTY
                
                # Hard 1: Shift kekurangan orang (count unique employees)
                if len(unique_emps) < req:
                    cost += (req - len(unique_emps)) * self.HARD_PENALTY
                
                for emp_id in unique_emps:
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
        """Constraint-aware neighborhood search."""
        new_state = copy.deepcopy(state)
        dates = sorted(list(new_state.keys()))
        
        # Random pick date and shift
        current_date = random.choice(dates)
        shift_types = list(new_state[current_date].keys())
        shift_type = random.choice(shift_types)
        
        req_count = self.shift_configs[current_date][shift_type]
        current_assigned = list(set(new_state[current_date][shift_type]))  # Ensure unique
        
        # Build available employees (not assigned to same day)
        all_emp_ids = [e.id for e in self.employees]
        today_assigned = set()
        for other_shift in shift_types:
            today_assigned.update(new_state[current_date][other_shift])
        
        available = [e for e in all_emp_ids if e not in today_assigned]
        
        action = random.choice(['targeted_swap', 'enforce_constraint', 'load_balance'])
        
        if action == 'targeted_swap' and len(dates) > 1:
            # Swap employee with another day to fix over-assignment
            other_date = random.choice([d for d in dates if d != current_date])
            other_shift = random.choice(list(new_state[other_date].keys()))
            other_assigned = list(set(new_state[other_date][other_shift]))
            
            if current_assigned and other_assigned:
                # Only swap if it reduces violations
                emp_curr_idx = random.randint(0, len(current_assigned) - 1)
                emp_other_idx = random.randint(0, len(other_assigned) - 1)
                
                emp_curr = current_assigned[emp_curr_idx]
                emp_other = other_assigned[emp_other_idx]
                
                # Check if swap maintains constraint (no double-shifts)
                current_day_after_swap = set(today_assigned) - {emp_curr} | {emp_other}
                if len(current_day_after_swap) <= req_count * len(shift_types):
                    current_assigned[emp_curr_idx] = emp_other
                    new_state[other_date][other_shift][emp_other_idx] = emp_curr
                    
        elif action == 'enforce_constraint':
            # Fix current shift to have exactly req_count unique available employees
            if len(current_assigned) != req_count:
                if len(current_assigned) < req_count and available:
                    # Add more
                    needed = req_count - len(current_assigned)
                    to_add = random.sample(available, min(needed, len(available)))
                    current_assigned.extend(to_add)
                elif len(current_assigned) > req_count:
                    # Remove excess
                    current_assigned = random.sample(current_assigned, req_count)
                    
        elif action == 'load_balance':
            # Replace least-used employee with most-used one
            if current_assigned and available:
                emp_to_remove_idx = random.randint(0, len(current_assigned) - 1)
                emp_to_add = random.choice(available)
                current_assigned[emp_to_remove_idx] = emp_to_add
        
        # Final cleanup: ensure unique + constraint
        new_state[current_date][shift_type] = list(set(current_assigned))[:req_count]
        
        # Fill if needed
        if len(new_state[current_date][shift_type]) < req_count:
            current_set = set(new_state[current_date][shift_type])
            candidates = [e for e in all_emp_ids if e not in current_set and e not in today_assigned]
            if candidates:
                needed = req_count - len(new_state[current_date][shift_type])
                new_state[current_date][shift_type].extend(random.sample(candidates, min(needed, len(candidates))))
                
        return new_state

    def optimize(self):
        """Main Loop Simulated Annealing with high-precision timing."""
        # Use nanosecond-precision timer for best possible resolution
        start_time_ns = time.perf_counter_ns()
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
                
        end_time_ns = time.perf_counter_ns()
        runtime_ns = end_time_ns - start_time_ns
        runtime_seconds = runtime_ns / 1e9
        # keep nanoseconds as int and seconds as float (full precision)
        return {
            "schedule": best_state,
            "cost": best_cost,
            "runtime_seconds": runtime_seconds,
            "runtime_nanoseconds": runtime_ns,
            "iterations": iterations,
        }