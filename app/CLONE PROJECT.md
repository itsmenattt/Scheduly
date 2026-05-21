# Scheduly - Installation Guide

Dokumen ini dibuat untuk siapa saja yang ingin clone project, menjalankan backend lokal, dan langsung integrasi ke API.

## 1. Clone Project

Clone repository ini ke mesin lokal:

```powershell
git clone <REPO_URL>
cd Scheduly\app
```

Ganti `<REPO_URL>` dengan URL repository yang dipakai tim.

## 2. Prasyarat

Pastikan sudah terpasang:

- Git
- Docker Desktop
- Docker Compose
- Browser modern untuk buka Swagger UI

## 3. Jalankan Backend

Dari folder `app`, jalankan:

```powershell
cd "d:\Nadia\SEMESTER 6\Scheduly\app"
docker compose up -d --build
```

Cek status container:

```powershell
docker compose ps
```

Kalau mau lihat log:

```powershell
docker compose logs -f api
```

## 4. Buka API Docs

Buka Swagger UI di browser:

```text
http://localhost:8000/docs
```

Di sana bisa mencoba endpoint secara manual sebelum wiring ke UI.

## 5. Endpoint Utama

Endpoint yang paling penting untuk integrasi frontend atau tim lain:

### One-button execute

```http
POST /api/v1/execute
```

Request body:

```json
{
  "employee_names": ["Andi", "Budi", "Citra", "Dewi", "Eko"],
  "shift_hours": 8,
  "working_days_per_week": 5
}
```

Response akan berisi:

- `input` = data yang dikirim user
- `schedule` = ringkasan hasil optimasi
- `table` = tabel pembagian shift untuk ditampilkan di UI

Contoh struktur `table`:

```json
{
  "date": "2026-05-21",
  "shift": "SHIFT 1",
  "hours": "00:00-08:00",
  "employees": ["Andi", "Budi"],
  "employee_count": 2
}
```

## 6. Flow yang Disarankan

Siapa pun yang lanjut mengerjakan frontend cukup membuat 1 form dengan input berikut:

- Daftar nama karyawan
- Jam kerja per shift
- Jumlah hari kerja dalam satu minggu

Setelah user klik tombol `Run` atau `Generate`, frontend tinggal:

1. Kirim request ke `POST /api/v1/execute`
2. Tunggu response
3. Render field `table` ke komponen tabel

## 7. Contoh Request via PowerShell

Kalau ingin tes cepat tanpa frontend:

```powershell
$body = @{
  employee_names = @('Andi','Budi','Citra','Dewi','Eko')
  shift_hours = 8
  working_days_per_week = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/execute' -Method Post -Body $body -ContentType 'application/json'
```

## 8. Endpoint Pendukung

Endpoint lain yang masih tersedia:

- `POST /api/v1/seed` untuk data dummy
- `POST /api/v1/generate` untuk generate schedule background
- `GET /api/v1/status/{schedule_id}` untuk cek status schedule

## 9. Struktur Folder Penting

```text
app/
  main.py
  api/
    v1/
      schedules.py
  services/
    sa_optimizer.py
    schedule_service.py
  repositories/
    schedule_repo.py
  models/
  db/
```

## 10. Catatan Integrasi

- Nama aplikasi di Swagger UI sudah `Scheduly`.
- Backend berjalan di `http://localhost:8000`.
- Kalau endpoint tidak bisa diakses, cek container API sudah `Up` lewat `docker compose ps`.
- File requirements di repo ini bernama `requirments.txt`, bukan `requirements.txt`.

## 11. Next Step

Setelah backend jalan, tim bisa langsung bikin:

- form input jadwal
- tombol `Run`
- tabel hasil jadwal
- loading state saat request dikirim
- empty state jika response belum ada