import React from 'react';

const SHIFT_OPTIONS = [
  { value: 4, label: '4 jam / shift → 6 shift/hari' },
  { value: 6, label: '6 jam / shift → 4 shift/hari' },
  { value: 8, label: '8 jam / shift → 3 shift/hari' },
  { value: 12, label: '12 jam / shift → 2 shift/hari' },
  { value: 24, label: '24 jam / shift → 1 shift/hari' },
];

const CUSTOM_VALUE = 'custom';

export default function ConfigPanel({ shiftHours, workingDays, startDate, onShiftHours, onWorkingDays, onStartDate }) {
  const isPresetShift = SHIFT_OPTIONS.some(o => o.value === shiftHours);
  const selectedShiftValue = isPresetShift ? shiftHours : CUSTOM_VALUE;
  const shiftsPerDay = shiftHours ? 24 / shiftHours : 0;

  const handleShiftHoursChange = (value) => {
    if (value === CUSTOM_VALUE) {
      const current = Number.isFinite(shiftHours) ? shiftHours : 8;
      const input = window.prompt('Masukkan jam kerja per shift (harus membagi 24):', String(current));
      if (input === null) return;

      const customHours = Number(input);
      if (!Number.isInteger(customHours) || customHours < 1 || customHours > 24 || 24 % customHours !== 0) {
        window.alert('Jam kerja harus bilangan bulat 1-24 dan membagi 24 secara habis.');
        return;
      }

      onShiftHours(customHours);
      return;
    }

    onShiftHours(Number(value));
  };

  return (
    <div className="config-grid">
      <div className="config-row">
        <label className="config-label">JAM KERJA PER SHIFT</label>
        <div className="config-control">
          <select
            className="config-select"
            value={selectedShiftValue}
            onChange={e => handleShiftHoursChange(e.target.value)}
          >
            {SHIFT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
            <option value={CUSTOM_VALUE}>Custom...</option>
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
