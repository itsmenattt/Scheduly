import React from 'react';

export default function EmployeeInput({ employees, onChange }) {
  const update = (i, val) => {
    const next = [...employees];
    next[i] = val;
    onChange(next);
  };

  const addRow = () => {
    if (employees.length < 20) onChange([...employees, '']);
  };

  const removeRow = () => {
    if (employees.length > 1) onChange(employees.slice(0, -1));
  };

  return (
    <div>
      <div className="employee-list">
        {employees.map((name, i) => (
          <div key={i} className="employee-row">
            <span className="employee-num">{String(i + 1).padStart(2, '0')}</span>
            <input
              className="employee-input"
              type="text"
              value={name}
              onChange={e => update(i, e.target.value)}
              placeholder={`Nama karyawan ${i + 1}`}
              maxLength={40}
            />
          </div>
        ))}
      </div>

      <div className="employee-btn-row">
        <button className="btn-small" onClick={addRow} disabled={employees.length >= 20}>
          + TAMBAH
        </button>
        <button className="btn-small danger" onClick={removeRow} disabled={employees.length <= 1}>
          − HAPUS
        </button>
      </div>
    </div>
  );
}
