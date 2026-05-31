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

const DEFAULT_API_BASE =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1`
    : 'http://localhost:8000/api/v1';
const API_BASE = process.env.REACT_APP_API_URL || DEFAULT_API_BASE;

export default function App() {
  const [employees, setEmployees] = useState(['', '', '', '', '']);
  const [shiftHours, setShiftHours] = useState(8);
  const [shiftHoursMode, setShiftHoursMode] = useState('preset');
  const [customShiftHours, setCustomShiftHours] = useState('');
  const [workingDays, setWorkingDays] = useState(5);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoEmployeeCount, setAutoEmployeeCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [meta, setMeta] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [feasibilityWarning, setFeasibilityWarning] = useState(null); // { warning, employeeCount, shiftCount }
  const [showChart, setShowChart] = useState(false);

  const makeRandomNames = useCallback((count) => {
    const prefixes = ['Agung', 'Bima', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gita', 'Hadi', 'Indah', 'Jaya', 'Kirana', 'Lestari'];
    const suffixes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const names = [];
    while (names.length < count) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const candidate = `${prefix} ${suffix} ${Math.floor(Math.random() * 90 + 10)}`;
      if (!names.includes(candidate)) names.push(candidate);
    }
    return names;
  }, []);

  const handleAutoGenerate = useCallback(async () => {
    const count = Math.max(1, Math.min(1000, Number(autoEmployeeCount) || 1));
    const resolvedShiftHours = shiftHoursMode === 'custom'
      ? Number(customShiftHours)
      : Number(shiftHours);

    if (!Number.isInteger(resolvedShiftHours) || resolvedShiftHours < 1 || resolvedShiftHours > 24 || 24 % resolvedShiftHours !== 0) {
      setError('Jam kerja custom harus bilangan bulat 1-24 dan membagi 24 secara habis.');
      return;
    }

    const generatedNames = makeRandomNames(count);

    setAutoMode(true);
    setLoading(true);
    setError(null);
    setInfo(null);
    setResult(null);
    setMeta(null);
    setFeasibilityWarning(null);

    try {
      const seedRes = await fetch(`${API_BASE}/seed`, { method: 'POST' });
      if (!seedRes.ok) {
        const err = await seedRes.json().catch(() => ({}));
        throw new Error(err.detail || `Seed error ${seedRes.status}`);
      }

      const today = new Date().toISOString().split('T')[0];
      setEmployees(generatedNames);
      setShiftHours(Number(resolvedShiftHours));
      setWorkingDays(Number(workingDays));
      setStartDate(today);

      const computedShiftCount = 24 / Number(resolvedShiftHours);

      const executeRes = await fetch(`${API_BASE}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_names: generatedNames,
          shift_hours: Number(resolvedShiftHours),
          shift_count_per_day: computedShiftCount,
          working_days_per_week: Number(workingDays),
          start_date: today,
        }),
      });

      if (!executeRes.ok) {
        const err = await executeRes.json().catch(() => ({}));
        throw new Error(err.detail || `Generate error ${executeRes.status}`);
      }

      const data = await executeRes.json();

      // Handle feasibility check dari backend
      if (data.feasibility_check && !data.table) {
        setFeasibilityWarning({
          warning: data.feasibility_check.warning,
          employeeCount: count,
          shiftCount: computedShiftCount,
          generatedNames,
        });
        setLoading(false);
        return;
      }

      setResult(data.table);
      setMeta(data.schedule);
      setInfo(`Data random berhasil dibuat untuk ${count} orang dan jadwal otomatis ditampilkan.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, autoEmployeeCount, customShiftHours, makeRandomNames, shiftHours, shiftHoursMode, workingDays]);

  const handleForceGenerate = useCallback(async () => {
    if (!feasibilityWarning) return;
    setFeasibilityWarning(null);
    setLoading(true);
    setError(null);
    setInfo(null);
    setResult(null);
    setMeta(null);

    try {
      const names = employees.map(e => e.trim()).filter(Boolean);
      const res = await fetch(`${API_BASE}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_names: names.length > 0 ? names : feasibilityWarning.generatedNames,
          shift_hours: parseInt(shiftHours),
          working_days_per_week: parseInt(workingDays),
          start_date: startDate,
          force_generate: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      setResult(data.table);
      setMeta(data.schedule);
      setInfo('Jadwal dibuat dengan force generate — hasil mungkin tidak optimal.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [feasibilityWarning, employees, shiftHours, workingDays, startDate, API_BASE]);

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
    setFeasibilityWarning(null);

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

      // Handle feasibility check dari backend
      if (data.feasibility_check && !data.table) {
        setFeasibilityWarning({
          warning: data.feasibility_check.warning,
          employeeCount: names.length,
          shiftCount: 24 / parseInt(shiftHours),
        });
        setLoading(false);
        return;
      }

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

      {/* Feasibility Warning Popup */}
      {feasibilityWarning && (
        <div className="modal-overlay" onClick={() => setFeasibilityWarning(null)}>
          <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-tag" style={{ borderColor: 'var(--red)', color: 'var(--red)', background: 'var(--red-bg)' }}>!</span>
              <h2 className="modal-title">JADWAL TIDAK FEASIBLE</h2>
              <button className="modal-close" onClick={() => setFeasibilityWarning(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <div className="modal-section-label" style={{ color: 'var(--red)' }}>PERINGATAN</div>
                <p className="modal-text">{feasibilityWarning.warning}</p>
              </div>
              <div className="modal-section">
                <p className="modal-text" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Untuk menghasilkan jadwal yang valid, jumlah karyawan harus minimal sama dengan
                  jumlah shift per hari ({feasibilityWarning.shiftCount} shift/hari).
                  Tambahkan lebih banyak karyawan atau kurangi jumlah shift.
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '0.5rem' }}>
                <button
                  className="btn-small"
                  style={{ padding: '8px 24px', fontSize: 13 }}
                  onClick={() => setFeasibilityWarning(null)}
                >
                  BATAL
                </button>
                <button
                  className="btn-small"
                  style={{
                    padding: '8px 24px',
                    fontSize: 13,
                    background: 'var(--yellow)',
                    color: '#0a0a0a',
                    border: 'none',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                  }}
                  onClick={handleForceGenerate}
                >
                  LANJUT GENERATE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                shiftHoursMode={shiftHoursMode}
                customShiftHours={customShiftHours}
                workingDays={workingDays}
                startDate={startDate}
                onShiftHours={setShiftHours}
                onShiftHoursMode={setShiftHoursMode}
                onCustomShiftHours={setCustomShiftHours}
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
                shiftHoursMode={shiftHoursMode}
                customShiftHours={customShiftHours}
                workingDays={workingDays}
                startDate={startDate}
                onShiftHours={setShiftHours}
                onShiftHoursMode={setShiftHoursMode}
                onCustomShiftHours={setCustomShiftHours}
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

              {/* Toggle kurva SA — hidden by default */}
              <div style={{ marginBottom: showChart ? '0' : '2rem' }}>
                <button
                  onClick={() => setShowChart(v => !v)}
                  style={{
                    background: showChart ? 'var(--yellow-bg)' : 'transparent',
                    border: '1px solid',
                    borderColor: showChart ? 'var(--yellow-border)' : 'var(--border)',
                    color: showChart ? 'var(--yellow)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    padding: '6px 16px',
                    cursor: 'pointer',
                    letterSpacing: '0.08em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 11 }}>{showChart ? '▲' : '▼'}</span>
                  {showChart ? 'SEMBUNYIKAN KURVA SA' : 'LIHAT KURVA SIMULATED ANNEALING'}
                </button>
              </div>

              {showChart && meta && <SAChart meta={meta} />}

              <ResultTable data={result} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}