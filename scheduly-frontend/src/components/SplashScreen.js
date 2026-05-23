import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

export default function SplashScreen({ onEnter }) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  const handleEnter = () => {
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      onEnter();
    }, 600);
  };


  if (!visible) return null;

  return (
    <div className={`splash ${leaving ? 'splash-out' : ''}`}>
      <div className="splash-bg-grid" />

      <div className="splash-center">
        <div className="splash-tag">IF25-40404 — KECERDASAN KOMPUTASIONAL</div>

        <div className="splash-logo-wrap">
          <span className="splash-badge">SA/CI</span>
          <h1 className="splash-title">SCHEDULY</h1>
        </div>

        <p className="splash-tagline">Generator Jadwal Shift Otomatis</p>
        <p className="splash-tagline-sub">berbasis Simulated Annealing</p>

        <div className="splash-divider" />

        <div className="splash-info-row">
          <div className="splash-info-item">
            <span className="splash-info-label">METODE</span>
            <span className="splash-info-value">Simulated Annealing</span>
          </div>
          <div className="splash-info-sep" />
          <div className="splash-info-item">
            <span className="splash-info-label">STACK</span>
            <span className="splash-info-value">React + FastAPI</span>
          </div>
          <div className="splash-info-sep" />
          <div className="splash-info-item">
            <span className="splash-info-label">DATABASE</span>
            <span className="splash-info-value">PostgreSQL</span>
          </div>
        </div>

        <button className="splash-enter" onClick={handleEnter}>
          <span className="splash-enter-arrow">➔</span> ENTER
        </button>

      </div>

      <div className="splash-footer">
        <span className="splash-footer-text">©2026 - Kelompok Scheduly</span>
      </div>
    </div>
  );
}
