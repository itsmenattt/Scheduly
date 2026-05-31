import React, { useMemo } from 'react';

/**
 * SAChart — visualisasi statis Simulated Annealing
 * Mensimulasikan kurva temperature cooling & cost convergence
 * berdasarkan data meta dari backend (iterations_run, total_cost, runtime_seconds)
 */
export default function SAChart({ meta }) {
  const { iterations_run = 1000, total_cost = 0 } = meta;
  const runtime_seconds = meta.runtime_seconds;
  const runtime_milliseconds = meta.runtime_milliseconds;
  const runtime_nanoseconds = meta.runtime_nanoseconds;

  const formatRuntime = () => {
    const ns = runtime_nanoseconds;
    const ms = runtime_milliseconds;
    const s = runtime_seconds;
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

  // Generate data titik-titik simulasi (50 titik)
  const points = useMemo(() => {
    const N = 50;
    const T0 = 3000;   // sesuai backend: initial_temperature = 3000
    const alpha = 0.95; // sesuai backend: cooling_rate = 0.95
    const pts = [];

    for (let i = 0; i <= N; i++) {
      const progress = i / N;
      // Suhu: eksponensial decay
      const temp = T0 * Math.pow(alpha, i * (iterations_run / N / 100));

      // Cost: turun mengikuti kurva, dengan sedikit noise di awal
      const noise = progress < 0.4
        ? (Math.random() - 0.3) * total_cost * 0.8 * (1 - progress * 2)
        : 0;
      const baseCost = total_cost + (4500 - total_cost) * Math.exp(-progress * 5);
      const cost = Math.max(total_cost, baseCost + noise);

      pts.push({ progress, temp, cost, iter: Math.round(progress * iterations_run) });
    }
    return pts;
  }, [iterations_run, total_cost]);

  // SVG dimensions
  const W = 560, H = 180, PAD = { top: 20, right: 20, bottom: 36, left: 52 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // Scale helpers
  const xScale = (progress) => PAD.left + progress * innerW;
  const tempScale = (t) => PAD.top + innerH - (t / 3000) * innerH;  // Y-axis max = 3000
  const costScale = (c) => {
    const maxC = 4500;
    return PAD.top + innerH - Math.min(c / maxC, 1) * innerH;
  };

  // Build polyline strings
  const tempLine = points.map(p => `${xScale(p.progress)},${tempScale(p.temp)}`).join(' ');
  const costLine = points.map(p => `${xScale(p.progress)},${costScale(p.cost)}`).join(' ');

  // Area fill untuk cost
  const costArea = [
    `${xScale(0)},${PAD.top + innerH}`,
    ...points.map(p => `${xScale(p.progress)},${costScale(p.cost)}`),
    `${xScale(1)},${PAD.top + innerH}`,
  ].join(' ');

  // X-axis ticks (5 titik)
  const xTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          letterSpacing: '0.08em',
          color: 'var(--text-primary)',
          flex: 1,
        }}>
          KURVA OPTIMASI SA
        </span>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <LegendDot color="var(--yellow)" label="TEMPERATURE" />
          <LegendDot color="#5b8dd4" label="COST" dashed />
        </div>
      </div>

      {/* Chart SVG */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        overflowX: 'auto',
      }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', minWidth: 320 }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
            <line
              key={i}
              x1={xScale(v)} y1={PAD.top}
              x2={xScale(v)} y2={PAD.top + innerH}
              stroke="var(--border)" strokeWidth="1"
            />
          ))}
          {[0, 0.5, 1].map((v, i) => (
            <line
              key={i}
              x1={PAD.left} y1={PAD.top + innerH * (1 - v)}
              x2={PAD.left + innerW} y2={PAD.top + innerH * (1 - v)}
              stroke="var(--border)" strokeWidth="1"
            />
          ))}

          {/* Cost area fill */}
          <polygon
            points={costArea}
            fill="#5b8dd4"
            fillOpacity="0.07"
          />

          {/* Cost line */}
          <polyline
            points={costLine}
            fill="none"
            stroke="#5b8dd4"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            strokeLinecap="round"
          />

          {/* Temperature line */}
          <polyline
            points={tempLine}
            fill="none"
            stroke="var(--yellow)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Final cost dot */}
          {(() => {
            const last = points[points.length - 1];
            return (
              <circle
                cx={xScale(1)}
                cy={costScale(last.cost)}
                r="3"
                fill="#5b8dd4"
              />
            );
          })()}

          {/* Final temp dot */}
          {(() => {
            const last = points[points.length - 1];
            return (
              <circle
                cx={xScale(1)}
                cy={tempScale(last.temp)}
                r="3"
                fill="var(--yellow)"
              />
            );
          })()}

          {/* X-axis labels */}
          {xTicks.map((v, i) => (
            <text
              key={i}
              x={xScale(v)}
              y={PAD.top + innerH + 18}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill="var(--text-muted)"
            >
              {Math.round(v * iterations_run).toLocaleString()}
            </text>
          ))}

          {/* X-axis label */}
          <text
            x={PAD.left + innerW / 2}
            y={H - 2}
            textAnchor="middle"
            fontSize="8"
            fontFamily="var(--font-mono)"
            fill="var(--text-muted)"
            letterSpacing="1"
          >
            ITERASI
          </text>

          {/* Y-axis labels — sesuai T_START = 3000 */}
          {[0, 1500, 3000].map((v, i) => (
            <text
              key={i}
              x={PAD.left - 6}
              y={tempScale(v) + 4}
              textAnchor="end"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill="var(--text-muted)"
            >
              {v}
            </text>
          ))}

          {/* Y-axis label */}
          <text
            x={12}
            y={PAD.top + innerH / 2}
            textAnchor="middle"
            fontSize="8"
            fontFamily="var(--font-mono)"
            fill="var(--text-muted)"
            letterSpacing="1"
            transform={`rotate(-90, 12, ${PAD.top + innerH / 2})`}
          >
            TEMP / COST
          </text>

          {/* Annotation: final cost */}
          <text
            x={xScale(0.98)}
            y={costScale(total_cost) - 8}
            textAnchor="end"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill="#5b8dd4"
          >
            cost={total_cost}
          </text>
        </svg>
      </div>

      {/* Info bar bawah chart */}
      <div style={{
        display: 'flex',
        gap: 0,
        border: '1px solid var(--border)',
        borderTop: 'none',
        marginBottom: '0.5rem',
      }}>
        <MiniStat label="T_START" value="3000" />
        <MiniStat label="COOLING α" value="0.95" />
        <MiniStat label="MAX ITER" value="15.000" />
        <MiniStat label="ITERASI" value={iterations_run.toLocaleString()} />
        <MiniStat label="RUNTIME" value={formatRuntime()} />
        <MiniStat label="FINAL COST" value={total_cost} highlight={total_cost === 0} />
      </div>
    </div>
  );
}

function LegendDot({ color, label, dashed }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="20" height="10">
        <line
          x1="0" y1="5" x2="20" y2="5"
          stroke={color} strokeWidth="2"
          strokeDasharray={dashed ? '4 3' : undefined}
        />
      </svg>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: '0.12em',
        color: 'var(--text-muted)',
      }}>{label}</span>
    </div>
  );
}

function MiniStat({ label, value, highlight }) {
  return (
    <div style={{
      flex: 1,
      padding: '8px 14px',
      borderRight: '1px solid var(--border)',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 8,
        letterSpacing: '0.14em',
        color: 'var(--text-muted)',
        marginBottom: 3,
      }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 18,
        letterSpacing: '0.04em',
        color: highlight ? 'var(--green-text)' : 'var(--text-primary)',
      }}>{value}</div>
    </div>
  );
}
