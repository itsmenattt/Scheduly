# Scheduly — Frontend

React frontend untuk Generator Jadwal Shift berbasis Simulated Annealing.

## Setup

```bash
npm install
npm start
```

Aplikasi berjalan di `http://localhost:3000`

## Environment Variable

Buat file `.env` di root folder:

```
REACT_APP_API_URL=http://localhost:8000/api/v1
```

Backend harus sudah berjalan. Lihat `app/CLONE PROJECT.md` untuk panduan jalankan backend.

## Struktur

```
src/
  App.js           — Layout utama & state management
  App.css          — Global styles (industrial dark theme)
  components/
    EmployeeInput.js  — Input daftar nama karyawan
    ConfigPanel.js    — Pilih jam shift, hari kerja, tanggal mulai
    StatusBar.js      — Statistik hasil SA (cost, iterasi, runtime)
    ResultTable.js    — Tabel jadwal dengan filter & export CSV
```

## Fitur

- Input nama karyawan dinamis (tambah/hapus)
- Pilih konfigurasi shift (4/6/8/12/24 jam)
- Generate jadwal via `POST /api/v1/execute`
- Tampil status SA: optimal/suboptimal/konflik
- Filter jadwal per shift
- Export ke CSV
