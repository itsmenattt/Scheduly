import React from 'react';
import './AboutModal.css';

export default function AboutModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-tag">SA/CI</span>
          <h2 className="modal-title">BAGAIMANA SCHEDULY BEKERJA</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <div className="modal-section-label">APA ITU SIMULATED ANNEALING?</div>
            <p className="modal-text">
              Simulated Annealing (SA) adalah metode optimasi yang terinspirasi dari proses
              pendinginan logam. Logam panas yang didinginkan perlahan akan membentuk struktur
              kristal yang lebih stabil — SA meniru proses ini untuk menemukan solusi optimal
              dari masalah penjadwalan yang kompleks.
            </p>
          </div>

          <div className="modal-section">
            <div className="modal-section-label">ALUR ALGORITMA</div>
            <div className="modal-steps">
              <div className="modal-step">
                <span className="modal-step-num">01</span>
                <div className="modal-step-content">
                  <span className="modal-step-title">Inisialisasi</span>
                  <span className="modal-step-desc">Buat jadwal awal secara acak, set suhu T = 3000</span>
                </div>
              </div>
              <div className="modal-step-arrow">↓</div>
              <div className="modal-step">
                <span className="modal-step-num">02</span>
                <div className="modal-step-content">
                  <span className="modal-step-title">Generate Neighbor</span>
                  <span className="modal-step-desc">Tukar 2 slot shift secara acak, hitung cost baru</span>
                </div>
              </div>
              <div className="modal-step-arrow">↓</div>
              <div className="modal-step">
                <span className="modal-step-num">03</span>
                <div className="modal-step-content">
                  <span className="modal-step-title">Keputusan Terima / Tolak</span>
                  <span className="modal-step-desc">Lebih baik → selalu terima. Lebih buruk → terima dengan prob. e^(−ΔE/T)</span>
                </div>
              </div>
              <div className="modal-step-arrow">↓</div>
              <div className="modal-step">
                <span className="modal-step-num">04</span>
                <div className="modal-step-content">
                  <span className="modal-step-title">Pendinginan</span>
                  <span className="modal-step-desc">T = T × α (cooling rate 0.95), ulangi sampai T &lt; 0.1 atau maks 15.000 iterasi</span>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <div className="modal-section-label">FUNGSI OBJEKTIF (COST)</div>
            <div className="modal-cost-grid">
              <div className="modal-cost-item hard">
                <span className="modal-cost-type">HARD</span>
                <span className="modal-cost-desc">Pegawai dijadwal saat tidak tersedia</span>
                <span className="modal-cost-val">×3000</span>
              </div>
              <div className="modal-cost-item hard">
                <span className="modal-cost-type">HARD</span>
                <span className="modal-cost-desc">Shift kekurangan pegawai / duplikat assignment</span>
                <span className="modal-cost-val">×3000</span>
              </div>
              <div className="modal-cost-item hard">
                <span className="modal-cost-type">HARD</span>
                <span className="modal-cost-desc">Pegawai mendapat 2 shift di hari yang sama</span>
                <span className="modal-cost-val">×3000</span>
              </div>
              <div className="modal-cost-item soft">
                <span className="modal-cost-type">SOFT</span>
                <span className="modal-cost-desc">Melebihi batas shift per minggu (overwork)</span>
                <span className="modal-cost-val">×200</span>
              </div>
              <div className="modal-cost-item soft">
                <span className="modal-cost-type">SOFT</span>
                <span className="modal-cost-desc">Pegawai tidak mendapat shift sama sekali</span>
                <span className="modal-cost-val">×200</span>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <div className="modal-section-label">TECH STACK</div>
            <div className="modal-stack-row">
              <div className="modal-stack-item">
                <span className="modal-stack-label">FRONTEND</span>
                <span className="modal-stack-val">React</span>
              </div>
              <div className="modal-stack-item">
                <span className="modal-stack-label">BACKEND</span>
                <span className="modal-stack-val">Python + FastAPI</span>
              </div>
              <div className="modal-stack-item">
                <span className="modal-stack-label">DATABASE</span>
                <span className="modal-stack-val">PostgreSQL</span>
              </div>
              <div className="modal-stack-item">
                <span className="modal-stack-label">ALGORITMA</span>
                <span className="modal-stack-val">Simulated Annealing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
