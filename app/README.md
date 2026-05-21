# Scheduly

Backend FastAPI untuk auto shift scheduling dengan Simulated Annealing.

## What This Project Does

Scheduly menerima input sederhana dari user, lalu menghasilkan pembagian shift otomatis.

Core flow:
- User memasukkan daftar nama karyawan
- User memasukkan jam kerja per shift
- User memasukkan jumlah hari kerja per minggu
- Backend menjalankan Simulated Annealing
- Hasil keluar sebagai tabel pembagian shift

## Tech Stack

- FastAPI
- SQLAlchemy async
- PostgreSQL
- Docker Compose
- Simulated Annealing optimizer

## Run With Docker

Jalankan dari folder `app`:

```powershell
cd "d:\Nadia\SEMESTER 6\Scheduly\app"
docker compose up -d --build
```

Check service status:

```powershell
docker compose ps
```

Open Swagger UI:

```text
http://localhost:8000/docs
```

## API Overview

### Quick one-button scheduling

`POST /api/v1/execute`

Example request body:

```json
{
  "employee_names": ["Andi", "Budi", "Citra", "Dewi", "Eko"],
  "shift_hours": 8,
  "working_days_per_week": 5
}
```

Example response shape:

```json
{
  "input": {
    "employee_names": ["Andi", "Budi"],
    "shift_hours": 8,
    "working_days_per_week": 5,
    "shift_count_per_day": 3
  },
  "schedule": {
    "status": "COMPLETED",
    "total_cost": 0,
    "runtime_seconds": 0.01,
    "iterations_run": 147
  },
  "table": [
    {
      "date": "2026-05-21",
      "shift": "SHIFT 1",
      "hours": "00:00-08:00",
      "employees": ["Andi"],
      "employee_count": 1
    }
  ]
}
```

### Other endpoints

- `POST /api/v1/seed` - seed dummy data for testing
- `POST /api/v1/generate` - create a schedule header and start optimization in the background
- `GET /api/v1/status/{schedule_id}` - check status and metrics for a generated schedule

## Swagger Testing Flow

1. Open `http://localhost:8000/docs`
2. Expand `POST /api/v1/execute`
3. Click `Try it out`
4. Fill the JSON body
5. Click `Execute`
6. Read the returned table in the response

## Notes

- The current Docker setup uses `requirments.txt` because that is the file name in this repo.
- If the API does not start, check Docker Desktop and the container logs:

```powershell
docker compose logs -f api
```

## Project Structure

```text
app/
  main.py
  docker-compose.yml
  Dockerfile
  requirments.txt
  api/
  core/
  db/
  models/
  repositories/
  schemas/
  services/
  utils/
```
