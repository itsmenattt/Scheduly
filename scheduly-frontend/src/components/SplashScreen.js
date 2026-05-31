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

        <div className="splash-logo-wrap">
          <h1 className="splash-title">SCHEDULY</h1>
        </div>

        <p className="splash-tagline">Generator Jadwal Shift Otomatis</p>
        <p className="splash-tagline-sub">berbasis Simulated Annealing</p>

        <div className="splash-divider" />



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
