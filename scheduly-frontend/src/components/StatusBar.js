import React from 'react';

export default function StatusBar({ meta, employeeCount, shiftHours }) {
  const costClass = meta.total_cost === 0 ? 'good' : meta.total_cost < 500 ? 'warn' : 'bad';
  const costLabel = meta.total_cost === 0 ? 'OPTIMAL' : meta.total_cost < 500 ? 'SUBOPTIMAL' : 'KONFLIK';
  const shiftsPerDay = 24 / shiftHours;

  return (
    <div className="status-bar">
      <div className="stat-item">
        <div className="stat-label">STATUS</div>
        <div className={`stat-value ${costClass}`}>{costLabel}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">TOTAL COST</div>
        <div className={`stat-value ${costClass}`}>{meta.total_cost}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">ITERASI</div>
        <div className="stat-value">{meta.iterations_run?.toLocaleString() ?? '—'}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">RUNTIME</div>
        <div className="stat-value">{meta.runtime_seconds ? `${meta.runtime_seconds.toFixed(2)}s` : '—'}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">KARYAWAN</div>
        <div className="stat-value">{employeeCount}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">SHIFT/HARI</div>
        <div className="stat-value">{shiftsPerDay}</div>
      </div>
    </div>
  );
}
