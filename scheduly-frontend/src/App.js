import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import EmployeeInput from './components/EmployeeInput';
import ConfigPanel from './components/ConfigPanel';
import AutoGeneratePanel from './components/AutoGeneratePanel';
import ResultTable from './components/ResultTable';
import StatusBar from './components/StatusBar';
import SplashScreen from './components/SplashScreen';
import AboutModal from './components/AboutModal';
import SAChart from './components/SAChart';

// Use REACT_APP_API_URL when provided; otherwise derive the backend host from the browser location.
const DEFAULT_API_BASE =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1`
    : 'http://localhost:8000/api/v1';
const API_BASE = process.env.REACT_APP_API_URL || DEFAULT_API_BASE;

export default function App() {
  const [employees, setEmployees] = useState(['', '', '', '', '']);
  const [shiftHours, setShiftHours] = useState(8);
  const [shiftCountPerDay, setShiftCountPerDay] = useState(3);
  const [workingDays, setWorkingDays] = useState(5);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoEmployeeCount, setAutoEmployeeCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [meta, setMeta] = useState(null);
  const [theme, setTheme] = useState('light');
  const [showSplash, setShowSplash] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const makeRandomNames = useCallback((count) => {
    const prefixes = ['Agung', 'Bima', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gita', 'Hadi', 'Indah', 'Jaya', 'Kirana', 'Lestari'];
    const suffixes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const names = [];

    while (names.length < count) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const candidate = `${prefix} ${suffix} ${Math.floor(Math.random() * 90 + 10)}`;
      if (!names.includes(candidate)) {
        names.push(candidate);
      }
    }

    return names;
  }, []);

  const handleAutoGenerate = useCallback(async () => {
    const count = Math.max(1, Math.min(1000, Number(autoEmployeeCount) || 1));
    const generatedNames = makeRandomNames(count);

    setAutoMode(true);
    setLoading(true);
    setError(null);
    setInfo(null);
    setResult(null);
    setMeta(null);

    try {
      const seedRes = await fetch(`${API_BASE}/seed`, { method: 'POST' });
      if (!seedRes.ok) {
        const err = await seedRes.json().catch(() => ({}));
        throw new Error(err.detail || `Seed error ${seedRes.status}`);
      }

      const today = new Date().toISOString().split('T')[0];
      setEmployees(generatedNames);
      setShiftHours(Number(shiftHours));
      setShiftCountPerDay(Number(shiftCountPerDay));
      setWorkingDays(Number(workingDays));
      setStartDate(today);

      const executeRes = await fetch(`${API_BASE}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_names: generatedNames,
          shift_hours: Number(shiftHours),
          shift_count_per_day: Number(shiftCountPerDay),
          working_days_per_week: Number(workingDays),
          start_date: today,
        }),
      });

      if (!executeRes.ok) {
        const err = await executeRes.json().catch(() => ({}));
        throw new Error(err.detail || `Generate error ${executeRes.status}`);
      }

      const data = await executeRes.json();
      setResult(data.table);
      setMeta(data.schedule);
      setInfo(`Data random berhasil dibuat untuk ${count} orang dan jadwal otomatis ditampilkan.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, autoEmployeeCount, makeRandomNames, shiftHours, shiftCountPerDay, workingDays]);

  const handleGenerate = useCallback(async () => {
    const names = employees.map(e => e.trim()).filter(Boolean);
    if (names.length < 1) { setError('Masukkan minimal 1 nama karyawan.'); return; }
    if (new Set(names).size !== names.length) { setError('Nama karyawan tidak boleh duplikat.'); return; }

    setLoading(true);
    setAutoMode(false);
    setError(null);
    setInfo(null);
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
      setInfo('Jadwal berhasil dibuat dari input manual.');
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
          {!autoMode && (
            <>
              <div className="section-label">01 — KARYAWAN</div>
              <EmployeeInput employees={employees} onChange={setEmployees} />

              <div className="section-label" style={{ marginTop: '2.5rem' }}>02 — KONFIGURASI</div>
              <ConfigPanel
                shiftHours={shiftHours}
                workingDays={workingDays}
                startDate={startDate}
                onShiftHours={setShiftHours}
                onShiftCountPerDay={setShiftCountPerDay}
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
            </>
          )}

          {autoMode && (
            <>
              <div className="section-label">GENERATE OTOMATIS</div>
              <AutoGeneratePanel
                employeeCount={autoEmployeeCount}
                onEmployeeCount={setAutoEmployeeCount}
                shiftHours={shiftHours}
                shiftCountPerDay={shiftCountPerDay}
                workingDays={workingDays}
                startDate={startDate}
                onShiftHours={setShiftHours}
                onShiftCountPerDay={setShiftCountPerDay}
                onWorkingDays={setWorkingDays}
                onStartDate={setStartDate}
                onGenerate={handleAutoGenerate}
                loading={loading}
              />
              <button
                className="btn-small"
                style={{ marginTop: '0.75rem' }}
                onClick={() => setAutoMode(false)}
                disabled={loading}
              >
                KEMBALI KE INPUT MANUAL
              </button>
            </>
          )}

          {!autoMode && (
            <button
              className="btn-small"
              style={{ marginTop: '0.75rem' }}
              onClick={() => setAutoMode(true)}
              disabled={loading}
            >
              PAKAI GENERATE OTOMATIS
            </button>
          )}

          {error && (
            <div className="error-block">
              <span className="error-icon">!</span>
              <span>{error}</span>
            </div>
          )}

          {info && !error && (
            <div className="error-block" style={{ borderColor: 'rgba(76,175,80,0.35)', color: '#2e7d32' }}>
              <span className="error-icon">✓</span>
              <span>{info}</span>
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
                <p className="empty-sub">Pilih mode manual atau generate otomatis dulu</p>
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
