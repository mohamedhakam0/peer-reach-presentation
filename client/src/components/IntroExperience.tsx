import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const DEEP_BLACK = 'var(--intro-bg)';
const WHITE = 'var(--intro-text)';
const CYAN = 'var(--intro-cyan)';
const GOLD = 'var(--intro-gold)';
const GREEN = 'var(--intro-green)';
const PURPLE = 'var(--intro-purple)';

function ThemeToggle() {
  const [light, setLight] = useState(() =>
    document.documentElement.classList.contains('light-mode')
  );

  const toggle = () => {
    const next = !light;
    document.documentElement.classList.toggle('light-mode', next);
    localStorage.setItem('intro-theme', next ? 'light' : 'dark');
    setLight(next);
  };

  useEffect(() => {
    const saved = localStorage.getItem('intro-theme');
    if (saved === 'light') {
      document.documentElement.classList.add('light-mode');
      setLight(true);
    }
  }, []);

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light / dark mode"
      style={{
        position: 'fixed',
        top: 18,
        right: 18,
        zIndex: 9999,
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '1px solid var(--intro-border)',
        background: 'var(--intro-surface-hard)',
        color: 'var(--intro-text)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        backdropFilter: 'blur(8px)',
        transition: 'background 200ms, border-color 200ms',
      }}
    >
      {light ? '🌙' : '☀️'}
    </button>
  );
}

const INTRO_SECTION_IDS = [
  'cover',                    // 0
  'hook-agenda',              // 1
  'hook-abstract',            // 2
  'hook-problem',             // 3
  'hook-insight',             // 4
  'hook-range',               // 5
  'hook-solution',            // 6
  'hook-architecture',        // 7
  'hook-components',          // 8
  'hook-demo',                // 9
  'hook-packet',              // 10
  'hook-flooding',            // 11
  'hook-security',            // 12
  'hook-security-framework',            // 13
  'hook-security-deep',       // 13
  'hook-security-scenarios',  // 14
  'hook-results-mdr',         // 17 — NEW: MDR vs distance bar chart     
  'hook-numbers',             // 15
  'hook-results-cdf',
  'hook-numbers-conc',             // 15
  'hook-related',             // 16
  'hook-transition',          // 17
] as const;

const TOTAL_SLIDES = INTRO_SECTION_IDS.length;

// ─── Slide number indicator ────────────────────────────────────────────────────
function SlideNumber({ current }: { current: number }) {
  const n = String(current + 1).padStart(2, '0');
  const total = String(TOTAL_SLIDES).padStart(2, '0');
  return (
    <div style={{
      position: 'fixed',
      bottom: 22,
      left: 24,
      zIndex: 9999,
      fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
      fontSize: 11,
      letterSpacing: '0.12em',
      color: 'var(--intro-text-faint)',
      userSelect: 'none',
      pointerEvents: 'none',
    }}>
      {n}<span style={{ opacity: 0.4, margin: '0 4px' }}>/</span>{total}
    </div>
  );
}

