import React, { useState, useMemo } from 'react';

function getShiftClass(shift) {
  const s = shift.toLowerCase();
  if (s.includes('pagi') || s.includes('shift 1')) return 'pagi';
  if (s.includes('malam') || s.includes('shift 3') || s.includes('shift 2') && s.includes('12')) return 'malam';
  if (s.includes('siang') || s.includes('shift 2')) return 'siang';
  return 'other';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const days = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function formatDateFull(dateStr) {
  const d = new Date(dateStr);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function ResultTable({ data }) {
  const [filter, setFilter] = useState('ALL');

  const shiftTypes = useMemo(() => {
    const types = [...new Set(data.map(r => r.shift))];
    return types;
  }, [data]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return data;
    return data.filter(r => r.shift === filter);
  }, [data, filter]);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(row => {
      if (!g[row.date]) g[row.date] = [];
      g[row.date].push(row);
    });
    return g;
  }, [filtered]);

  const handleExport = () => {
    const headers = ['Tanggal', 'Shift', 'Jam', 'Karyawan', 'Jumlah'];
    const rows = data.map(r => [
      r.date,
      r.shift,
      r.hours,
      r.employees.join('; '),
      r.employee_count,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scheduly-jadwal-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="result-section">
      <div className="result-controls">
        <span className="result-title">JADWAL SHIFT</span>

        <div className="filter-group">
          <button
            className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            SEMUA
          </button>
          {shiftTypes.map(s => (
            <button
              key={s}
              className={`filter-btn ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <button className="btn-export" onClick={handleExport}>
          ↓ CSV
        </button>
      </div>

      <table className="schedule-table">
        <thead>
          <tr>
            <th>TANGGAL</th>
            <th>SHIFT</th>
            <th>JAM</th>
            <th>KARYAWAN BERTUGAS</th>
            <th style={{ textAlign: 'center' }}>JML</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([date, rows]) => (
            <React.Fragment key={date}>
              <tr className="day-sep">
                <td colSpan={5}>
                  <span className="day-sep-label">{formatDateFull(date)}</span>
                </td>
              </tr>
              {rows.map((row, idx) => (
                <tr key={`${date}-${idx}`}>
                  <td className="td-date">{formatDate(row.date)}</td>
                  <td>
                    <span className={`shift-pill ${getShiftClass(row.shift)}`}>
                      {row.shift}
                    </span>
                  </td>
                  <td className="td-hours">{row.hours}</td>
                  <td>
                    <div className="td-employees">
                      {row.employees.length > 0
                        ? row.employees.map((e, i) => (
                            <span key={i} className="emp-chip">{e}</span>
                          ))
                        : <span style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>KOSONG</span>
                      }
                    </div>
                  </td>
                  <td className="td-count">{row.employee_count}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
