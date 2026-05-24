import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import EmployeeInput from './components/EmployeeInput';
import ConfigPanel from './components/ConfigPanel';
import ResultTable from './components/ResultTable';
import StatusBar from './components/StatusBar';
import SplashScreen from './components/SplashScreen';
import AboutModal from './components/AboutModal';
import SAChart from './components/SAChart';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export default function App() {
  const [employees, setEmployees] = useState(['', '', '', '', '']);
  const [shiftHours, setShiftHours] = useState(8);
  const [workingDays, setWorkingDays] = useState(5);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [theme, setTheme] = useState('light');
  const [showSplash, setShowSplash] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const handleGenerate = useCallback(async () => {
    const names = employees.map(e => e.trim()).filter(Boolean);
    if (names.length < 1) { setError('Masukkan minimal 1 nama karyawan.'); return; }
    if (new Set(names).size !== names.length) { setError('Nama karyawan tidak boleh duplikat.'); return; }

    setLoading(true);
    setError(null);
    setResult(null);
    setMeta(null);

    try {
      const res = await fetch(`${API_BASE}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_names: names,
          shift_hours: parseInt(shiftHours),
          working_days_per_week: parseInt(workingDays),
          start_date: startDate,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      setResult(data.table);
      setMeta(data.schedule);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [employees, shiftHours, workingDays, startDate]);

  return (
    <div className="app">
      {showSplash && <SplashScreen onEnter={() => setShowSplash(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      <header className="app-header">
        <div className="header-left">
          <span className="logo-tag">SA/CI</span>
          <h1 className="logo-title">SCHEDULY</h1>
        </div>
        <div className="header-right" style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div className="header-right-text">
            <span className="header-sub">Generator Jadwal Shift Otomatis</span>
            <span className="header-method">Simulated Annealing</span>
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            <span className="theme-toggle-icon">{theme === 'dark' ? '☀' : '☾'}</span>
            {theme === 'dark' ? 'LIGHT' : 'DARK'}
          </button>
          <button className="btn-about" onClick={() => setShowAbout(true)}>?</button>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <div className="section-label">01 — KARYAWAN</div>
          <EmployeeInput employees={employees} onChange={setEmployees} />

          <div className="section-label" style={{ marginTop: '2.5rem' }}>02 — KONFIGURASI</div>
          <ConfigPanel
            shiftHours={shiftHours}
            workingDays={workingDays}
            startDate={startDate}
            onShiftHours={setShiftHours}
            onWorkingDays={setWorkingDays}
            onStartDate={setStartDate}
          />

          <button
            className={`btn-generate ${loading ? 'loading' : ''}`}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-inner">
                <span className="spinner" />
                MENGOPTIMASI...
              </span>
            ) : (
              <span className="btn-inner">
                <span className="btn-arrow">➔</span>
                GENERATE JADWAL
              </span>
            )}
          </button>

          {error && (
            <div className="error-block">
              <span className="error-icon">!</span>
              <span>{error}</span>
            </div>
          )}
        </aside>

        <main className="content">
          {!result && !loading && (
            <div className="empty-state">
              <div className="empty-grid">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="empty-cell" />
                ))}
              </div>
              <div className="empty-text">
                <p className="empty-title">BELUM ADA JADWAL</p>
                <p className="empty-sub">Isi konfigurasi lalu klik Generate Jadwal</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="sa-animation">
                <div className="sa-bar-wrap">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="sa-bar" style={{ animationDelay: `${i * 0.08}s` }} />
                  ))}
                </div>
                <p className="loading-label">Algoritma sedang mencari jadwal optimal...</p>
                <p className="loading-sub">Simulated Annealing — menukar-nukar slot & mendinginkan suhu</p>
              </div>
            </div>
          )}

          {result && (
            <>
              {meta && <StatusBar meta={meta} employeeCount={employees.filter(Boolean).length} shiftHours={shiftHours} />}
              {meta && <SAChart meta={meta} />}
              <ResultTable data={result} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