// ─── Result Slide A: MDR vs Distance bar chart ───────────────────────────────
function MDRChart({ active }: { active: boolean }) {
  const bars = [
    { label: '1 cm',      mdr: 100, ack: 100 },
    { label: '30 cm (W)', mdr: 100, ack: 80,  wall: true },
    { label: '1 m',       mdr: 60,  ack: 60  },
    { label: '6 m (W)',   mdr: 100, ack: 18,  wall: true },
    { label: '10 m',      mdr: 92,  ack: 53  },
    { label: '15 m',      mdr: 100, ack: 0,   ackNA: true },
    { label: '20 m',      mdr: 100, ack: 40  },
    { label: '30 m',      mdr: 87,  ack: 17  },
  ];
  const W = 820, H = 320, PL = 54, PR = 20, PT = 24, PB = 56;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const groupW = chartW / bars.length;
  const bw = groupW * 0.28;
  const yTicks = [0, 20, 40, 60, 80, 100];

  return (
    <div className={`res-chart-wrap ${active ? 'is-active' : ''}`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', transform: 'scale(1.4)', marginTop: '45px' }}>
        {/* Y-axis grid + labels */}
        {yTicks.map(v => {
          const y = PT + chartH - (v / 100) * chartH;
          return (
            <g key={v}>
              <line x1={PL} y1={y} x2={W - PR} y2={y}
                stroke="var(--intro-border-soft)" strokeWidth="0.6" strokeDasharray={v === 0 ? '0' : '3 3'} />
              <text x={PL - 6} y={y + 4} textAnchor="end"
                fill="var(--intro-text-faint)" fontSize="9" fontFamily="var(--font-mono,monospace)">{v}</text>
            </g>
          );
        })}
        {/* Y axis label */}
        <text x={12} y={PT + chartH / 2} textAnchor="middle"
          fill="var(--intro-text-muted)" fontSize="10" fontFamily="var(--font-mono,monospace)"
          transform={`rotate(-90, 12, ${PT + chartH / 2})`}>MDR (%)</text>

        {/* Bars */}
        {bars.map((b, i) => {
          const gx = PL + i * groupW;
          const cx = gx + groupW / 2;
          const mdrH = (b.mdr / 100) * chartH;
          const ackH = (b.ack / 100) * chartH;
          const delay = active ? `${i * 80}ms` : '0ms';
          return (
            <g key={i}>
              {/* Packet MDR bar (cyan/blue) */}
              <rect
                x={cx - bw - 2} y={PT + chartH - mdrH} width={bw} height={mdrH}
                fill={CYAN} opacity="0.75" rx="2"
                style={{ transition: `height 0.5s ease ${delay}, y 0.5s ease ${delay}` }}
              />
              {/* ACK-MDR bar (gold) */}
              {!b.ackNA ? (
                <rect
                  x={cx + 2} y={PT + chartH - ackH} width={bw} height={ackH}
                  fill={GOLD} opacity="0.75" rx="2"
                  style={{ transition: `height 0.5s ease ${delay}, y 0.5s ease ${delay}` }}
                />
              ) : (
                /* hatched bar for N/A */
                <rect x={cx + 2} y={PT + chartH - 8} width={bw} height={8}
                  fill="none" stroke={GOLD} strokeWidth="1" strokeDasharray="3 2" opacity="0.5" rx="1" />
              )}
              {/* X label */}
              <text x={cx} y={PT + chartH + 14} textAnchor="middle"
                fill={b.wall ? '#f87171' : 'var(--intro-text-muted)'} fontSize="8.5"
                fontFamily="var(--font-mono,monospace)">{b.label}</text>
              {b.wall && (
                <text x={cx} y={PT + chartH + 25} textAnchor="middle"
                  fill="#f87171" fontSize="7" fontFamily="var(--font-mono,monospace)">Wall</text>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <rect x={PL + 10} y={PT + 4} width={10} height={10} fill={CYAN} opacity="0.75" rx="2" />
        <text x={PL + 24} y={PT + 13} fill="var(--intro-text-dim)" fontSize="9" fontFamily="var(--font-mono,monospace)">Packet MDR</text>
        <rect x={PL + 100} y={PT + 4} width={10} height={10} fill={GOLD} opacity="0.75" rx="2" />
        <text x={PL + 114} y={PT + 13} fill="var(--intro-text-dim)" fontSize="9" fontFamily="var(--font-mono,monospace)">ACK-MDR (N/A for 15 m manual)</text>

        {/* X axis */}
        <line x1={PL} y1={PT + chartH} x2={W - PR} y2={PT + chartH} stroke="var(--intro-border)" strokeWidth="1" />
        <line x1={PL} y1={PT} x2={PL} y2={PT + chartH} stroke="var(--intro-border)" strokeWidth="1" />
      </svg>

      {/* Caption */}
      <p style={{ textAlign: 'center', fontSize: 15, color: 'var(--intro-text-muted)', marginTop: 35, fontFamily: 'var(--font-mono,monospace)' }}>
        Packet MDR ≥ 86.7% at all tested distances · ACK-MDR degrades with distance &amp; wall penetration
      </p>
    </div>
  );
}

// ─── Result Slide D: ACK RTT CDF ─────────────────────────────────────────────
function ACKCDFChart({ active }: { active: boolean }) {
  const W = 820, H = 320, PL = 58, PR = 20, PT = 18, PB = 58;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const maxX = 4500;

  const toX = (ms: number) => PL + (ms / maxX) * chartW;
  const toY = (prob: number) => PT + chartH - prob * chartH;

  const pathD = (pts: [number, number][]) =>
    pts.map(([ms, p], i) => `${i === 0 ? 'M' : 'L'}${toX(ms).toFixed(1)},${toY(p).toFixed(1)}`).join(' ');

  // Aggregate bold line
  const agg: [number, number][] = [
    [0,0],[150,0.01],[300,0.05],[450,0.14],[550,0.24],[650,0.37],
    [750,0.47],[849,0.58],[950,0.63],[1100,0.68],[1300,0.73],
    [1500,0.78],[1700,0.82],[1900,0.85],[2100,0.87],[2300,0.89],
    [2480,0.90],[2700,0.92],[3000,0.94],[3500,0.97],[4000,0.985],[4500,1.0],
  ];

  // Per-session lighter lines (approximated from Figure 8.2)
  const sessions: { pts: [number, number][]; col: string; op: number }[] = [
    { pts:[[0,0],[200,0.05],[400,0.22],[600,0.5],[800,0.68],[1000,0.82],[1300,0.93],[1800,0.99],[2200,1.0]], col:'#93c5fd', op:0.5 },
    { pts:[[0,0],[300,0.04],[600,0.28],[900,0.54],[1200,0.72],[1600,0.86],[2200,0.95],[3000,0.99],[3500,1.0]], col:'#94a3b8', op:0.4 },
    { pts:[[0,0],[400,0.03],[700,0.14],[1000,0.34],[1400,0.57],[1800,0.72],[2200,0.82],[2800,0.9],[3500,0.97],[4500,1.0]], col:'#94a3b8', op:0.35 },
    { pts:[[0,0],[600,0.04],[1000,0.1],[1500,0.27],[2000,0.51],[2500,0.71],[3000,0.85],[3800,0.95],[4500,1.0]], col:'#f59e0b', op:0.55 },
    { pts:[[0,0],[500,0.14],[800,0.44],[1100,0.67],[1400,0.81],[1800,0.91],[2500,0.97],[3200,1.0]], col:'#93c5fd', op:0.35 },
  ];

  const xTicks = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500];
  const yTicks = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <div className={`res-chart-wrap ${active ? 'is-active' : ''}`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', transform: 'scale(1.4)', marginTop: '45px' }}>
        {/* Y grid + labels */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={PL} y1={toY(v)} x2={W - PR} y2={toY(v)}
              stroke="var(--intro-border-soft)" strokeWidth={v === 0 ? 1 : 0.6} strokeDasharray={v === 0 ? '0' : '3 3'} />
            <text x={PL - 6} y={toY(v) + 4} textAnchor="end"
              fill="var(--intro-text-faint)" fontSize="9" fontFamily="var(--font-mono,monospace)">{v.toFixed(1)}</text>
          </g>
        ))}
        {/* X grid + labels */}
        {xTicks.map(v => (
          <g key={v}>
            {v > 0 && <line x1={toX(v)} y1={PT} x2={toX(v)} y2={PT + chartH}
              stroke="var(--intro-border-soft)" strokeWidth="0.6" strokeDasharray="3 3" />}
            <text x={toX(v)} y={PT + chartH + 14} textAnchor="middle"
              fill="var(--intro-text-faint)" fontSize="9" fontFamily="var(--font-mono,monospace)">{v}</text>
          </g>
        ))}
        {/* Axes */}
        <line x1={PL} y1={PT} x2={PL} y2={PT + chartH} stroke="var(--intro-border)" strokeWidth="1" />
        <line x1={PL} y1={PT + chartH} x2={W - PR} y2={PT + chartH} stroke="var(--intro-border)" strokeWidth="1" />

        {/* Axis labels */}
        <text x={12} y={PT + chartH / 2} textAnchor="middle"
          fill="var(--intro-text-muted)" fontSize="9.5" fontFamily="var(--font-mono,monospace)"
          transform={`rotate(-90,12,${PT + chartH / 2})`}>Cumulative probability</text>
        <text x={PL + chartW / 2} y={H - 4} textAnchor="middle"
          fill="var(--intro-text-muted)" fontSize="9.5" fontFamily="var(--font-mono,monospace)">ACK Round-Trip Time (ms)</text>

        {/* Per-session lines */}
        {sessions.map((s, i) => (
          <path key={i} d={pathD(s.pts)} fill="none" stroke={s.col} strokeWidth="1.2" opacity={s.op} />
        ))}

        {/* P50 dashed reference */}
        <line x1={PL} y1={toY(0.58)} x2={toX(849)} y2={toY(0.58)}
          stroke="var(--intro-text-faint)" strokeWidth="0.8" strokeDasharray="4 3" />
        <line x1={toX(849)} y1={toY(0.58)} x2={toX(849)} y2={PT + chartH}
          stroke="var(--intro-text-faint)" strokeWidth="0.8" strokeDasharray="4 3" />
        <text x={toX(849) + 4} y={toY(0.58) - 5}
          fill="var(--intro-text-muted)" fontSize="8.5" fontFamily="var(--font-mono,monospace)">P50 = 849 ms</text>

        {/* P90 dashed reference */}
        <line x1={PL} y1={toY(0.90)} x2={toX(2480)} y2={toY(0.90)}
          stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.7" />
        <line x1={toX(2480)} y1={toY(0.90)} x2={toX(2480)} y2={PT + chartH}
          stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.7" />
        <text x={toX(2480) + 4} y={toY(0.90) - 5}
          fill="#f59e0b" fontSize="8.5" fontFamily="var(--font-mono,monospace)">P90 = 2480 ms</text>

        {/* Aggregate bold line */}
        <path d={pathD(agg)} fill="none" stroke="#1e40af" strokeWidth="2.8" opacity="0.9" />
        <path d={pathD(agg)} fill="none" stroke="#60a5fa" strokeWidth="1.6" opacity="0.7" />

        {/* Legend */}
        <line x1={W - 170} y1={PT + 14} x2={W - 148} y2={PT + 14} stroke="#1e40af" strokeWidth="2.5" />
        <line x1={W - 170} y1={PT + 14} x2={W - 148} y2={PT + 14} stroke="#60a5fa" strokeWidth="1.4" />
        <text x={W - 143} y={PT + 18} fill="var(--intro-text-dim)" fontSize="8.5" fontFamily="var(--font-mono,monospace)">Aggregate (all sessions)</text>
        <line x1={W - 170} y1={PT + 28} x2={W - 148} y2={PT + 28} stroke="#94a3b8" strokeWidth="1.2" opacity="0.5" />
        <text x={W - 143} y={PT + 32} fill="var(--intro-text-faint)" fontSize="8.5" fontFamily="var(--font-mono,monospace)">Per-distance sessions</text>
      </svg>
      <p style={{ textAlign:'center', fontSize:15, color:'var(--intro-text-muted)', fontFamily:'var(--font-mono,monospace)', marginTop:35 }}>
        <br/>P50 latency 849 ms · P90 latency 2480 ms · outliers at 10 m attributed to advertising channel saturation
      </p>
    </div>
  );
}

// ─── Agenda slide ─────────────────────────────────────────────────────────────
const AGENDA_ITEMS = [
  { num: '01',    label: 'Thesis Overview',    desc: '' },
  { num: '02',    label: 'Problem Statement',  desc: '' },
  { num: '03', label: 'Background',         desc: '' },
  { num: '04',    label: 'System Model',       desc: '' },
  { num: '05', label: 'System & Demo',      desc: '' },
  { num: '06',    label: 'Packet Design',      desc: '' },
  { num: '07', label: 'Security',           desc: '' },
  { num: '08',    label: 'Key Results',        desc: '' },
  { num: '09',    label: 'Comparison',         desc: '' },
];

function AgendaSlide() {
  return (
    <div className="agenda-slide">
      <h2 className="agenda-title">Agenda</h2>
      
      <div className="timeline-container">
        {AGENDA_ITEMS.map((item, i) => {
          // Odd numbers (1, 3, 5...) go on top, Evens (2, 4, 6...) go on bottom
          const isTop = item.num % 2 !== 0;

          return (
            <div key={item.num} className="timeline-item" style={{ height: '220px' }}>
              
              {isTop ? (
                <div className="timeline-content-top">
                  <span>{item.label}</span>
                </div>
              ) : (
                <div className="timeline-content-bottom">
                  <span>{item.label}</span>
                </div>
              )}

              <div className="timeline-circle">
                {item.num}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Slide 12: Security Framework ───────────────────────────────────────────
const SECURITY_ITEMS = [
  {
    title: "Confidentiality",
    desc: "Only the intended receiver can read messages.",
    isWide: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    )
  },
  {
    title: "Integrity",
    desc: "Detect any message modification.",
    isWide: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="m9 12 2 2 4-4"></path>
      </svg>
    )
  },
  {
    title: "Authentication",
    desc: "Verify communicating users.",
    isWide: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 11h-6"></path>
      </svg>
    )
  },
  {
    title: "Privacy",
    desc: "Protect user identity.",
    isWide: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    )
  },
  {
    title: "Availability",
    desc: "Communication continues without internet.",
    isWide: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
        <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
        <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3"></line>
      </svg>
    )
  }
];

function SecurityFrameworkSlide({ visible }: { visible: boolean }) {
  return (
    <div className="security-slide">
      <h2 className="security-title">Security Framework</h2>
      
      <div className="security-grid">
        {SECURITY_ITEMS.map((item, i) => (
          <div 
            key={item.title} 
            className={`security-card ${item.isWide ? 'wide-card' : ''}`}
            style={{ 
              '--si': i,
              animationPlayState: visible ? 'running' : 'paused'
            } as React.CSSProperties}
          >
            <div className="security-icon-wrapper">
              {item.icon}
            </div>
            <h3 className="security-card-title">{item.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Slide 11: Key Metrics (6-metric grid) ───────────────────────────────────
function NumbersConc({ visibleCount }: { visibleCount: number }) {
  const metrics = [
    { value: '<2',    unit: 's',   label: 'END-TO-END LATENCY',        sub: 'measured across 5 hops in testing',              color: CYAN },
    { value: '1,500', unit: 'm',   label: 'TESTED LORA RANGE',         sub: 'real-world outdoor deployment · SX1276',         color: GOLD },
    { value: '20',    unit: 'm',   label: 'BLE PER-HOP RANGE',         sub: 'LE Coded PHY — indoor tested',                   color: CYAN },
    { value: '200',   unit: '',    label: 'DEDUP CACHE SIZE',           sub: 'seen_msg_ids ring buffer per relay node',         color: GOLD },
    { value: '250',   unit: 'B',   label: 'PACKET SIZE CAP',           sub: 'optimized for LoRa airtime constraints',          color: CYAN },
    { value: '5',     unit: '',    label: 'MAX HOP COUNT (TTL)',        sub: 'flood-limited with managed jitter rebroadcast',   color: GOLD },
  ];

  return (
    <div className="numbers-grid-wrap">
      <div className="numbers-grid">
        {metrics.map((m, i) => (
          <div key={i} className={`ngrid-card ${visibleCount > i ? 'is-visible' : ''}`}
            style={{ '--ng-delay': `${i * 160}ms` } as React.CSSProperties}>
            <div className="ngrid-rule" style={{ background: m.color }} />
            <div className="ngrid-value">
              {m.value}<span className="ngrid-unit" style={{ color: m.color }}>{m.unit}</span>
            </div>
            <div className="ngrid-label">{m.label}</div>
            <p className="ngrid-sub">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Ambient background (cover slide) ─────────────────────────────────────────
function AmbientBackground() {
  return (
    <div className="intro-ambient" aria-hidden="true">
      <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" className="intro-ambient-svg">
        <defs>
          <linearGradient id="intro-lora" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={CYAN} stopOpacity="0.5" />
            <stop offset="50%" stopColor={GOLD} stopOpacity="0.8" />
            <stop offset="100%" stopColor={CYAN} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <line x1="210" y1="370" x2="990" y2="340" stroke="url(#intro-lora)" strokeWidth="1.6" strokeDasharray="9 10" opacity="0.8" className="intro-lora-line" />
        <circle r="4" fill={GOLD} className="intro-lora-dot">
          <animateMotion dur="5.5s" repeatCount="indefinite" path="M210,370 L990,340" />
        </circle>
        {[
          { x: 220, y: 360, d: '0s' },
          { x: 350, y: 325, d: '0.5s' },
          { x: 470, y: 390, d: '1.1s' },
          { x: 620, y: 350, d: '0.8s' },
          { x: 760, y: 315, d: '1.6s' },
          { x: 900, y: 370, d: '0.3s' },
        ].map((n, idx) => (
          <g key={idx} className="intro-node" style={{ animationDelay: n.d }}>
            <circle cx={n.x} cy={n.y} r="5" fill={WHITE} opacity="0.85" />
            <circle cx={n.x} cy={n.y} r="19" stroke={CYAN} strokeWidth="1" fill="none" className="intro-ble-ring" style={{ animationDelay: n.d }} />
          </g>
        ))}
      </svg>
    </div>
  );
}

function SectionFrame({ id, isActive, children }: { id: string; isActive: boolean; children: React.ReactNode }) {
  return (
    <section id={id} data-intro-section className={`intro-section ${isActive ? 'is-active' : ''}`}>
      {children}
    </section>
  );
}

// ─── Slide 2: Abstract ────────────────────────────────────────────────────────
function AbstractSlide() {
  return (
    <div className="abstract-slide">
      <blockquote className="abstract-quote">
        "A hybrid BLE-LoRa mesh protocol enabling encrypted, infrastructure-free messaging across smartphones and embedded devices — no internet required."
      </blockquote>
    </div>
  );
}

// ─── Slide 3: Problem (list format) ──────────────────────────────────────────
function ProblemList({ visible }: { visible: boolean }) {
  const items = [
    { icon: '🏔️', title: 'Search & Rescue', desc: 'Remote terrain. No signal. Rescue teams go completely silent.' },
    { icon: '🏟️', title: 'Mass Events', desc: 'Stadium overload. 80,000 people. Networks collapse under load.' },
    { icon: '🌍', title: 'Disaster Relief', desc: 'Infrastructure destroyed. Aid teams cannot coordinate.' },
    { icon: '🪖', title: 'Military Operations', desc: 'RF-restricted zones. No cellular permitted on the ground.' },
    { icon: '🌾', title: 'Rural & Remote Communities', desc: 'No towers for miles. No way to call for help.' },
  ];
  return (
    <ul className={`problem-list ${visible ? 'is-visible' : ''}`}>
      {items.map((item, i) => (
        <li
          key={i}
          className="problem-list-item"
          style={{ '--pli-delay': `${i * 120}ms` } as React.CSSProperties}
        >
          <span className="problem-list-emoji">{item.icon}</span>
          <div className="problem-list-text">
            <strong>{item.title}</strong>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Slide 4: Insight animation (unchanged) ───────────────────────────────────
function InsightAnimation() {
  return (
    <svg className="hook-visual" viewBox="0 0 620 220" aria-hidden="true">
      <g className="insight-phone p1">
        <rect x="70" y="76" rx="12" ry="12" width="76" height="128" fill="none" stroke={WHITE} strokeWidth="2" />
        <circle cx="108" cy="183" r="4" fill={WHITE} />
      </g>
      <g className="insight-phone p2">
        <rect x="272" y="22" rx="12" ry="12" width="76" height="128" fill="none" stroke={WHITE} strokeWidth="2" />
        <circle cx="310" cy="129" r="4" fill={WHITE} />
      </g>
      <g className="insight-phone p3">
        <rect x="474" y="76" rx="12" ry="12" width="76" height="128" fill="none" stroke={WHITE} strokeWidth="2" />
        <circle cx="512" cy="183" r="4" fill={WHITE} />
      </g>
      <path d="M146 128 C 210 88, 250 76, 272 86" fill="none" stroke={CYAN} strokeWidth="1.8" strokeLinecap="round" className="insight-arc a1" />
      <path d="M348 86 C 388 76, 438 88, 474 128" fill="none" stroke={CYAN} strokeWidth="1.8" strokeLinecap="round" className="insight-arc a2" />
      <circle r="4" fill={CYAN} className="insight-dot d1">
        <animateMotion dur="2.8s" repeatCount="indefinite" begin="1.4s" path="M146,128 C210,88 250,76 272,86" />
      </circle>
      <circle r="4" fill={CYAN} className="insight-dot d2">
        <animateMotion dur="2.8s" repeatCount="indefinite" begin="1.95s" path="M348,86 C388,76 438,88 474,128" />
      </circle>
    </svg>
  );
}

// ─── Slide 5: Range failure animation ────────────────────────────────────────
function RangeFailureAnimation() {
  return (
    <svg className="hook-visual" viewBox="0 0 640 220" aria-hidden="true">
      {[100, 160, 220].map((x, i) => <circle key={`l${i}`} cx={x} cy={120 + (i % 2 === 0 ? -16 : 14)} r="12" fill="none" stroke={WHITE} strokeWidth="2" opacity="0.9" />)}
      {[420, 480, 540].map((x, i) => <circle key={`r${i}`} cx={x} cy={120 + (i % 2 === 0 ? -16 : 14)} r="12" fill="none" stroke={WHITE} strokeWidth="2" opacity="0.9" />)}
      <line x1="112" y1="104" x2="172" y2="134" stroke={CYAN} strokeWidth="1.6" opacity="0.7" />
      <line x1="172" y1="134" x2="232" y2="104" stroke={CYAN} strokeWidth="1.6" opacity="0.7" />
      <line x1="432" y1="104" x2="492" y2="134" stroke={CYAN} strokeWidth="1.6" opacity="0.7" />
      <line x1="492" y1="134" x2="552" y2="104" stroke={CYAN} strokeWidth="1.6" opacity="0.7" />
      <line x1="250" y1="118" x2="388" y2="118" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="5 7" opacity="0.55" className="gap-pulse-fail" />
      <circle cx="250" cy="118" r="5" fill="#ff7f7f" className="packet-fail" />
      <text x="319" y="168" textAnchor="middle" fill="#ef4444" fontSize="10" opacity="0.7" fontFamily="var(--font-mono, monospace)" letterSpacing="0.08em">~20 m MAX RANGE</text>
    </svg>
  );
}

// ─── Slide 6: Solution animation ─────────────────────────────────────────────
function SolutionAnimation() {
  return (
    <svg className="hook-visual" viewBox="0 0 640 220" aria-hidden="true">
      {[100, 160, 220].map((x, i) => <circle key={`l${i}`} cx={x} cy={120 + (i % 2 === 0 ? -16 : 14)} r="12" fill="none" stroke={WHITE} strokeWidth="2" opacity="0.9" />)}
      {[420, 480, 540].map((x, i) => <circle key={`r${i}`} cx={x} cy={120 + (i % 2 === 0 ? -16 : 14)} r="12" fill="none" stroke={WHITE} strokeWidth="2" opacity="0.9" />)}
      <line x1="112" y1="104" x2="172" y2="134" stroke={CYAN} strokeWidth="1.6" opacity="0.7" />
      <line x1="172" y1="134" x2="232" y2="104" stroke={CYAN} strokeWidth="1.6" opacity="0.7" />
      <line x1="432" y1="104" x2="492" y2="134" stroke={CYAN} strokeWidth="1.6" opacity="0.7" />
      <line x1="492" y1="134" x2="552" y2="104" stroke={CYAN} strokeWidth="1.6" opacity="0.7" />
      <g className="lora-bridge-icon">
        <rect x="296" y="90" width="46" height="56" rx="10" fill="none" stroke={GOLD} strokeWidth="2" />
        <line x1="319" y1="90" x2="319" y2="64" stroke={GOLD} strokeWidth="2" />
        <path d="M308 73 C 314 66, 324 66, 330 73" fill="none" stroke={GOLD} strokeWidth="2" />
      </g>
      <line x1="250" y1="118" x2="388" y2="118" stroke={GOLD} strokeWidth="2" strokeDasharray="6 6" className="gap-pulse-success" />
      <circle cx="250" cy="118" r="5" fill={GOLD} className="packet-success" />
      <circle cx="540" cy="104" r="18" fill="none" stroke={GREEN} strokeWidth="1.8" className="deliver-pulse" />
      <text x="319" y="168" textAnchor="middle" fill={GOLD} fontSize="10" opacity="0.8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.08em">1,500 m RADIUS OF COVERAGE</text>
    </svg>
  );
}

// ─── Slide 7: Related work comparison ────────────────────────────────────────
function RelatedWorkTable({ visible }: { visible: boolean }) {
  const tools = ['Meshtastic', 'Bridgefy', 'GoTenna', 'Peer Reach'];
  const isPeerReach = (i: number) => i === 3;

  type CellVal = boolean | 'partial' | 'planned';
  const rows: { label: string; values: CellVal[] }[] = [
    { label: 'BLE Support',                  values: [false,     true,    false,    true]     },
    { label: 'LoRa Support',                 values: [true,      false,   true,     true]     },
    { label: 'Phone-Native (no extra HW)',   values: [false,     true,    false,    true]     },
    { label: 'End-to-End Encryption',        values: [true,      'partial', true,   true]     },
    { label: 'Open Protocol',                values: [true,      false,   false,    true]     },
    { label: 'No Proprietary Hardware',      values: [false,     false,   false,    true]     },
    { label: 'QR Key Exchange (OOB)',        values: [false,     false,   false,    true]     },
  ];

  function Cell({ val, highlight }: { val: CellVal; highlight: boolean }) {
    if (val === true)      return <span className={`rtc rtc-yes ${highlight ? 'rtc-highlight' : ''}`}>✓</span>;
    if (val === 'partial') return <span className="rtc rtc-partial">~</span>;
    return <span className="rtc rtc-no">✗</span>;
  }

  return (
    <div className={`related-table-wrap ${visible ? 'is-visible' : ''}`}>
      <div className="related-table">
        {/* header */}
        <div className="rt-row rt-header">
          <div className="rt-cell rt-label-cell" />
          {tools.map((t, i) => (
            <div key={i} className={`rt-cell rt-head-cell ${isPeerReach(i) ? 'rt-peer' : ''}`}>{t}</div>
          ))}
        </div>
        {/* rows */}
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="rt-row"
            style={{ '--rt-delay': `${ri * 80}ms` } as React.CSSProperties}
          >
            <div className="rt-cell rt-label-cell">{row.label}</div>
            {row.values.map((v, ci) => (
              <div key={ci} className={`rt-cell rt-val-cell ${isPeerReach(ci) ? 'rt-peer' : ''}`}>
                <Cell val={v} highlight={isPeerReach(ci)} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Component parameter specs ────────────────────────────────────────────────
type ComponentKey = 'phone' | 'esp32' | 'lora';

const COMPONENT_SPECS: Record<ComponentKey, {
  name: string; subtitle: string; color: string; icon: string;
  params: { key: string; value: string }[];
}> = {
  phone: {
    name: 'Android Phone',
    subtitle: 'BLE Origin & Relay Node',
    color: CYAN,
    icon: '/icons/phone_3d.png',
    params: [
      { key: 'Radio',             value: 'BLE 5.0 LE Coded PHY' },
      { key: 'Per-hop range',     value: '~20 m (indoor tested)' },
      { key: 'Protocol role',     value: 'Message origin · BLE flood relay' },
      { key: 'Advertising',       value: 'Connectionless BLE advertisements' },
      { key: 'Dedup buffer',      value: 'seen_msg_ids ring buffer — 200 entries' },
      { key: 'Encryption',        value: 'Curve25519 ECDH + AES-128-GCM' },
      { key: 'Key exchange',      value: 'QR code out-of-band scan' },
      { key: 'Max packet size',   value: '250 B (42B header + 208B payload)' },
      { key: 'Serializer',        value: 'PacketSerializer.kt' },
      { key: 'Min Android',       value: 'API 31 (Android 12) for LE Coded PHY' },
    ],
  },
  esp32: {
    name: 'ESP32 Bridge',
    subtitle: 'BLE-to-LoRa Transparent Relay',
    color: GOLD,
    icon: '/icons/esp_3d.png',
    params: [
      { key: 'MCU',               value: 'ESP32-S3 · Xtensa LX7 dual-core 240 MHz' },
      { key: 'Radio A',           value: 'BLE 5.0 — NimBLE stack (LE Coded PHY)' },
      { key: 'Radio B',           value: 'SPI → Semtech SX1276 LoRa module' },
      { key: 'Protocol role',     value: 'Stateless BLE ↔ LoRa bridge' },
      { key: 'Session state',     value: 'None — pure relay, no storage' },
      { key: 'BLE range',         value: '~20 m per hop' },
      { key: 'Framework',         value: 'ESP-IDF' },
      { key: 'Power supply',      value: '3.3 V via USB or LiPo battery' },
      { key: 'Throughput',        value: 'Governed by LoRa duty cycle (1 %)' },
      { key: 'Gateway flag',      value: 'flags bit 3 = IS_GATEWAY (0x08)' },
    ],
  },
  lora: {
    name: 'LoRa Module',
    subtitle: 'Long-Range Inter-Cluster Bridge',
    color: PURPLE,
    icon: '/icons/lora_3d.png',
    params: [
      { key: 'Chip',              value: 'Semtech SX1276' },
      { key: 'Frequency',         value: '868 MHz (EU) / 915 MHz (US)' },
      { key: 'Modulation',        value: 'LoRa — Chirp Spread Spectrum (CSS)' },
      { key: 'Spreading factor',  value: 'SF=9 (default, configurable SF7–12)' },
      { key: 'Bandwidth',         value: '125 kHz' },
      { key: 'Coding rate',       value: '4/5' },
      { key: 'Sensitivity',       value: '−128 dBm' },
      { key: 'Range (LOS)',       value: 'Up to 3 km line-of-sight' },
      { key: 'Max payload',       value: '255 B (protocol caps at 250 B)' },
    ],
  },
};

// ─── Component modal ──────────────────────────────────────────────────────────
function ComponentModal({ which, onClose }: { which: ComponentKey; onClose: () => void }) {
  const spec = COMPONENT_SPECS[which];
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="comp-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="comp-modal-card"
        onClick={e => e.stopPropagation()}
        style={{ '--modal-accent': spec.color } as React.CSSProperties}
      >
        {/* Header */}
        <div className="comp-modal-header">
          <img src={spec.icon} alt={spec.name} className="comp-modal-icon" />
          <div className="comp-modal-title-group">
            <h3 className="comp-modal-name" style={{ color: spec.color }}>{spec.name}</h3>
          </div>
          <button className="comp-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Divider */}
        <div className="comp-modal-rule" style={{ background: spec.color }} />

        {/* Parameters */}
        <dl className="comp-modal-params">
          {spec.params.map((p, i) => (
            <div key={i} className="comp-modal-param-row"
              style={{ '--row-delay': `${i * 40}ms` } as React.CSSProperties}>
              <dt className="comp-modal-key">{p.key}</dt>
              <dd className="comp-modal-val">{p.value}</dd>
            </div>
          ))}
        </dl>

      </div>
    </div>
  );
}

// ─── Slide 8: Components (clickable cards) ────────────────────────────────────
function ComponentsCards({
  visible,
  onOpen,
}: {
  visible: boolean;
  onOpen: (which: ComponentKey) => void;
}) {
  const cards: { key: ComponentKey; img: string; title: string; role: string; spec: string }[] = [
    {
      key: 'phone',
      img: '/icons/phone_3d.png',
      title: 'ANDROID PHONE',
      role: 'Message origin & relay node',
      spec: 'BLE 5.0 · LE Coded PHY · 30m range',
    },
    {
      key: 'esp32',
      img: '/icons/esp_3d.png',
      title: 'ESP32 BRIDGE',
      role: 'BLE-to-LoRa relay node',
      spec: 'Dual radio · Stateless relay · Fixed infrastructure',
    },
    {
      key: 'lora',
      img: '/icons/lora_3d.png',
      title: 'LORA MODULE',
      role: 'Long-range inter-cluster bridge',
      spec: '868 MHz · 1–3 km range · SX1276',
    },
  ];

  return (
    <div className={`components-card-grid ${visible ? 'is-visible' : ''}`}>
      {cards.map(c => (
        <button
          key={c.key}
          type="button"
          className="components-column components-column-btn"
          onClick={() => onOpen(c.key)}
          aria-label={`View ${c.title} parameters`}
          style={{ '--card-accent': COMPONENT_SPECS[c.key].color } as React.CSSProperties}
        >
          <div className="icon-wrapper">
            <img src={c.img} alt={c.title} width="220" height="220" className="component-icon" />
          </div>
          <h3>{c.title}</h3>
          <p className="components-role">{c.role}</p>
        </button>
      ))}
    </div>
  );
}

// ─── Slide 9: System Architecture ────────────────────────────────────────────
// ── Flooding packet helper: glowing dot that moves along a path then fades ──
function FPkt({ path, t0, dur, color, r = 6 }: { path: string; t0: number; dur: number; color: string; r?: number }) {
  const b  = `${t0}s`;
  const ef = `${t0 + dur + 0.4}s`;
  return (
    <circle r={r} fill={color} opacity="0" filter="url(#pkt-glow)">
      <animate attributeName="opacity" begin={b}  dur="0.15s" fill="freeze" to="1" />
      <animateMotion         begin={b}  dur={`${dur}s`} fill="freeze" path={path} />
      <animate attributeName="opacity" begin={ef} dur="0.35s" fill="freeze" to="0" />
    </circle>
  );
}

function ArchitectureDiagram({ active }: { active: boolean }) {
  const PH = 56;
  const EH = 52;
  const LH = 52;
  // 0=PhoneA(sender), 1=PhoneC(L-bottom), 2=PhoneB(L-mid), 3=PhoneD(R-top), 4=PhoneF(recipient), 5=PhoneE(R-mid)
  const phones = [
    { cx: 68,  cy: 100 },
    { cx: 68,  cy: 220 },
    { cx: 126, cy: 160 },
    { cx: 754, cy: 100 },
    { cx: 754, cy: 220 },
    { cx: 812, cy: 160 },
  ];

  const [animKey,  setAnimKey]  = useState(0);
  const [playing,  setPlaying]  = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Reset when slide leaves view
  useEffect(() => { if (!active) setPlaying(false); }, [active]);

  // After animation group mounts/remounts, reset SVG clock to 0 so begin="Xs" works
  useEffect(() => {
    if (!playing) return;
    const svg = svgRef.current;
    if (!svg) return;
    try { svg.setCurrentTime(0); } catch {}
  }, [playing, animKey]);

  const handlePlay = () => {
    setPlaying(false);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setAnimKey(k => k + 1);
      setPlaying(true);
    }));
  };

  const G = '#22c55e'; // green = forwarded
  const R = '#ef4444'; // red   = dropped

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
    <svg ref={svgRef} className="arch-svg" viewBox="0 0 880 330" aria-hidden="true">
      <defs>
        <filter id="pkt-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* ── Cluster A ── */}
      {phones.slice(0, 3).map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r="34" stroke={CYAN} strokeWidth="0.7" fill="none" opacity="0.2" />
      ))}
      <line x1="96"  y1="108" x2="162" y2="150" stroke={CYAN} strokeWidth="1.2" opacity="0.45" strokeDasharray="4 4" />
      <line x1="96"  y1="212" x2="162" y2="170" stroke={CYAN} strokeWidth="1.2" opacity="0.45" strokeDasharray="4 4" />
      <line x1="154" y1="160" x2="178" y2="160" stroke={CYAN} strokeWidth="1.2" opacity="0.45" strokeDasharray="4 4" />

      {/* ESP32-A */}
      <image href="/icons/esp32.webp" x={208 - EH/2} y={160 - EH/2} width={EH} height={EH} />
      <text x="208" y="222" textAnchor="middle" fill={GOLD} fontSize="8" fontFamily="var(--font-mono,monospace)" opacity="0.75">ESP32</text>
      <line x1="234" y1="160" x2="252" y2="160" stroke={GOLD} strokeWidth="1.3" opacity="0.6" />

      {/* LoRa-A */}
      <image href="/icons/lora.webp" x={278 - LH/2} y={160 - LH/2} width={LH} height={LH} />
      <text x="278" y="222" textAnchor="middle" fill={PURPLE} fontSize="8" fontFamily="var(--font-mono,monospace)" opacity="0.75">LoRa</text>

      {/* LoRa radio link */}
      <line x1="304" y1="160" x2="576" y2="160" stroke={PURPLE} strokeWidth="1.5" strokeDasharray="8 6" opacity="0.6" />
      <text x="440" y="144" textAnchor="middle" fill={PURPLE} fontSize="9" opacity="0.65" fontFamily="var(--font-mono,monospace)" letterSpacing="0.08em">LoRa · 868 MHz · 1,500 m radius</text>

      {/* ── Cluster B ── */}
      <image href="/icons/lora.webp" x={602 - LH/2} y={160 - LH/2} width={LH} height={LH} />
      <text x="602" y="222" textAnchor="middle" fill={PURPLE} fontSize="8" fontFamily="var(--font-mono,monospace)" opacity="0.75">LoRa</text>
      <line x1="628" y1="160" x2="646" y2="160" stroke={GOLD} strokeWidth="1.3" opacity="0.6" />
      <image href="/icons/esp32.webp" x={672 - EH/2} y={160 - EH/2} width={EH} height={EH} />
      <text x="672" y="222" textAnchor="middle" fill={GOLD} fontSize="8" fontFamily="var(--font-mono,monospace)" opacity="0.75">ESP32</text>
      <line x1="698" y1="150" x2="726" y2="108" stroke={CYAN} strokeWidth="1.2" opacity="0.45" strokeDasharray="4 4" />
      <line x1="698" y1="170" x2="726" y2="212" stroke={CYAN} strokeWidth="1.2" opacity="0.45" strokeDasharray="4 4" />
      <line x1="698" y1="160" x2="726" y2="160" stroke={CYAN} strokeWidth="1.2" opacity="0.45" strokeDasharray="4 4" />
      {phones.slice(3).map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r="34" stroke={CYAN} strokeWidth="0.7" fill="none" opacity="0.2" />
      ))}

      {/* Phone images */}
      {phones.map((p, i) => (
        <image key={i} href="/icons/phone.webp" x={p.cx - PH/2} y={p.cy - PH/2} width={PH} height={PH} />
      ))}

      {/* Role labels */}
      <text x="68"  y="67"  textAnchor="middle" fill={GREEN}  fontSize="7.5" fontFamily="var(--font-mono,monospace)" opacity="0.8" letterSpacing="0.06em">SENDER</text>
      <text x="754" y="250" textAnchor="middle" fill={GREEN}  fontSize="7.5" fontFamily="var(--font-mono,monospace)" opacity="0.8" letterSpacing="0.06em">RECIPIENT</text>
      <text x="170" y="298" textAnchor="middle" fill={CYAN}   fontSize="9.5" fontFamily="var(--font-mono,monospace)" opacity="0.55" letterSpacing="0.1em">BLE CLUSTER A</text>
      <text x="706" y="298" textAnchor="middle" fill={CYAN}   fontSize="9.5" fontFamily="var(--font-mono,monospace)" opacity="0.55" letterSpacing="0.1em">BLE CLUSTER B</text>

      {/* ── Managed Flooding packets: only shown after Play is clicked ── */}
      {playing && (
        <g key={animKey}>
          {/* ── Phase 1: Phone A → Phone B (message origin) ── */}
          <FPkt path="M68,100 L126,160"   t0={0}    dur={3}   color={G} r={4} />

          {/* ── Phase 2: B floods — A & C drop, ESP32 forwards ── */}
          <FPkt path="M126,160 L68,100"   t0={3.3}  dur={2.5} color={R} r={3.5} />
          <FPkt path="M126,160 L68,220"   t0={3.3}  dur={2.5} color={R} r={3.5} />
          <FPkt path="M126,160 L208,160"  t0={3.3}  dur={2}   color={G} r={3.5} />

          {/* ── Phase 3: ESP32-A floods — phones drop, LoRa-A forwards ── */}
          <FPkt path="M208,160 L68,100"   t0={5.6}  dur={2.5} color={R} r={3.5} />
          <FPkt path="M208,160 L126,160"  t0={5.6}  dur={2}   color={R} r={3.5} />
          <FPkt path="M208,160 L68,220"   t0={5.6}  dur={2.5} color={R} r={3.5} />
          <FPkt path="M208,160 L278,160"  t0={5.6}  dur={1.5} color={G} r={3.5} />

          {/* ── Phase 4: LoRa-A — ESP back-direction drops, LoRa-B forwards ── */}
          <FPkt path="M278,160 L208,160"  t0={7.4}  dur={1.5} color={R} r={3.5} />
          <FPkt path="M278,160 L602,160"  t0={7.4}  dur={3}   color={G} r={3.5} />

          {/* ── Phase 5: LoRa-B → ESP32-B ── */}
          <FPkt path="M602,160 L672,160"  t0={10.7} dur={1.5} color={G} r={3.5} />

          {/* ── Phase 6: ESP32-B floods — D & E drop, F is recipient ── */}
          <FPkt path="M672,160 L754,100"  t0={12.5} dur={2.5} color={R} r={3.5} />
          <FPkt path="M672,160 L812,160"  t0={12.5} dur={2}   color={R} r={3.5} />
          <FPkt path="M672,160 L754,220"  t0={12.5} dur={2.5} color={G} r={4} />

          {/* ── Phase 7: ACK travels all the way back ── */}
          <FPkt path="M754,220 L672,160"  t0={16}   dur={2}   color={G} r={3.5} />
          <FPkt path="M672,160 L602,160"  t0={18.3} dur={1.5} color={G} r={3.5} />
          <FPkt path="M602,160 L278,160"  t0={20.1} dur={3}   color={G} r={3.5} />
          <FPkt path="M278,160 L208,160"  t0={23.4} dur={1.5} color={G} r={3.5} />
          <FPkt path="M208,160 L68,100"   t0={25.2} dur={2.5} color={G} r={4} />
        </g>
      )}
    </svg>

    {/* Play/Replay button — always clickable */}
    <button
      onClick={handlePlay}
      style={{
        marginTop: 6,
        padding: playing ? '5px 16px' : '6px 20px',
        background: playing ? 'transparent' : 'rgba(34,197,94,0.15)',
        border: playing ? '1px solid rgba(34,197,94,0.4)' : '1px solid #22c55e',
        borderRadius: 20,
        color: playing ? 'rgba(34,197,94,0.6)' : '#22c55e',
        fontSize: playing ? 10 : 12,
        fontFamily: 'var(--font-mono, monospace)',
        letterSpacing: '0.08em',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {playing ? '↺ REPLAY' : '▶ PLAY'}
    </button>
    </div>
  );
}

// ─── Slide 10: Packet Format (exact per Table 5.1 / PacketSerializer.kt) ──────
type FieldKey =
  | 'version' | 'type' | 'msgId' | 'senderId' | 'receiverId'
  | 'ttl' | 'hopCount' | 'timestamp' | 'flags' | 'payloadLen'
  | 'authTag' | 'payload';

interface FieldDetail {
  name: string; offset: string; size: string; color: string; desc: string;
  entries?: { code: string; label: string }[];
  bits?:    { mask: string;  name: string;  desc: string }[];
}

const FIELD_DETAILS: Record<FieldKey, FieldDetail> = {
  version: {
    name: 'version', offset: 'B0', size: '1 byte', color: WHITE,
    desc: 'Protocol version identifier. Fixed at 0x01 in this implementation. Reserved for future backward-compatible upgrades — a parser receiving an unknown version can safely drop the packet.',
  },
  type: {
    name: 'type', offset: 'B1', size: '1 byte', color: WHITE,
    desc: 'Message type discriminator. Controls routing behavior, encryption requirements, and UI rendering on the receiver.',
    entries: [
      { code: '0x01', label: 'HELLO — node join beacon (plaintext, includes public key)' },
      { code: '0x02', label: 'CHAT — encrypted text message (AES-128-GCM)' },
      { code: '0x03', label: 'ACK — delivery acknowledgement (plaintext)' },
      { code: '0x04', label: 'LEAVE — graceful node departure notice' },
      { code: '0x05', label: 'REACTION — encrypted emoji reaction to a CHAT' },
      { code: '0x06', label: 'DELETE — retract a previously sent CHAT' },
    ],
  },
  msgId: {
    name: 'msgId', offset: 'B2–B9', size: '8 bytes', color: WHITE,
    desc: 'Primary deduplication key — 8 cryptographically random bytes generated at the origin. Every relay checks its seen_msg_ids ring buffer (200 entries) before forwarding. If the msgId is already present the packet is dropped, preventing loops and duplicates.',
  },
  senderId: {
    name: 'senderId', offset: 'B10–B13', size: '4 bytes', color: WHITE,
    desc: 'SHA-256(publicKey)[0:4] — a 4-byte fingerprint of the sender\'s Curve25519 public key. Identifies the originator for ACK routing without transmitting the full 32-byte key over the air, preserving pseudo-anonymity.',
  },
  receiverId: {
    name: 'receiverId', offset: 'B14–B17', size: '4 bytes', color: WHITE,
    desc: 'Target node identifier (4-byte key fingerprint), or the broadcast constant 0xFFFFFFFF for group messages. Relay nodes forward regardless of this field — only the intended recipient holds the matching private key and can decrypt the payload.',
  },
  ttl: {
    name: 'ttl', offset: 'B23', size: '1 byte', color: WHITE,
    desc: 'Changeable by relay — NOT covered by AAD. Time-to-Live hop budget. Set to 5 at the origin device. Each relay decrements TTL by 1 before forwarding. When TTL reaches 0 the packet is silently dropped, preventing infinite routing loops.',
  },
  hopCount: {
    name: 'hopCount', offset: 'B24', size: '1 byte', color: WHITE,
    desc: 'Changeable by relay — NOT covered by AAD. Hop counter. Starts at 0 at the origin. Incremented by every relay node. Lets the destination measure path length and lets the UI display delivery distance (e.g. "delivered in 3 hops").',
  },
  timestamp: {
    name: 'timestamp', offset: 'B20–B23', size: '4 bytes', color: WHITE,
    desc: 'Unix epoch seconds encoded as a big-endian 32-bit integer. Set at the origin device at send time. Used for message ordering in the chat UI and for freshness filtering — receivers can discard packets that are unreasonably old.',
  },
  flags: {
    name: 'flags', offset: 'B24', size: '1 byte', color: WHITE,
    desc: 'Bitmask controlling per-packet routing behavior.',
    bits: [
      { mask: 'bit 0  (0x01)', name: 'LORA_ELIGIBLE', desc: 'Packet may be forwarded over a LoRa radio link' },
      { mask: 'bit 3  (0x08)', name: 'IS_GATEWAY',    desc: 'Set by ESP32 bridge nodes to identify themselves as LoRa gateways' },
      { mask: 'bits 1–2, 4–7', name: 'RESERVED',      desc: 'Must be 0 — reserved for future protocol extensions' },
    ],
  },
  payloadLen: {
    name: 'payloadLen', offset: 'B25', size: '1 byte', color: WHITE,
    desc: 'Changeable by relay — NOT covered by AAD. Length of the payload in bytes (0–208). Allows the parser to read exactly the right number of bytes after the 42-byte fixed header without a frame delimiter. Relays update this field when necessary.',
  },
  authTag: {
    name: 'authTag', offset: 'B26–B41', size: '16 bytes', color: GOLD,
    desc: 'AES-128-GCM authentication tag — 16 bytes that prove the payload was encrypted with the correct session key and has not been tampered with. For CHAT, REACTION, DELETE: the real GCM tag. For HELLO, ACK, LEAVE: 16 zero bytes (0x00 × 16) since those messages are plaintext.',
  },
  payload: {
    name: 'payload', offset: 'B42–B249', size: '0–208 bytes', color: CYAN,
    desc: 'For CHAT, REACTION, DELETE: AES-128-GCM ciphertext encrypted with the session key derived via Curve25519 ECDH + HKDF-SHA256. Relay nodes see only an opaque byte blob — zero plaintext exposure at intermediate hops. For HELLO/ACK/LEAVE: plaintext data such as node metadata or the Curve25519 public key (for HELLO).',
  },
};

// ─── Field detail bottom-sheet ────────────────────────────────────────────────
function FieldDetailPanel({ detail, onClose }: { detail: FieldDetail; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="pf-detail-sheet" style={{ '--pf-accent': detail.color } as React.CSSProperties}>
      <div className="pf-detail-card">
        <div className="pf-detail-header">
          <code className="pf-detail-name" style={{ color: detail.color }}>{detail.name}</code>
          <span className="pf-detail-meta">{detail.offset} · {detail.size}</span>
          <button className="pf-detail-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="pf-detail-desc">{detail.desc}</p>
        {detail.entries && (
          <div className="pf-detail-entries">
            {detail.entries.map((e, i) => (
              <div key={i} className="pf-detail-entry">
                <code className="pf-detail-code" style={{ color: detail.color }}>{e.code}</code>
                <span>{e.label}</span>
              </div>
            ))}
          </div>
        )}
        {detail.bits && (
          <div className="pf-detail-entries">
            {detail.bits.map((b, i) => (
              <div key={i} className="pf-detail-entry">
                <code className="pf-detail-code" style={{ color: GOLD }}>{b.mask}</code>
                <span>
                  <strong style={{ color: 'var(--intro-text)' }}>{b.name}</strong>
                  {' '}— {b.desc}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Packet diagram ───────────────────────────────────────────────────────────
function PacketFormatDiagram({ active }: { active: boolean }) {
  const [selectedField, setSelectedField] = useState<FieldKey | null>(null);
  const [hoveredField,  setHoveredField]  = useState<FieldKey | null>(null);

  // SVG geometry — larger bar than before
  const VW = 960, MX = 16, BY = 92, BH = 92, R = 9, GAP = 6;

  // Field order matches thesis Figure 5.1:
  // AAD(23B) = version+type+msgId+senderId+receiverId+timestamp+flags
  // Mutable-by-relay(3B) = ttl+hopCount+payloadLen
  const hf: { id: FieldKey; bytes: string; w: number }[] = [
    { id: 'version',    bytes: '1B', w: 30 },
    { id: 'type',       bytes: '1B', w: 30 },
    { id: 'msgId',      bytes: '8B', w: 70 },
    { id: 'senderId',   bytes: '4B', w: 48 },
    { id: 'receiverId', bytes: '4B', w: 48 },
    { id: 'timestamp',  bytes: '4B', w: 48 },
    { id: 'flags',      bytes: '1B', w: 30 },
    { id: 'ttl',        bytes: '1B', w: 30 },
    { id: 'hopCount',   bytes: '1B', w: 30 },
    { id: 'payloadLen', bytes: '1B', w: 30 },
  ];
  const HW = hf.reduce((s, f) => s + f.w, 0); // 394

  const AX = MX + HW + GAP;   // authTag x
  const AW = 96;
  const PX = AX + AW + GAP;   // payload x
  const PW = VW - PX - MX;
  const BB = BY + BH;

  const fxs: number[] = [];
  let runX = MX;
  hf.forEach(f => { fxs.push(runX); runX += f.w; });

  // Byte offsets for new field order: v(1)+t(1)+msgId(8)+sId(4)+rId(4)+ts(4)+flags(1)+ttl(1)+hc(1)+pLen(1)=26
  // B0=v B2=msgId B10=sId B14=rId B18=ts B22=flags B23=ttl B24=hc B25=pLen B26=authTag B42=payload
  const ticks: { bx: number; label: string }[] = [
    { bx: MX,           label: 'B0'  },
    { bx: MX + 60,      label: 'B2'  },
    { bx: MX + 130,     label: 'B10' },
    { bx: MX + 178,     label: 'B14' },
    { bx: MX + 226,     label: 'B18' },
    { bx: MX + 274,     label: 'B22' },
    { bx: MX + 304,     label: 'B23' },
    { bx: MX + 334,     label: 'B24' },
    { bx: MX + 364,     label: 'B25' },
    { bx: AX,           label: 'B26' },
    { bx: PX,           label: 'B42' },
  ];

  // AAD spans fields 0-6 (version..flags) = 23 bytes
  // Mutable-by-relay spans fields 7-9 (ttl, hopCount, payloadLen) = 3 bytes
  const AAD_END_X = MX + 30+30+70+48+48+48+30; // = MX + 304 = 320
  const MUT_END_X = MX + HW;                    // = MX + 394 = 410

  const isSel = (id: FieldKey) => selectedField === id;
  const isHov = (id: FieldKey) => hoveredField === id && selectedField !== id;

  const hFill = (id: FieldKey) =>
    isSel(id) ? 'rgba(0,188,212,0.15)'  :
    isHov(id) ? 'var(--intro-border-soft)' :
                'var(--intro-surface)';

  const toggle = (id: FieldKey) => setSelectedField(p => p === id ? null : id);

  return (
    <div className={`packet-format-wrap ${active ? 'is-active' : ''}`}>
      <svg
        className="packet-svg"
        viewBox={`0 0 ${VW} 360`}
        style={{ cursor: 'default', userSelect: 'none' }}
      >
        <defs>
          {/* clip fills to rounded corners */}
          <clipPath id="hdr-clip"><rect x={MX} y={BY} width={HW}  height={BH} rx={R} /></clipPath>
          <clipPath id="ath-clip"><rect x={AX} y={BY} width={AW}  height={BH} rx={R} /></clipPath>
          <clipPath id="pay-clip"><rect x={PX} y={BY} width={PW}  height={BH} rx={R} /></clipPath>
        </defs>

        {/* ── Header field fill blocks (interactive, clipped) ── */}
        <g clipPath="url(#hdr-clip)">
          {hf.map((f, i) => (
            <rect
              key={i}
              x={fxs[i]} y={BY} width={f.w} height={BH}
              style={{ fill: hFill(f.id), transition: 'fill 130ms ease', cursor: 'pointer' }}
              onClick={() => toggle(f.id)}
              onMouseEnter={() => setHoveredField(f.id)}
              onMouseLeave={() => setHoveredField(null)}
            />
          ))}
        </g>

        {/* Selected cyan top-bar per header field */}
        {hf.map((f, i) =>
          isSel(f.id) ? (
            <rect key={i} x={fxs[i]} y={BY} width={f.w} height={4}
              fill={CYAN} style={{ pointerEvents: 'none' }} />
          ) : null
        )}

        {/* Header outline */}
        <rect x={MX} y={BY} width={HW} height={BH} rx={R}
          fill="none" stroke="var(--intro-border)" strokeWidth="1"
          style={{ pointerEvents: 'none' }} />

        {/* Dividers + field labels */}
        {hf.map((f, i) => {
          const fx = fxs[i];
          const cx = fx + f.w / 2;
          const cy = BY + BH / 2;
          const narrow = f.w <= 48;
          const sel = isSel(f.id);
          return (
            <g key={i} className={`packet-field pf-${i}`} style={{ pointerEvents: 'none' }}>
              {i > 0 && (
                <line x1={fx} y1={BY+7} x2={fx} y2={BB-7}
                  stroke="var(--intro-border-soft)" strokeWidth="0.8" />
              )}
              {narrow ? (
                <>
                  <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
                    fill={sel ? CYAN : 'var(--intro-text-dim)'}
                    fontSize="10" fontFamily="var(--font-mono,monospace)"
                    transform={`rotate(-90,${cx},${cy - 4})`}>
                    {f.id}
                  </text>
                  <text x={cx} y={BB - 8} textAnchor="middle"
                    fill={sel ? CYAN : 'var(--intro-text-faint)'}
                    fontSize="8.5" fontFamily="var(--font-mono,monospace)">
                    {f.bytes}
                  </text>
                </>
              ) : (
                <>
                  <text x={cx} y={cy-7} textAnchor="middle"
                    fill={sel ? CYAN : 'var(--intro-text)'}
                    fontSize="11" fontFamily="var(--font-mono,monospace)">
                    {f.id}
                  </text>
                  <text x={cx} y={cy+11} textAnchor="middle"
                    fill="var(--intro-text-faint)" fontSize="9.5"
                    fontFamily="var(--font-mono,monospace)">
                    {f.bytes}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* ── authTag (interactive) ── */}
        <g className="packet-field pf-10">
          <g clipPath="url(#ath-clip)">
            <rect x={AX} y={BY} width={AW} height={BH}
              style={{
                fill: isSel('authTag') ? 'rgba(240,165,0,0.22)' :
                      isHov('authTag') ? 'rgba(240,165,0,0.15)' : 'rgba(240,165,0,0.08)',
                transition: 'fill 130ms ease', cursor: 'pointer',
              }}
              onClick={() => toggle('authTag')}
              onMouseEnter={() => setHoveredField('authTag')}
              onMouseLeave={() => setHoveredField(null)}
            />
            {isSel('authTag') && (
              <rect x={AX} y={BY} width={AW} height={4} fill={GOLD}
                style={{ pointerEvents: 'none' }} />
            )}
          </g>
          <rect x={AX} y={BY} width={AW} height={BH} rx={R}
            fill="none"
            stroke={isSel('authTag') ? GOLD : 'rgba(240,165,0,0.55)'}
            strokeWidth={isSel('authTag') ? 1.8 : 1.2}
            style={{ pointerEvents: 'none', transition: 'stroke 130ms ease' }} />
          <text x={AX+AW/2} y={BY+BH/2-9} textAnchor="middle"
            fill={GOLD} fontSize="11" fontFamily="var(--font-mono,monospace)"
            style={{ pointerEvents: 'none' }}>authTag</text>
          <text x={AX+AW/2} y={BY+BH/2+10} textAnchor="middle"
            fill={GOLD} fontSize="9" fontFamily="var(--font-mono,monospace)" opacity="0.65"
            style={{ pointerEvents: 'none' }}>16B · GCM</text>
        </g>

        {/* ── payload (interactive) ── */}
        <g className="packet-field pf-11">
          <g clipPath="url(#pay-clip)">
            <rect x={PX} y={BY} width={PW} height={BH}
              style={{
                fill: isSel('payload') ? 'rgba(0,188,212,0.18)' :
                      isHov('payload') ? 'rgba(0,188,212,0.12)' : 'rgba(0,188,212,0.07)',
                transition: 'fill 130ms ease', cursor: 'pointer',
              }}
              onClick={() => toggle('payload')}
              onMouseEnter={() => setHoveredField('payload')}
              onMouseLeave={() => setHoveredField(null)}
            />
            {isSel('payload') && (
              <rect x={PX} y={BY} width={PW} height={4} fill={CYAN}
                style={{ pointerEvents: 'none' }} />
            )}
          </g>
          <rect x={PX} y={BY} width={PW} height={BH} rx={R}
            fill="none"
            stroke={isSel('payload') ? CYAN : 'rgba(0,188,212,0.5)'}
            strokeWidth={isSel('payload') ? 1.8 : 1.2}
            style={{ pointerEvents: 'none', transition: 'stroke 130ms ease' }} />
          <text x={PX+PW/2} y={BY+BH/2-16} textAnchor="middle"
            fill={CYAN} fontSize="12" fontFamily="var(--font-mono,monospace)"
            style={{ pointerEvents: 'none' }}>payload</text>
          <text x={PX+PW/2} y={BY+BH/2+2} textAnchor="middle"
            fill={CYAN} fontSize="9.5" fontFamily="var(--font-mono,monospace)" opacity="0.75"
            style={{ pointerEvents: 'none' }}>0 – 208 bytes</text>
          <text x={PX+PW/2} y={BY+BH/2+19} textAnchor="middle"
            fill={CYAN} fontSize="9" fontFamily="var(--font-mono,monospace)" opacity="0.48"
            style={{ pointerEvents: 'none' }}>
            ciphertext (CHAT) · plaintext (HELLO / ACK / LEAVE)
          </text>
        </g>

        {/* ── Above: header (42B) + payload labels ── */}
        <g style={{ pointerEvents: 'none' }}>
          {/* HEADER · 42 B bracket (fields + authTag) */}
          <line x1={MX}      y1={BY-22} x2={AX+AW} y2={BY-22} stroke="var(--intro-border)" strokeWidth="0.8" />
          <line x1={MX}      y1={BY-22} x2={MX}    y2={BY-12} stroke="var(--intro-border)" strokeWidth="0.8" />
          <line x1={AX+AW}   y1={BY-22} x2={AX+AW} y2={BY-12} stroke="var(--intro-border)" strokeWidth="0.8" />
          <text x={(MX + AX + AW) / 2} y={BY-26} textAnchor="middle"
            fill="var(--intro-text-faint)" fontSize="8.5" fontFamily="var(--font-mono,monospace)" letterSpacing="0.08em">
            HEADER · 42 B
          </text>
          {/* PAYLOAD bracket */}
          <line x1={PX}    y1={BY-22} x2={PX+PW} y2={BY-22} stroke={CYAN} strokeWidth="0.8" opacity="0.35" />
          <line x1={PX}    y1={BY-22} x2={PX}    y2={BY-12} stroke={CYAN} strokeWidth="0.8" opacity="0.35" />
          <line x1={PX+PW} y1={BY-22} x2={PX+PW} y2={BY-12} stroke={CYAN} strokeWidth="0.8" opacity="0.35" />
          <text x={PX + PW/2} y={BY-26} textAnchor="middle"
            fill={CYAN} fontSize="8.5" fontFamily="var(--font-mono,monospace)" letterSpacing="0.08em" opacity="0.55">
            AES-128-GCM CIPHERTEXT
          </text>
        </g>

        {/* ── Below bar: AAD + Mutable-by-relay brackets ── */}
        <g style={{ pointerEvents: 'none' }}>
          {/* AAD bracket */}
          <line x1={MX}        y1={BB+8}  x2={MX}        y2={BB+22} stroke={CYAN} strokeWidth="0.9" opacity="0.4" />
          <line x1={MX}        y1={BB+22} x2={AAD_END_X} y2={BB+22} stroke={CYAN} strokeWidth="0.9" opacity="0.4" />
          <line x1={AAD_END_X} y1={BB+8}  x2={AAD_END_X} y2={BB+22} stroke={CYAN} strokeWidth="0.9" opacity="0.4" />
          <text x={(MX + AAD_END_X) / 2} y={BB+36} textAnchor="middle"
            fill={CYAN} fontSize="8.5" fontFamily="var(--font-mono,monospace)" letterSpacing="0.06em" opacity="0.65">
            AAD (Authenticated Data) · 23 B
          </text>

          {/* Changeable-by-relay bracket */}
          <line x1={AAD_END_X} y1={BB+8}  x2={AAD_END_X} y2={BB+22} stroke="var(--intro-border)" strokeWidth="0.9" />
          <line x1={AAD_END_X} y1={BB+22} x2={MUT_END_X} y2={BB+22} stroke="var(--intro-border)" strokeWidth="0.9" />
          <line x1={MUT_END_X} y1={BB+8}  x2={MUT_END_X} y2={BB+22} stroke="var(--intro-border)" strokeWidth="0.9" />
          <text x={(AAD_END_X + MUT_END_X) / 2} y={BB+36} textAnchor="middle"
            fill="var(--intro-text-muted)" fontSize="8" fontFamily="var(--font-mono,monospace)" letterSpacing="0.05em">
            Changeable by relay · 3 B
          </text>

          {/* authTag bracket — label offset lower to avoid text overlap with "Changeable by relay" */}
          <line x1={AX}    y1={BB+8}  x2={AX}    y2={BB+22} stroke={GOLD} strokeWidth="0.9" opacity="0.45" />
          <line x1={AX}    y1={BB+22} x2={AX+AW} y2={BB+22} stroke={GOLD} strokeWidth="0.9" opacity="0.45" />
          <line x1={AX+AW} y1={BB+8}  x2={AX+AW} y2={BB+22} stroke={GOLD} strokeWidth="0.9" opacity="0.45" />
          <text x={AX+AW/2} y={BB+52} textAnchor="middle"
            fill={GOLD} fontSize="8" fontFamily="var(--font-mono,monospace)" opacity="0.6" letterSpacing="0.05em">
            authTag · 16 B · AES-GCM
          </text>
        </g>

        {/* ── Byte offset ticks ── */}
        {ticks.map((t, i) => (
          <g key={i} style={{ pointerEvents: 'none' }}>
            <line x1={t.bx} y1={BB+60} x2={t.bx} y2={BB+70} stroke="var(--intro-border-soft)" strokeWidth="0.7" />
            <text x={t.bx} y={BB+82} textAnchor="middle"
              fill="var(--intro-text-dimmer)" fontSize="8" fontFamily="var(--font-mono,monospace)">
              {t.label}
            </text>
          </g>
        ))}

        {/* Note: 250 B total packet design */}
        <text x={VW/2} y={BB+102} textAnchor="middle"
          fill="var(--intro-text-faint)" fontSize="10"
          fontFamily="var(--font-mono,monospace)" letterSpacing="0.06em"
          style={{ pointerEvents: 'none' }}>
          Our packet design is 250 bytes total
        </text>

        {!selectedField && (
          <text x={VW/2} y={BB+118} textAnchor="middle"
            fill="var(--intro-text-dimmer)" fontSize="9"
            fontFamily="var(--font-mono,monospace)" letterSpacing="0.12em"
            className="pf-click-hint-svg"
            style={{ pointerEvents: 'none' }}>
          </text>
        )}
      </svg>

      {/* Floating detail panel */}
      {selectedField && (
        <FieldDetailPanel
          detail={FIELD_DETAILS[selectedField]}
          onClose={() => setSelectedField(null)}
        />
      )}
    </div>
  );
}

// ─── Result Image Lightbox ────────────────────────────────────────────────
interface ResultImage {
  id: string;
  path: string;
  title: string;
  caption: string;
}

const RESULT_IMAGES: ResultImage[] = [
  {
    id: 'lora-range-1',
    path: '/results/distance-measurement-1.png',
    title: 'LoRa Range Test 1',
    caption: ''
  },
  {
    id: 'lora-range-2',
    path: '/results/distance-measurement-2.png',
    title: 'LoRa Range Test 2',
    caption: ''
  },
];

function ImageLightbox({ image, onClose }: { image: ResultImage; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="lightbox-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="lightbox-container">
        <button className="lightbox-close" onClick={onClose} aria-label="Close">✕</button>
        
        <div className="lightbox-content">
          <img src={image.path} alt={image.title} className="lightbox-image" />
          <div className="lightbox-caption">
            <h3>{image.title}</h3>
            <p>{image.caption}</p>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Slide 16: Key Results (image gallery) ───────────────────────────────────
function NumbersSlide({ visibleCount }: { visibleCount: number }) {
  const [selectedImage, setSelectedImage] = useState<ResultImage | null>(null);

  return (
    <div className="numbers-grid-wrap">
      <div className="results-gallery">
        {RESULT_IMAGES.map((img, i) => (
          <button
            key={img.id}
            className={`results-card ${visibleCount > i ? 'is-visible' : ''}`}
            onClick={() => setSelectedImage(img)}
            style={{ '--ng-delay': `${i * 160}ms` } as React.CSSProperties}
            aria-label={`View ${img.title}`}
          >
            <div className="results-card-image">
              <img src={img.path} alt={img.title} loading="lazy" />
              <div className="results-card-overlay">
                <span className="results-expand-icon">↗</span>
              </div>
            </div>
            <div className="results-card-label">{img.title}</div>
          </button>
        ))}
      </div>

      {/* This renders the lightbox directly at the bottom of <body> */}
      {selectedImage && createPortal(
        <ImageLightbox image={selectedImage} onClose={() => setSelectedImage(null)} />,
        document.body
      )}
    </div>
  );
}

// ─── Slide 12: Security overview (unchanged visuals) ─────────────────────────
function AndroidPhoneIcon({ compact = false }: { compact?: boolean }) {
  return (
    <svg className={compact ? 'component-icon compact' : 'component-icon'} viewBox="0 0 220 220" aria-hidden="true">
      <defs>
        <linearGradient id="phoneBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1b1f29" />
          <stop offset="100%" stopColor="#0c1017" />
        </linearGradient>
        <linearGradient id="phoneScreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0e1320" />
          <stop offset="100%" stopColor="#06090f" />
        </linearGradient>
        <linearGradient id="phoneReflect" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="phoneGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="110" cy="188" rx="52" ry="14" fill="#000000" opacity="0.26" />
      <path d="M72 46l66-14 10 14-66 14z" fill="#212632" opacity="0.75" />
      <path d="M72 46v130l10 14V60z" fill="#151a24" />
      <path d="M82 60l66-14v130l-66 14z" fill="url(#phoneBody)" />
      <path d="M88 66l54-11v114l-54 11z" fill="url(#phoneScreen)" />
      <path d="M92 70l32-7v42l-32 7z" fill="url(#phoneReflect)" />
      <circle cx="140" cy="52" r="2.1" fill="#8a94a6" />
      <path d="M80 64l2 110" stroke={CYAN} strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
      <path d="M146 50l2 110" stroke={CYAN} strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
      <path d="M66 74c-16 10-16 36 0 46" stroke={CYAN} strokeWidth="1.6" fill="none" opacity="0.42" filter="url(#phoneGlow)" />
      <path d="M58 69c-24 17-24 50 0 67" stroke={CYAN} strokeWidth="1.4" fill="none" opacity="0.3" filter="url(#phoneGlow)" />
      <path d="M160 56c16 10 16 36 0 46" stroke={CYAN} strokeWidth="1.6" fill="none" opacity="0.42" filter="url(#phoneGlow)" />
      <path d="M168 51c24 17 24 50 0 67" stroke={CYAN} strokeWidth="1.4" fill="none" opacity="0.3" filter="url(#phoneGlow)" />
    </svg>
  );
}

function EncryptionFlowAnimation({ replayKey }: { replayKey: number }) {
  return (
    <div className="crypto-flow" key={replayKey}>
      <svg className="crypto-scene" viewBox="0 0 980 340" aria-hidden="true">
        <line x1="162" y1="150" x2="260" y2="150" stroke="var(--intro-text-faint)" strokeWidth="1.2" />
        <line x1="320" y1="150" x2="420" y2="150" stroke="var(--intro-text-faint)" strokeWidth="1.2" />
        <line x1="480" y1="150" x2="580" y2="150" stroke="var(--intro-text-faint)" strokeWidth="1.2" />
        <line x1="640" y1="150" x2="804" y2="150" stroke="var(--intro-text-faint)" strokeWidth="1.2" />
        <g transform="translate(70 72)"><AndroidPhoneIcon compact /></g>
        <g transform="translate(780 72)"><AndroidPhoneIcon compact /></g>
        {[292, 452, 612].map((x, idx) => (
          <g key={x}>
            <rect x={x} y={98} width="44" height="84" rx="10" fill="var(--intro-surface)" stroke="var(--intro-border)" strokeWidth="1.6" />
            <circle cx={x + 22} cy={170} r="3" fill="var(--intro-text-dim)" />
            <g className={`crypto-no-read r${idx + 1}`}>
              <circle cx={x + 22} cy={76} r="13" fill="var(--intro-bg)" stroke="var(--intro-border)" strokeWidth="1" />
              <path d={`M${x + 13} 76h18`} stroke="var(--intro-text-dim)" strokeWidth="1.2" />
              <path d={`M${x + 15} 70c2-2 4-3 7-3s5 1 7 3`} stroke="var(--intro-text-muted)" strokeWidth="1" fill="none" />
            </g>
          </g>
        ))}
        <g className="crypto-envelope-open">
          <rect x="116" y="54" width="34" height="24" rx="3" fill={WHITE} opacity="0.9" />
          <path d="M116 56l17 11 17-11" stroke="#0f121a" strokeWidth="1.5" fill="none" />
        </g>
        <g className="crypto-lock-box">
          <rect x="0" y="0" width="34" height="24" rx="3" fill={GOLD} />
          <path d="M0 2l17 10 17-10" stroke="#1a1f28" strokeWidth="1.5" fill="none" opacity="0.85" />
          <rect x="12" y="-12" width="10" height="10" rx="2" fill="none" stroke={WHITE} strokeWidth="1.6" />
          <path d="M14 -12v-4c0-3 2-5 5-5s5 2 5 5v4" fill="none" stroke={WHITE} strokeWidth="1.6" />
        </g>
        <g className="crypto-recipient-unlock">
          <circle cx="834" cy="86" r="18" fill="none" stroke={GREEN} strokeWidth="2" />
          <path d="M826 87l6 6 10-12" stroke={GREEN} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g className="crypto-recipient-open">
          <rect x="820" y="52" width="34" height="24" rx="3" fill={WHITE} opacity="0.95" />
          <path d="M820 54l17 11 17-11" stroke="#0f121a" strokeWidth="1.5" fill="none" />
        </g>
      </svg>
      <div className="crypto-lines">
        <p className="line1">QR key exchange — keys never cross the mesh</p>
      </div>
    </div>
  );
}

// ─── Slide 13: Security Deep Dive ────────────────────────────────────────────
function SecurityDeepDiveAnimation({ replayKey }: { replayKey: number }) {
  const [cycleKey, setCycleKey] = useState(0);
  useEffect(() => {
    setCycleKey(0);
    const id = setInterval(() => setCycleKey(k => k + 1), 8000);
    return () => clearInterval(id);
  }, [replayKey]);

  return (
    <div className="sec-deep-wrap" key={replayKey}>

      {/* ── Key Exchange flow ── */}
      <div className="sec-deep-row">
        <svg className="sec-deep-svg" viewBox="0 0 820 180" aria-hidden="true">
          {/* Phone A */}
          <rect x="40" y="50" rx="10" ry="10" width="56" height="96" fill="none" stroke={WHITE} strokeWidth="1.6" opacity="0.85" />
          <circle cx="68" cy="136" r="3" fill={WHITE} opacity="0.6" />
          {/* Phone B */}
          <rect x="724" y="50" rx="10" ry="10" width="56" height="96" fill="none" stroke={WHITE} strokeWidth="1.6" opacity="0.85" />
          <circle cx="752" cy="136" r="3" fill={WHITE} opacity="0.6" />

          {/* QR codes on phones */}
          <rect x="48" y="58" width="40" height="40" rx="3" fill={CYAN} opacity="0.12" stroke={CYAN} strokeWidth="0.8" />
          <text x="68" y="82" textAnchor="middle" fill={CYAN} fontSize="18" opacity="0.6">⠿</text>
          <rect x="732" y="58" width="40" height="40" rx="3" fill={CYAN} opacity="0.12" stroke={CYAN} strokeWidth="0.8" />
          <text x="752" y="82" textAnchor="middle" fill={CYAN} fontSize="18" opacity="0.6">⠿</text>

          {/* ECDH derivation boxes */}
          <rect x="200" y="60" width="110" height="56" rx="8" fill="rgba(0,188,212,0.07)" stroke={CYAN} strokeWidth="1.2" className="sdp-box b1" />
          <text x="255" y="83" textAnchor="middle" fill={CYAN} fontSize="10" fontFamily="var(--font-mono,monospace)">Curve25519</text>
          <text x="255" y="99" textAnchor="middle" fill={CYAN} fontSize="9" opacity="0.6" fontFamily="var(--font-mono,monospace)">ECDH</text>

          <rect x="355" y="60" width="110" height="56" rx="8" fill="rgba(240,165,0,0.07)" stroke={GOLD} strokeWidth="1.2" className="sdp-box b2" />
          <text x="410" y="83" textAnchor="middle" fill={GOLD} fontSize="10" fontFamily="var(--font-mono,monospace)">HKDF</text>
          <text x="410" y="99" textAnchor="middle" fill={GOLD} fontSize="9" opacity="0.6" fontFamily="var(--font-mono,monospace)">SHA-256</text>

          <rect x="510" y="60" width="110" height="56" rx="8" fill="rgba(34,197,94,0.07)" stroke={GREEN} strokeWidth="1.2" className="sdp-box b3" />
          <text x="565" y="83" textAnchor="middle" fill={GREEN} fontSize="10" fontFamily="var(--font-mono,monospace)">AES-128</text>
          <text x="565" y="99" textAnchor="middle" fill={GREEN} fontSize="9" opacity="0.6" fontFamily="var(--font-mono,monospace)">GCM</text>

          {/* Arrows */}
          <line x1="96" y1="98" x2="200" y2="88" stroke="var(--intro-border)" strokeWidth="1" />
          <line x1="310" y1="88" x2="355" y2="88" stroke="var(--intro-border)" strokeWidth="1" />
          <line x1="465" y1="88" x2="510" y2="88" stroke="var(--intro-border)" strokeWidth="1" />
          <line x1="620" y1="88" x2="724" y2="98" stroke="var(--intro-border)" strokeWidth="1" />

          {/* Message + ACK on a shared 8s cycle key so they never overlap */}
          <g key={cycleKey}>
            {/* Message → forward (gold): plays 0→3.2s then fades */}
            <circle r="5" fill={GOLD} className="sdp-keydot" opacity="0">
              <animate attributeName="opacity" begin="0s"   dur="0.1s"  fill="freeze" to="0.9" />
              <animateMotion begin="0s" dur="3.2s" fill="freeze"
                path="M96,98 L200,88 L310,88 L355,88 L465,88 L510,88 L620,88 L724,98" />
              <animate attributeName="opacity" begin="3.3s" dur="0.3s"  fill="freeze" to="0" />
            </circle>

            {/* ACK ← backward (green): starts only after message arrives at 3.4s */}
            <circle r="5" fill={GREEN} opacity="0" style={{ filter: 'drop-shadow(0 0 5px #22c55e)' }}>
              <animate attributeName="opacity" begin="3.4s" dur="0.15s" fill="freeze" to="0.9" />
              <animateMotion begin="3.4s" dur="2.8s" fill="freeze"
                path="M724,98 L620,88 L510,88 L465,88 L355,88 L310,88 L200,88 L96,98" />
              <animate attributeName="opacity" begin="6.4s" dur="0.3s"  fill="freeze" to="0" />
            </circle>
          </g>

          {/* QR label */}
          <text x="68"  y="168" textAnchor="middle" fill={CYAN} fontSize="9" opacity="0.55" fontFamily="var(--font-mono,monospace)">PHONE A</text>
          <text x="752" y="168" textAnchor="middle" fill={CYAN} fontSize="9" opacity="0.55" fontFamily="var(--font-mono,monospace)">PHONE B</text>
          <text x="360" y="155" textAnchor="middle" fill="var(--intro-text-faint)" fontSize="8" fontFamily="var(--font-mono,monospace)">— MESSAGE</text>
          <text x="510" y="155" textAnchor="middle" fill={GREEN} fontSize="8" opacity="0.6" fontFamily="var(--font-mono,monospace)">ACK ←</text>
          <text x="410" y="170" textAnchor="middle" fill="var(--intro-text-dimmer)" fontSize="8" fontFamily="var(--font-mono,monospace)">QR SCAN OUT-OF-BAND · KEY NEVER CROSSES THE MESH</text>
        </svg>
      </div>

      {/* ── Threat model ── */}
      <div className="sec-threat-grid" style={{ display: 'none' }}>
        <div className="sec-threat-col sec-threat-can">
          <div className="sec-threat-head" style={{ color: '#f87171' }}>What a compromised relay CAN see</div>
          {['msg_id (opaque identifier)', 'TTL remaining', 'receiver_id (identifier only)', 'Encrypted ciphertext blob', 'Nonce (public, not the key)'].map((s, i) => (
            <div key={i} className="sec-threat-item" style={{ '--st-delay': `${i * 100}ms` } as React.CSSProperties}>
              <span className="sec-threat-icon" style={{ color: '#f87171' }}>◆</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
        <div className="sec-threat-divider" />
        <div className="sec-threat-col sec-threat-cannot">
          <div className="sec-threat-head" style={{ color: GREEN }}>What a compromised relay CANNOT learn</div>
          {['Message content (zero plaintext)', 'Sender identity (no source address)', 'Encryption or session key', 'Communication patterns (partial)', 'Whether message was delivered'].map((s, i) => (
            <div key={i} className="sec-threat-item" style={{ '--st-delay': `${i * 100 + 200}ms` } as React.CSSProperties}>
              <span className="sec-threat-icon" style={{ color: GREEN }}>◆</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="sec-deep-note">Traffic analysis (timing / frequency correlation) is not protected — explicit design boundary of this thesis.</p>
    </div>
  );
}

// ─── Live Demo Slide ──────────────────────────────────────────────────────────
const DEMO_STEPS = [
  { title: 'Install App' },
  { title: 'Key Generation' },
  { title: 'QR Exchange' },
  { title: 'Network Tab' },
  { title: 'Start Chatting' },
  { title: 'Settings' },
];

function LiveDemoSlide({ isActive }: { isActive: boolean }) {
  const [fixedPos, setFixedPos] = useState<{ left: number; top: number } | null>(null);
  const [size, setSize] = useState({ width: 390, height: 720 });
  const [busy, setBusy] = useState(false);
  const op = useRef<
    | { mode: 'drag';   sx: number; sy: number; ol: number; ot: number }
    | { mode: 'resize'; sx: number; sy: number; ow: number; oh: number }
    | null
  >(null);
  const floatRef  = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Inject CSS into iframe on load: hide dark background, phone-window fills viewport
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const inject = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc || doc.getElementById('_embed')) return;
        const s = doc.createElement('style');
        s.id = '_embed';
        s.textContent = `
          html, body { background: transparent !important; overflow: hidden !important; }
          body::before { display: none !important; }
          .phone-window {
            position: fixed !important;
            left: 0 !important; top: 0 !important;
            width: 100% !important; height: 100% !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            transition: none !important;
          }
        `;
        doc.head.appendChild(s);
      } catch {}
    };
    iframe.addEventListener('load', inject);
    return () => iframe.removeEventListener('load', inject);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const a = op.current;
      if (!a) return;
      if (a.mode === 'drag') {
        setFixedPos({ left: a.ol + e.clientX - a.sx, top: a.ot + e.clientY - a.sy });
      } else {
        setSize({ width: Math.max(300, a.ow + e.clientX - a.sx), height: Math.max(400, a.oh + e.clientY - a.sy) });
      }
    };
    const onUp = () => { op.current = null; setBusy(false); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  useEffect(() => {
    if (!isActive) { setFixedPos(null); setBusy(false); op.current = null; }
  }, [isActive]);

  const onDragDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = floatRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ol = fixedPos?.left ?? rect.left;
    const ot = fixedPos?.top  ?? rect.top;
    if (!fixedPos) setFixedPos({ left: rect.left, top: rect.top });
    op.current = { mode: 'drag', sx: e.clientX, sy: e.clientY, ol, ot };
    setBusy(true);
  };

  const onResizeDown = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    op.current = { mode: 'resize', sx: e.clientX, sy: e.clientY, ow: size.width, oh: size.height };
    setBusy(true);
  };

  const floatStyle: React.CSSProperties = fixedPos
    ? { position: 'fixed', left: fixedPos.left, top: fixedPos.top, zIndex: 300, width: size.width, height: size.height }
    : { width: size.width, height: size.height };

  return (
    <div className="demo-slide">
      <div className="demo-steps-panel">
        <h2 className="demo-steps-heading">System Demonstration</h2>
        <ol className="demo-steps-list">
          {DEMO_STEPS.map((step, i) => (
            <li key={i} className="demo-step-item">
              <div className="demo-step-num">{i + 1}</div>
              <div className="demo-step-body">
                <div className="demo-step-title">{step.title}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="demo-iframe-wrap">
        <div ref={floatRef} className="demo-app-float" style={floatStyle}>
          {/* Transparent drag strip over the mockup's own title bar (top 34px) */}
          <div
            className="demo-drag-strip"
            onMouseDown={onDragDown}
            style={{ cursor: busy ? 'grabbing' : 'grab' }}
          />
          <iframe
            ref={iframeRef}
            src="/peerreach-mockup.html"
            title="Peer Reach App"
            sandbox="allow-scripts allow-same-origin"
            style={{ width: '100%', height: '100%', border: 'none', display: 'block', pointerEvents: busy ? 'none' : 'auto' }}
          />
          <div className="demo-win-resizer" onMouseDown={onResizeDown} />
        </div>
      </div>
    </div>
  );
}

// ─── Slide 11: Managed Flooding Algorithm ────────────────────────────────────
function FloodingAlgorithmSlide({ isActive }: { isActive: boolean }) {
  const [step, setStep] = useState(0);
  const MAX_STEP = 11;
  const mono = "var(--font-mono,'JetBrains Mono',monospace)";

  useEffect(() => {
    if (!isActive) setStep(0);
  }, [isActive]);

  const show = (n: number) => step >= n;
  const MY = 100;
  const BY = 218;

  // inline arrowhead pointing right, tip at (x,y)
  const ArrR = (x: number, y: number, c = CYAN) => (
    <polygon points={`${x},${y} ${x-8},${y-4} ${x-8},${y+4}`} fill={c} />
  );
  // inline arrowhead pointing down, tip at (x,y)
  const ArrD = (x: number, y: number, c = CYAN) => (
    <polygon points={`${x},${y} ${x-4},${y-8} ${x+4},${y-8}`} fill={c} />
  );

  return (
    <div className="flooding-outer">
      <svg viewBox="0 0 1200 268" className="flooding-svg">
        {/* ── S0: Packet Received (oval) ── */}
        {show(0) && (
          <g>
            <rect x="5" y={MY-24} width="96" height="48" rx="24" fill="rgba(34,211,238,0.08)" stroke={CYAN} strokeWidth="1.5" />
            <text x="53" y={MY-5}  textAnchor="middle" fill={CYAN} fontSize="10" fontFamily={mono}>Packet</text>
            <text x="53" y={MY+9}  textAnchor="middle" fill={CYAN} fontSize="10" fontFamily={mono}>Received</text>
          </g>
        )}

        {/* ── S1: Look up msgId ── */}
        {show(1) && (
          <g>
            <line x1="101" y1={MY} x2="118" y2={MY} stroke={CYAN} strokeWidth="1.2" />
            {ArrR(126, MY)}
            <rect x="126" y={MY-26} width="118" height="52" rx="6" fill="transparent" stroke={WHITE} strokeWidth="1.2" />
            <text x="185" y={MY-7}  textAnchor="middle" fill={WHITE} fontSize="9.5" fontFamily={mono}>Look up msgId</text>
            <text x="185" y={MY+7}  textAnchor="middle" fill={WHITE} fontSize="9" fontFamily={mono}>in seen-msg cache</text>
          </g>
        )}

        {/* ── S2: Already seen? diamond ── */}
        {show(2) && (
          <g>
            <line x1="244" y1={MY} x2="262" y2={MY} stroke={CYAN} strokeWidth="1.2" />
            {ArrR(270, MY)}
            <polygon points={`320,${MY-28} 374,${MY} 320,${MY+28} 266,${MY}`}
              fill="rgba(34,211,238,0.06)" stroke={CYAN} strokeWidth="1.3" />
            <text x="320" y={MY-6}  textAnchor="middle" fill={CYAN} fontSize="9.5" fontFamily={mono}>Already</text>
            <text x="320" y={MY+8}  textAnchor="middle" fill={CYAN} fontSize="9.5" fontFamily={mono}>seen?</text>
          </g>
        )}

        {/* ── S3: Yes→Drop(dup.) | No label ── */}
        {show(3) && (
          <g>
            <line x1="320" y1={MY+28} x2="320" y2={BY-26} stroke={CYAN} strokeWidth="1.2" />
            {ArrD(320, BY-18)}
            <text x="330" y={MY+50} fill={WHITE} fontSize="8.5" fontFamily={mono} opacity="0.75">Yes</text>
            <rect x="278" y={BY-24} width="84" height="48" rx="8"
              fill="rgba(248,113,113,0.1)" stroke="#f87171" strokeWidth="1.3" />
            <text x="320" y={BY-5}  textAnchor="middle" fill="#f87171" fontSize="10" fontFamily={mono}>Drop</text>
            <text x="320" y={BY+9}  textAnchor="middle" fill="#f87171" fontSize="10" fontFamily={mono}>(dup.)</text>
            <text x="390" y={MY+12} fill={WHITE} fontSize="8.5" fontFamily={mono} opacity="0.75">No</text>
          </g>
        )}

        {/* ── S4: Insert msgId into cache ── */}
        {show(4) && (
          <g>
            <line x1="374" y1={MY} x2="392" y2={MY} stroke={CYAN} strokeWidth="1.2" />
            {ArrR(400, MY)}
            <rect x="400" y={MY-26} width="112" height="52" rx="6" fill="transparent" stroke={WHITE} strokeWidth="1.2" />
            <text x="456" y={MY-7}  textAnchor="middle" fill={WHITE} fontSize="9.5" fontFamily={mono}>Insert msgId</text>
            <text x="456" y={MY+7}  textAnchor="middle" fill={WHITE} fontSize="9.5" fontFamily={mono}>into cache</text>
          </g>
        )}

        {/* ── S5: TTL>0 after decrement? ── */}
        {show(5) && (
          <g>
            <line x1="512" y1={MY} x2="530" y2={MY} stroke={GOLD} strokeWidth="1.2" />
            {ArrR(538, MY, GOLD)}
            <polygon points={`608,${MY-32} 678,${MY} 608,${MY+32} 538,${MY}`}
              fill="rgba(240,165,0,0.06)" stroke={GOLD} strokeWidth="1.3" />
            <text x="608" y={MY-10} textAnchor="middle" fill={GOLD} fontSize="9" fontFamily={mono}>TTL &gt; 0</text>
            <text x="608" y={MY+3}  textAnchor="middle" fill={GOLD} fontSize="9" fontFamily={mono}>after</text>
            <text x="608" y={MY+16} textAnchor="middle" fill={GOLD} fontSize="9" fontFamily={mono}>decrement?</text>
          </g>
        )}

        {/* ── S6: No→Drop(TTL=0) | Yes label ── */}
        {show(6) && (
          <g>
            <line x1="608" y1={MY+32} x2="608" y2={BY-26} stroke={GOLD} strokeWidth="1.2" />
            {ArrD(608, BY-18, GOLD)}
            <text x="618" y={MY+54} fill={WHITE} fontSize="8.5" fontFamily={mono} opacity="0.75">No</text>
            <rect x="562" y={BY-24} width="92" height="48" rx="8"
              fill="rgba(248,113,113,0.1)" stroke="#f87171" strokeWidth="1.3" />
            <text x="608" y={BY-5}  textAnchor="middle" fill="#f87171" fontSize="10" fontFamily={mono}>Drop</text>
            <text x="608" y={BY+9}  textAnchor="middle" fill="#f87171" fontSize="10" fontFamily={mono}>(TTL=0)</text>
            <text x="694" y={MY+12} fill={WHITE} fontSize="8.5" fontFamily={mono} opacity="0.75">Yes</text>
          </g>
        )}

        {/* ── S7: Receiver = this node? ── */}
        {show(7) && (
          <g>
            <line x1="678" y1={MY} x2="696" y2={MY} stroke={CYAN} strokeWidth="1.2" />
            {ArrR(704, MY)}
            <polygon points={`774,${MY-30} 844,${MY} 774,${MY+30} 704,${MY}`}
              fill="rgba(34,211,238,0.06)" stroke={CYAN} strokeWidth="1.3" />
            <text x="774" y={MY-8}  textAnchor="middle" fill={CYAN} fontSize="9" fontFamily={mono}>Receiver =</text>
            <text x="774" y={MY+6}  textAnchor="middle" fill={CYAN} fontSize="9" fontFamily={mono}>this node?</text>
          </g>
        )}

        {/* ── S8: Yes→Deliver | No label ── */}
        {show(8) && (
          <g>
            <line x1="774" y1={MY+30} x2="774" y2={BY-26} stroke={CYAN} strokeWidth="1.2" />
            {ArrD(774, BY-18)}
            <text x="784" y={MY+52} fill={WHITE} fontSize="8.5" fontFamily={mono} opacity="0.75">Yes</text>
            <rect x="726" y={BY-24} width="96" height="48" rx="8"
              fill="rgba(52,211,153,0.1)" stroke={GREEN} strokeWidth="1.3" />
            <text x="774" y={BY-5}  textAnchor="middle" fill={GREEN} fontSize="9.5" fontFamily={mono}>Deliver to</text>
            <text x="774" y={BY+9}  textAnchor="middle" fill={GREEN} fontSize="9.5" fontFamily={mono}>app. layer</text>
            <text x="860" y={MY+12} fill={WHITE} fontSize="8.5" fontFamily={mono} opacity="0.75">No</text>
          </g>
        )}

        {/* ── S9: Compute random jitter delay ── */}
        {show(9) && (
          <g>
            <line x1="844" y1={MY} x2="862" y2={MY} stroke={CYAN} strokeWidth="1.2" />
            {ArrR(870, MY)}
            <rect x="870" y={MY-26} width="122" height="52" rx="6" fill="transparent" stroke={WHITE} strokeWidth="1.2" />
            <text x="931" y={MY-7}  textAnchor="middle" fill={WHITE} fontSize="9.5" fontFamily={mono}>Compute random</text>
            <text x="931" y={MY+7}  textAnchor="middle" fill={WHITE} fontSize="9.5" fontFamily={mono}>jitter delay</text>
          </g>
        )}

        {/* ── S10: Schedule rebroadcast after jitter ── */}
        {show(10) && (
          <g>
            <line x1="992" y1={MY} x2="1010" y2={MY} stroke={CYAN} strokeWidth="1.2" />
            {ArrR(1018, MY)}
            <rect x="1018" y={MY-28} width="144" height="56" rx="8"
              fill="rgba(34,211,238,0.1)" stroke={CYAN} strokeWidth="1.6" />
            <text x="1090" y={MY-9}  textAnchor="middle" fill={CYAN} fontSize="9.5" fontFamily={mono} fontWeight="700">Schedule</text>
            <text x="1090" y={MY+5}  textAnchor="middle" fill={CYAN} fontSize="9.5" fontFamily={mono} fontWeight="700">rebroadcast</text>
            <text x="1090" y={MY+19} textAnchor="middle" fill={CYAN} fontSize="9.5" fontFamily={mono} fontWeight="700">after jitter</text>
          </g>
        )}

        {/* ── S11: End ── */}
        {show(11) && (
          <g>
            <line x1="1162" y1={MY} x2="1174" y2={MY} stroke={CYAN} strokeWidth="1.2" />
            {ArrR(1182, MY)}
            <rect x="1182" y={MY-20} width="14" height="0" rx="0" fill="none" />
            <rect x="1162" y={MY-20} width="0" height="0" rx="0" fill="none" />
            {/* end oval — last 36px */}
            <rect x="1164" y={MY-20} width="32" height="40" rx="20"
              fill="rgba(255,255,255,0.05)" stroke={WHITE} strokeWidth="1.3" />
            <text x="1180" y={MY+4} textAnchor="middle" fill={WHITE} fontSize="9" fontFamily={mono}>End</text>
          </g>
        )}
      </svg>

      <div className="flooding-controls">
        <button className="flooding-btn" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>← Back</button>
        <div className="flooding-dots">
          {Array.from({ length: MAX_STEP + 1 }, (_, i) => (
            <span key={i} className={`flooding-dot${i <= step ? ' active' : ''}`}
              onClick={() => setStep(i)} />
          ))}
        </div>
        {step < MAX_STEP
          ? <button className="flooding-btn primary" onClick={() => setStep(s => Math.min(MAX_STEP, s + 1))}>Next →</button>
          : <span className="flooding-complete">✓ complete</span>
        }
      </div>
    </div>
  );
}

// ─── Cover rotating subtitle ─────────────────────────────────────────────────
function CoverSubtitle() {
  const [idx, setIdx] = useState(0);
  const lines = [
    'An Offline Bluetooth Low Energy Communication Framework\nfor Multi-Hop Device-to-Device Networking',
  ];
  return (
    <div className="cover-subtitle-rotate">
      {lines.map((line, i) => (
        <span key={i} className={`cover-sub-line ${idx === i ? 'is-active' : ''}`}>
          {line.split('\n').map((l, j) => (
            <span key={j}>{l}{j === 0 && <br />}</span>
          ))}
        </span>
      ))}
    </div>
  );
}

// ─── Slide 13: Security Scenarios ────────────────────────────────────────────
function SecurityScenariosSlide() {
  const scenarios = [
    {
      num: '01', title: 'Eavesdropping', color: CYAN,
      attack: 'Attacker passively sniffs BLE advertisements and captures raw packet bytes.',
      defense: 'Payload is AES-128-GCM ciphertext. Without the session key, only an opaque blob is visible — message content is never exposed at any relay hop.',
    },
    {
      num: '02', title: 'Replay Attack', color: GOLD,
      attack: 'Attacker re-broadcasts a previously captured packet to duplicate delivery or disrupt the network.',
      defense: 'Every packet carries a unique 8-byte cryptographically random msg_id. Each relay checks a 200-entry seen_msg_ids ring buffer and silently drops duplicates.',
    },
    {
      num: '03', title: 'Packet Tampering', color: PURPLE,
      attack: 'Attacker intercepts a packet in transit and modifies the payload or header fields.',
      defense: 'AES-128-GCM authentication tag (16 bytes) covers the full payload. Any bit-flip causes tag verification to fail and the packet is silently dropped.',
    },
    {
      num: '04', title: 'Node Impersonation', color: GREEN,
      attack: 'Attacker claims to be a legitimate peer to intercept, inject, or forge messages.',
      defense: 'Session keys derived via Curve25519 ECDH, exchanged out-of-band via QR code. An impersonator cannot derive the shared secret without the private key.',
    },
  ];

  return (
    <div className="scenarios-grid">
      {scenarios.map((s) => (
        <div key={s.num} className="scenario-card" style={{ '--sc-color': s.color } as React.CSSProperties}>
          <div className="scenario-header">
            <span className="scenario-num" style={{ color: s.color }}>{s.num}</span>
            <span className="scenario-title" style={{ color: s.color }}>{s.title}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function IntroExperience({ onEnterSystem }: { onEnterSystem: () => void }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const settleTimerRef = useRef<number | null>(null);
  const currentSectionIndexRef = useRef(0);

  const [mounted,              setMounted]              = useState(false);
  const [hideScrollCue,        setHideScrollCue]        = useState(false);
  const [showProblemList,      setShowProblemList]       = useState(false);
  const [showRelatedTable,     setShowRelatedTable]      = useState(false);
  const [currentSectionIndex,  setCurrentSectionIndex]  = useState(0);
  const [introNavDirection,    setIntroNavDirection]     = useState<'forward' | 'backward'>('forward');
  const [visibleNumberCount,   setVisibleNumberCount]    = useState(0);
  const [visibleNumberCount2,   setVisibleNumberCount2]    = useState(0);
  const [cryptoReplayKey,      setCryptoReplayKey]       = useState(0);
  const [secDeepReplayKey,     setSecDeepReplayKey]      = useState(0);
  const [archActive,           setArchActive]            = useState(false);
  const [packetActive,         setPacketActive]          = useState(false);
  const [openComponent,        setOpenComponent]         = useState<ComponentKey | null>(null);

  // Indices (18 slides):
  // 0 cover | 1 agenda | 2 abstract | 3 problem | 4 insight | 5 range | 6 solution
  // 7 architecture | 8 components | 9 demo | 10 packet | 11 flooding
  // 12 security | 13 security-scenarios | 14 security-deep | 15 numbers | 16 related | 17 transition

  const scrollToSection = (index: number) => {
    const container = scrollerRef.current;
    if (!container) return;
    const bounded = Math.max(0, Math.min(index, INTRO_SECTION_IDS.length - 1));
    const section = container.querySelector<HTMLElement>(`#${INTRO_SECTION_IDS[bounded]}`);
    if (!section) return;
    container.scrollTo({ top: section.offsetTop, behavior: 'smooth' });
  };

  // Preload images
  useEffect(() => {
    ['/icons/phone_3d.png', '/icons/esp_3d.png', '/icons/lora_3d.png'].forEach(src => {
      const img = new Image(); img.src = src;
    });
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 40);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => { currentSectionIndexRef.current = currentSectionIndex; }, [currentSectionIndex]);

  // Scroll cue hide
  useEffect(() => {
    const container = scrollerRef.current;
    if (!container) return;
    const onScroll = () => setHideScrollCue(container.scrollTop > window.innerHeight * 0.35);
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // Section observer + wheel snap
  useEffect(() => {
    const container = scrollerRef.current;
    if (!container) return;
    const sections = Array.from(container.querySelectorAll<HTMLElement>('[data-intro-section]'));
    if (!sections.length) return;

    sections.forEach(section => {
      const content = section.querySelector<HTMLElement>('.intro-content');
      if (!content) return;
      Array.from(content.children).forEach((child, i) => {
        (child as HTMLElement).style.setProperty('--intro-stagger-delay', `${Math.min(i * 120, 600)}ms`);
      });
    });

    let accDelta = 0;
    const getNearestTop = () => {
      const top = container.scrollTop;
      return sections.reduce((best, s) => {
        return Math.abs(s.offsetTop - top) < Math.abs(best - top) ? s.offsetTop : best;
      }, sections[0].offsetTop);
    };
    const onWheel = (e: WheelEvent) => {
      accDelta += e.deltaY;
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(() => {
        if (Math.abs(accDelta) > 50) container.scrollTo({ top: getNearestTop(), behavior: 'smooth' });
        accDelta = 0;
      }, 150);
    };

    const visMap = new Map<string, number>();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => visMap.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      let nextId: (typeof INTRO_SECTION_IDS)[number] = INTRO_SECTION_IDS[0];
      let highRatio = -1;
      INTRO_SECTION_IDS.forEach(id => {
        const r = visMap.get(id) ?? 0;
        if (r > highRatio) { highRatio = r; nextId = id; }
      });
      if (highRatio >= 0.4) {
        const nextIdx = INTRO_SECTION_IDS.indexOf(nextId as (typeof INTRO_SECTION_IDS)[number]);
        if (nextIdx >= 0) {
          if (nextIdx !== currentSectionIndexRef.current) {
            setIntroNavDirection(nextIdx > currentSectionIndexRef.current ? 'forward' : 'backward');
          }
          setCurrentSectionIndex(nextIdx);
        }
      }
    }, { root: container, threshold: [0, 0.4, 0.75, 1] });

    sections.forEach(s => observer.observe(s));
    container.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      container.removeEventListener('wheel', onWheel);
      observer.disconnect();
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  // Problem list (index 3 = hook-problem)
  useEffect(() => {
    if (currentSectionIndex !== 3 || showProblemList) return;
    const t = window.setTimeout(() => setShowProblemList(true), 800);
    return () => window.clearTimeout(t);
  }, [currentSectionIndex, showProblemList]);

  // Related table (index 16 = hook-related)
  useEffect(() => {
    if (currentSectionIndex !== 16) return;
    const t = window.setTimeout(() => setShowRelatedTable(true), 400);
    return () => window.clearTimeout(t);
  }, [currentSectionIndex]);

  // Architecture active (index 7 = hook-architecture)
  useEffect(() => {
    setArchActive(currentSectionIndex === 7);
  }, [currentSectionIndex]);

  // Packet active (index 10 = hook-packet)
  useEffect(() => {
    setPacketActive(currentSectionIndex === 10);
  }, [currentSectionIndex]);

  // Numbers (index 15 = hook-numbers)
  useEffect(() => {
    if (currentSectionIndex !== 17) { setVisibleNumberCount(0); return; }
    setVisibleNumberCount(0);
    const ts = [120, 280, 440, 600, 760, 920].map((ms, i) =>
      window.setTimeout(() => setVisibleNumberCount(i + 1), ms)
    );
    return () => ts.forEach(t => window.clearTimeout(t));
  }, [currentSectionIndex]);
  useEffect(() => {
    if (currentSectionIndex !== 19) { setVisibleNumberCount2(0); return; }
    setVisibleNumberCount2(0);
    const ts = [120, 280, 440, 600, 760, 920].map((ms, i) =>
      window.setTimeout(() => setVisibleNumberCount2(i + 1), ms)
    );
    return () => ts.forEach(t => window.clearTimeout(t));
  }, [currentSectionIndex]);
  // Security overview (index 12 = hook-security)
  useEffect(() => {
    if (currentSectionIndex === 12) setCryptoReplayKey(k => k + 1);
  }, [currentSectionIndex]);

  // Security deep dive (index 14 = hook-security-deep)
  useEffect(() => {
    if (currentSectionIndex === 14) setSecDeepReplayKey(k => k + 1);
  }, [currentSectionIndex]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      const isPrev = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
      const isNext = e.key === 'ArrowRight' || e.key === 'ArrowDown';
      if (!isPrev && !isNext) return;
      const delta = isNext ? 1 : -1;
      const next = Math.max(0, Math.min(currentSectionIndexRef.current + delta, INTRO_SECTION_IDS.length - 1));
      if (next === currentSectionIndexRef.current) return;
      e.preventDefault();
      setIntroNavDirection(delta > 0 ? 'forward' : 'backward');
      scrollToSection(next);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const dir = introNavDirection === 'backward' ? 'is-entering-backward' : '';

  return (
    <div className="intro-shell">
      <ThemeToggle />
      <SlideNumber current={currentSectionIndex} />
      <div ref={scrollerRef} className="intro-scroll-root">

        {/* ── Slide 01: Cover ── */}
        <SectionFrame id="cover" isActive={currentSectionIndex === 0}>
          <AmbientBackground />
          <div className="intro-overlay" />
          <div className={`cover-content intro-content ${dir}`}>
            <h1 className={`cover-title ${mounted ? 'is-visible' : ''}`}>PEER REACH</h1>
            <div className={`cover-kicker ${mounted ? 'is-visible' : ''}`}>
              <CoverSubtitle />
            </div>
          </div>
          <div className={`cover-scroll-cue ${mounted && !hideScrollCue ? 'is-visible' : ''}`}>
            <div className="scroll-line"><span className="scroll-dot" /></div>
          </div>
        </SectionFrame>

        {/* ── Slide 02: Agenda ── */}
        <SectionFrame id="hook-agenda" isActive={currentSectionIndex === 1}>
          <div className={`hook-inner intro-content ${dir}`}>
            <AgendaSlide />
          </div>
        </SectionFrame>

        {/* ── Slide 03: Abstract ── */}
        <SectionFrame id="hook-abstract" isActive={currentSectionIndex === 2}>
          <div className={`hook-inner intro-content ${dir}`}>
            <h2>Thesis Overview</h2>
            <AbstractSlide />
          </div>
        </SectionFrame>

        {/* ── Slide 04: Problem ── */}
        <SectionFrame id="hook-problem" isActive={currentSectionIndex === 3}>
          <div className={`hook-inner intro-content ${dir}`}>
            <h2>Problem Statement</h2>
            <ProblemList visible={showProblemList} />
            <p className="hook-subline">Existing solutions depend on infrastructure that isn't always there.</p>
          </div>
        </SectionFrame>

        {/* ── Slide 05: Insight ── */}
        <SectionFrame id="hook-insight" isActive={currentSectionIndex === 4}>
          <div className={`hook-inner intro-content ${dir}`}>
            <h2>Every device has Bluetooth.</h2>
            <InsightAnimation />
            <p className="hook-subline">Bluetooth Low Energy lets devices talk directly without the need for towers, or internet, or service.</p>
          </div>
        </SectionFrame>

        {/* ── Slide 06: Range Problem ── */}
        <SectionFrame id="hook-range" isActive={currentSectionIndex === 5}>
          <div className={`hook-inner intro-content ${dir}`}>
            <h2>Reaches ~15–20 meters only.</h2>
            <RangeFailureAnimation />
            <p className="hook-subline">In large areas, BLE clusters are isolated — the gap between them cannot be bridged by BLE alone.</p>
          </div>
        </SectionFrame>

        {/* ── Slide 07: Solution ── */}
        <SectionFrame id="hook-solution" isActive={currentSectionIndex === 6}>
          <div className={`hook-inner intro-content ${dir}`}>
            <h2>Range was extended by 100×.</h2>
            <SolutionAnimation />
            <p className="hook-subline">LoRa radio bridges the gap between BLE clusters, extending our coverage radius to 1,500 meters — no infrastructure required.</p>
          </div>
        </SectionFrame>

        {/* ── Slide 08: Architecture ── */}
        <SectionFrame id="hook-architecture" isActive={currentSectionIndex === 7}>
          <div className={`hook-inner intro-content ${dir}`} style={{ width: 'min(1000px, 100%)' }}>
            <div className="hook-label">SYSTEM DESIGN</div>
            <h2>System Model</h2>
            <ArchitectureDiagram active={archActive} />
            <p className="hook-subline">Two BLE clusters, one LoRa bridge. The inter-cluster hop is completely transparent to end nodes — they see only BLE.</p>
          </div>
        </SectionFrame>

        {/* ── Slide 09: Components ── */}
        <SectionFrame id="hook-components" isActive={currentSectionIndex === 8}>
          <div className={`hook-inner hook-components intro-content ${dir}`}>
            <h2>System Components</h2>
            <p className="hook-subline">Each plays a distinct role in the network.</p>
            <ComponentsCards visible={currentSectionIndex === 8} onOpen={setOpenComponent} />
          </div>
        </SectionFrame>

        {/* ── Slide 10: Live Demo ── */}
        <SectionFrame id="hook-demo" isActive={currentSectionIndex === 9}>
          <LiveDemoSlide isActive={currentSectionIndex === 9} />
        </SectionFrame>

        {/* ── Slide 11: Packet Format ── */}
        <SectionFrame id="hook-packet" isActive={currentSectionIndex === 10}>
          <div className={`hook-inner intro-content ${dir}`} style={{ width: 'min(1080px, 100%)' }}>
            <h2>Packet Design</h2>
            <PacketFormatDiagram active={packetActive} />
          </div>
        </SectionFrame>

        {/* ── Slide 12: Flooding Algorithm ── */}
        <SectionFrame id="hook-flooding" isActive={currentSectionIndex === 11}>
          <div className={`hook-inner intro-content ${dir}`} style={{ width: 'min(1140px, 100%)' }}>
            <h2>Managed Flooding Algorithm</h2>
            <FloodingAlgorithmSlide isActive={currentSectionIndex === 11} />
          </div>
        </SectionFrame>

        {/* ── Slide 13: Security Overview ── */}
        <SectionFrame id="hook-security" isActive={currentSectionIndex === 12}>
          <div className={`hook-inner intro-content ${dir}`}>
            <h2>Security Design</h2>
            <p className="hook-subline">End-to-end encryption via Curve25519 ECDH + AES-128-GCM with out-of-band QR key exchange.</p>
            <EncryptionFlowAnimation replayKey={cryptoReplayKey} />
          </div>
        </SectionFrame>

        {/* ── Slide 12: Security Framework ── */}
        <SectionFrame id="hook-security-framework" isActive={currentSectionIndex === 13}>
          <div className={`hook-inner intro-content ${dir}`}>
            <SecurityFrameworkSlide visible={currentSectionIndex === 13} />
          </div>
        </SectionFrame>

        {/* ── Slide 15: Threat Model ── */}
        <SectionFrame id="hook-security-deep" isActive={currentSectionIndex === 14}>
          <div className={`hook-inner intro-content ${dir}`} style={{ width: 'min(1060px, 100%)' }}>
            <h2>Threat Model</h2>
            <SecurityDeepDiveAnimation replayKey={secDeepReplayKey} />
          </div>
        </SectionFrame>

        {/* ── Slide 14: Security Scenarios ── */}
        <SectionFrame id="hook-security-scenarios" isActive={currentSectionIndex === 15}>
          <div className={`hook-inner intro-content ${dir}`} style={{ width: 'min(1060px, 100%)' }}>
            <h2>Attack Scenarios</h2>
            <SecurityScenariosSlide />
          </div>
        </SectionFrame>

        {/* ── Slide 17: MDR vs Distance ── */}
        <SectionFrame id="hook-results-mdr" isActive={currentSectionIndex === 16}>
          <div className={`hook-inner intro-content ${dir}`} style={{ width: 'min(900px, 100%)' }}>
            <h2>MDR vs Distance</h2>
            <MDRChart active={currentSectionIndex === 17} />
          </div>
        </SectionFrame>

        {/* ── Slide 16: Lora ── */}
        <SectionFrame id="hook-numbers" isActive={currentSectionIndex === 17}>
          <div className={`hook-inner hook-numbers intro-content ${dir}`}>
            <h2>Lora</h2>
            <NumbersSlide visibleCount={visibleNumberCount} />
          </div>
        </SectionFrame>

        {/* ── Slide 20: ACK RTT CDF ── */}
        <SectionFrame id="hook-results-cdf" isActive={currentSectionIndex === 18}>
          <div className={`hook-inner intro-content ${dir}`} style={{ width: 'min(900px, 100%)' }}>
            <h2>ACK Round-Trip Time</h2>
            <ACKCDFChart active={currentSectionIndex === 20} />
          </div>
        </SectionFrame>

        {/* ── Slide 16: Key Results ── */}
        <SectionFrame id="hook-numbers-conc" isActive={currentSectionIndex === 19}>
          <div className={`hook-inner hook-numbers-conc intro-content ${dir}`}>
            <h2>Key Results</h2>
            <NumbersConc visibleCount={visibleNumberCount2} />
          </div>
        </SectionFrame>

        {/* ── Slide 17: Comparison ── */}
        <SectionFrame id="hook-related" isActive={currentSectionIndex === 20}>
          <div className={`hook-inner intro-content ${dir}`} style={{ width: 'min(1100px, 100%)' }}>
            <h2>Comparison</h2>
            <RelatedWorkTable visible={showRelatedTable} />
          </div>
        </SectionFrame>

        {/* ── Slide 18: Closing / Enter System ── */}
        <SectionFrame id="hook-transition" isActive={currentSectionIndex === 21}>
          <div className={`hook-inner transition-inner intro-content ${dir}`}>
            <h2>Peer Reach</h2>
            <p className="hook-subline">A working prototype. A real mesh. Let's show you how it works.</p>
            <button className="enter-system-btn" onClick={onEnterSystem}>Enter the System →</button>
          </div>
        </SectionFrame>

      </div>

      {/* Nav dots */}
      <div className="intro-nav-dots" aria-label="Intro section navigation">
        {INTRO_SECTION_IDS.map((id, index) => (
          <button
            key={id}
            type="button"
            className={`intro-nav-dot ${currentSectionIndex === index ? 'is-active' : ''}`}
            onClick={() => {
              if (index !== currentSectionIndexRef.current) {
                setIntroNavDirection(index > currentSectionIndexRef.current ? 'forward' : 'backward');
              }
              scrollToSection(index);
            }}
            aria-label={`Go to section ${index + 1}`}
            aria-current={currentSectionIndex === index ? 'true' : undefined}
          />
        ))}
      </div>

      {/* Component detail modal */}
      {openComponent && (
        <ComponentModal which={openComponent} onClose={() => setOpenComponent(null)} />
      )}
    </div>
  );
}
