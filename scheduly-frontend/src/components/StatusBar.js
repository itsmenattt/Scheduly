import React from 'react';

export default function StatusBar({ meta, employeeCount, shiftHours }) {
  const costClass = meta.total_cost === 0 ? 'good' : meta.total_cost < 500 ? 'warn' : 'bad';
  const costLabel = meta.total_cost === 0 ? 'OPTIMAL' : meta.total_cost < 500 ? 'SUBOPTIMAL' : 'KONFLIK';
  const shiftsPerDay = 24 / shiftHours;

  const formatRuntime = (meta) => {
    const ns = meta.runtime_nanoseconds;
    const ms = meta.runtime_milliseconds;
    const s = meta.runtime_seconds;

    if (typeof ns === 'number') {
      if (ns < 1_000) return `${ns} ns`;
      if (ns < 1_000_000) return `${(ns / 1_000).toFixed(3)} μs`;
      if (ns < 1_000_000_000) return `${(ns / 1_000_000).toFixed(3)} ms`;
      return `${(ns / 1_000_000_000).toFixed(6)} s`;
    }
    if (typeof ms === 'number' && ms > 0) return `${ms} ms`;
    if (typeof s === 'number') return `${s.toFixed(6)} s`;
    return '—';
  };

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
        <div className="stat-value">{formatRuntime(meta)}</div>
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
