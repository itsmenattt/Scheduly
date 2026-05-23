import React from 'react';

const SHIFT_OPTIONS = [
  { value: 4, label: '4 jam / shift → 6 shift/hari' },
  { value: 6, label: '6 jam / shift → 4 shift/hari' },
  { value: 8, label: '8 jam / shift → 3 shift/hari' },
  { value: 12, label: '12 jam / shift → 2 shift/hari' },
  { value: 24, label: '24 jam / shift → 1 shift/hari' },
];

export default function ConfigPanel({ shiftHours, workingDays, startDate, onShiftHours, onWorkingDays, onStartDate }) {
  const shiftsPerDay = 24 / shiftHours;

  return (
    <div className="config-grid">
      <div className="config-row">
        <label className="config-label">JAM KERJA PER SHIFT</label>
        <div className="config-control">
          <select
            className="config-select"
            value={shiftHours}
            onChange={e => onShiftHours(Number(e.target.value))}
          >
            {SHIFT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <span className="config-derived" style={{ marginTop: 6, display: 'inline-block' }}>
          {shiftsPerDay}× shift / hari
        </span>
      </div>

      <div className="config-row">
        <label className="config-label">HARI KERJA / MINGGU</label>
        <div className="config-control">
          <select
            className="config-select"
            value={workingDays}
            onChange={e => onWorkingDays(Number(e.target.value))}
          >
            {[1,2,3,4,5,6,7].map(d => (
              <option key={d} value={d}>{d} hari</option>
            ))}
          </select>
        </div>
      </div>

      <div className="config-row">
        <label className="config-label">TANGGAL MULAI</label>
        <div className="config-control">
          <input
            className="config-input-date"
            type="date"
            value={startDate}
            onChange={e => onStartDate(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
