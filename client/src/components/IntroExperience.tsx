import { useEffect, useRef, useState } from 'react';

const DEEP_BLACK = '#050508';
const WHITE = '#f6f8ff';
const CYAN = '#00bcd4';
const GOLD = '#f0a500';
const GREEN = '#22c55e';
const PURPLE = '#c084fc';

const INTRO_SECTION_IDS = [
  'cover',
  'hook-abstract',
  'hook-problem',
  'hook-insight',
  'hook-range',
  'hook-solution',
  'hook-related',
  'hook-components',
  'hook-demo',
  'hook-architecture',
  'hook-packet',
  'hook-numbers',
  'hook-security',
  'hook-security-deep',
  'hook-transition',
] as const;

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
      <ul className="abstract-achievements">
        <li>
          <span className="ach-marker" style={{ background: CYAN }} />
          <span>Designed a novel hybrid protocol combining BLE 5.0 and LoRa with transparent multi-cluster bridging</span>
        </li>
        <li>
          <span className="ach-marker" style={{ background: GOLD }} />
          <span>End-to-end encryption via Curve25519 ECDH + AES-128-GCM with QR out-of-band key exchange</span>
        </li>
        <li>
          <span className="ach-marker" style={{ background: WHITE }} />
          <span>Interactive web simulator with 6 animated protocol scenarios and live sandbox topology builder</span>
        </li>
      </ul>
      <p className="abstract-tagline">Offline · Decentralized · Encrypted · No Infrastructure</p>
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
            <span>{item.desc}</span>
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
      <text x="319" y="168" textAnchor="middle" fill="#ef4444" fontSize="10" opacity="0.7" fontFamily="var(--font-mono, monospace)" letterSpacing="0.08em">~30 m MAX RANGE</text>
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
      <text x="319" y="168" textAnchor="middle" fill={GOLD} fontSize="10" opacity="0.8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.08em">1,500 m PROVEN · UP TO 3 km LOS</text>
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
      <p className="related-note">Peer Reach uniquely combines phone-native BLE with LoRa bridging — no proprietary hardware, no closed ecosystem.</p>
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
      { key: 'Per-hop range',     value: '~30 m (indoor tested)' },
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
      { key: 'BLE range',         value: '~30 m per hop' },
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
      { key: 'Range (tested)',    value: '1,500 m real-world deployment' },
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
            <p className="comp-modal-subtitle">{spec.subtitle}</p>
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
              <dd className="comp-modal-val" style={{ color: spec.color === CYAN ? spec.color : 'rgba(246,248,255,0.88)' }}>{p.value}</dd>
            </div>
          ))}
        </dl>

        <p className="comp-modal-hint">Press ESC or click outside to close</p>
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
          <p className="components-spec">{c.spec}</p>
          <span className="comp-tap-hint">TAP TO EXPLORE</span>
        </button>
      ))}
    </div>
  );
}

// ─── Slide 9: System Architecture ────────────────────────────────────────────
function ArchitectureDiagram({ active }: { active: boolean }) {
  return (
    <svg className="arch-svg" viewBox="0 0 880 320" aria-hidden="true">
      {/* ── Cluster A ── */}
      {/* Phone nodes */}
      <circle cx="68"  cy="110" r="16" fill="none" stroke={WHITE} strokeWidth="1.6" opacity="0.85" />
      <circle cx="68"  cy="210" r="16" fill="none" stroke={WHITE} strokeWidth="1.6" opacity="0.85" />
      <circle cx="116" cy="160" r="16" fill="none" stroke={WHITE} strokeWidth="1.6" opacity="0.85" />
      {/* BLE rings on phones (subtle) */}
      <circle cx="68"  cy="110" r="28" stroke={CYAN} strokeWidth="0.6" fill="none" opacity="0.2" />
      <circle cx="68"  cy="210" r="28" stroke={CYAN} strokeWidth="0.6" fill="none" opacity="0.2" />
      <circle cx="116" cy="160" r="28" stroke={CYAN} strokeWidth="0.6" fill="none" opacity="0.2" />
      {/* BLE links */}
      <line x1="84"  y1="116" x2="152" y2="154" stroke={CYAN} strokeWidth="1.1" opacity="0.45" strokeDasharray="4 4" />
      <line x1="84"  y1="204" x2="152" y2="166" stroke={CYAN} strokeWidth="1.1" opacity="0.45" strokeDasharray="4 4" />
      <line x1="132" y1="160" x2="172" y2="160" stroke={CYAN} strokeWidth="1.1" opacity="0.45" strokeDasharray="4 4" />
      {/* ESP32-A */}
      <rect x="172" y="145" width="40" height="30" rx="7" fill="rgba(240,165,0,0.08)" stroke={GOLD} strokeWidth="1.6" />
      <text x="192" y="164" textAnchor="middle" fill={GOLD} fontSize="8" fontFamily="var(--font-mono,monospace)">ESP32</text>
      {/* ESP32 → LoRa-A */}
      <line x1="212" y1="160" x2="256" y2="160" stroke={GOLD} strokeWidth="1.2" opacity="0.6" />
      {/* LoRa-A */}
      <rect x="256" y="140" width="34" height="40" rx="9" fill="rgba(192,132,252,0.08)" stroke={PURPLE} strokeWidth="1.6" />
      <text x="273" y="164" textAnchor="middle" fill={PURPLE} fontSize="7" fontFamily="var(--font-mono,monospace)">LoRa</text>

      {/* ── LoRa Link ── */}
      <line x1="290" y1="160" x2="590" y2="160" stroke={PURPLE} strokeWidth="1.4" strokeDasharray="8 6" opacity="0.65" />
      <text x="440" y="142" textAnchor="middle" fill={PURPLE} fontSize="9" opacity="0.7" fontFamily="var(--font-mono,monospace)" letterSpacing="0.08em">LoRa · 868 MHz · up to 3 km</text>

      {/* ── Cluster B ── */}
      {/* LoRa-B */}
      <rect x="590" y="140" width="34" height="40" rx="9" fill="rgba(192,132,252,0.08)" stroke={PURPLE} strokeWidth="1.6" />
      <text x="607" y="164" textAnchor="middle" fill={PURPLE} fontSize="7" fontFamily="var(--font-mono,monospace)">LoRa</text>
      {/* LoRa-B → ESP32-B */}
      <line x1="624" y1="160" x2="668" y2="160" stroke={GOLD} strokeWidth="1.2" opacity="0.6" />
      {/* ESP32-B */}
      <rect x="668" y="145" width="40" height="30" rx="7" fill="rgba(240,165,0,0.08)" stroke={GOLD} strokeWidth="1.6" />
      <text x="688" y="164" textAnchor="middle" fill={GOLD} fontSize="8" fontFamily="var(--font-mono,monospace)">ESP32</text>
      {/* BLE links */}
      <line x1="708" y1="154" x2="748" y2="116" stroke={CYAN} strokeWidth="1.1" opacity="0.45" strokeDasharray="4 4" />
      <line x1="708" y1="166" x2="748" y2="204" stroke={CYAN} strokeWidth="1.1" opacity="0.45" strokeDasharray="4 4" />
      <line x1="708" y1="160" x2="748" y2="160" stroke={CYAN} strokeWidth="1.1" opacity="0.45" strokeDasharray="4 4" />
      {/* Phone nodes B */}
      <circle cx="764" cy="110" r="16" fill="none" stroke={WHITE} strokeWidth="1.6" opacity="0.85" />
      <circle cx="764" cy="210" r="16" fill="none" stroke={WHITE} strokeWidth="1.6" opacity="0.85" />
      <circle cx="812" cy="160" r="16" fill="none" stroke={WHITE} strokeWidth="1.6" opacity="0.85" />
      <circle cx="764" cy="110" r="28" stroke={CYAN} strokeWidth="0.6" fill="none" opacity="0.2" />
      <circle cx="764" cy="210" r="28" stroke={CYAN} strokeWidth="0.6" fill="none" opacity="0.2" />
      <circle cx="812" cy="160" r="28" stroke={CYAN} strokeWidth="0.6" fill="none" opacity="0.2" />

      {/* Labels */}
      <text x="140" y="270" textAnchor="middle" fill={CYAN} fontSize="10" opacity="0.65" fontFamily="var(--font-mono,monospace)" letterSpacing="0.1em">BLE CLUSTER A</text>
      <text x="690" y="270" textAnchor="middle" fill={CYAN} fontSize="10" opacity="0.65" fontFamily="var(--font-mono,monospace)" letterSpacing="0.1em">BLE CLUSTER B</text>

      {/* Phone labels */}
      <text x="68"  cy="110" textAnchor="middle" fill={WHITE} fontSize="9" opacity="0.5" y="110" dy="0">P</text>
      <text x="68"  cy="210" textAnchor="middle" fill={WHITE} fontSize="9" opacity="0.5" y="210" dy="0">P</text>
      <text x="116" cy="160" textAnchor="middle" fill={WHITE} fontSize="9" opacity="0.5" y="165" dy="0">P</text>
      <text x="764" cy="110" textAnchor="middle" fill={WHITE} fontSize="9" opacity="0.5" y="110" dy="0">P</text>
      <text x="764" cy="210" textAnchor="middle" fill={WHITE} fontSize="9" opacity="0.5" y="210" dy="0">P</text>
      <text x="812" cy="160" textAnchor="middle" fill={WHITE} fontSize="9" opacity="0.5" y="165" dy="0">P</text>

      {/* Animated packet dot */}
      {active && (
        <circle r="5" fill={CYAN} opacity="0.9" className="arch-packet">
          <animateMotion
            dur="4.5s"
            repeatCount="indefinite"
            path="M68,160 L116,160 L172,160 L192,160 L256,160 L440,160 L590,160 L668,160 L708,160 L764,160"
          />
        </circle>
      )}
    </svg>
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
    name: 'ttl', offset: 'B18', size: '1 byte', color: WHITE,
    desc: 'Time-to-Live hop budget. Set to 5 at the origin device. Each relay decrements TTL by 1 before forwarding. When TTL reaches 0 the packet is silently dropped, preventing infinite routing loops in mesh cycles.',
  },
  hopCount: {
    name: 'hopCount', offset: 'B19', size: '1 byte', color: WHITE,
    desc: 'Hop counter. Starts at 0 at the origin. Incremented by every relay node. Lets the destination measure the actual path length and allows the UI to display delivery distance (e.g. "delivered in 3 hops").',
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
    desc: 'Length of the payload field in bytes (valid range: 0–208). Allows the parser to read exactly the right number of bytes following the 42-byte fixed header without relying on a frame delimiter or total-length field.',
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
                  <strong style={{ color: 'rgba(246,248,255,0.88)' }}>{b.name}</strong>
                  {' '}— {b.desc}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="pf-detail-hint">Press ESC or click a field again to close</p>
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

  const hf: { id: FieldKey; bytes: string; w: number }[] = [
    { id: 'version',    bytes: '1B', w: 30 },
    { id: 'type',       bytes: '1B', w: 30 },
    { id: 'msgId',      bytes: '8B', w: 70 },
    { id: 'senderId',   bytes: '4B', w: 48 },
    { id: 'receiverId', bytes: '4B', w: 48 },
    { id: 'ttl',        bytes: '1B', w: 30 },
    { id: 'hopCount',   bytes: '1B', w: 30 },
    { id: 'timestamp',  bytes: '4B', w: 48 },
    { id: 'flags',      bytes: '1B', w: 30 },
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

  const ticks: { bx: number; label: string }[] = [
    { bx: MX,           label: 'B0'  },
    { bx: MX + 60,      label: 'B2'  },
    { bx: MX + 130,     label: 'B10' },
    { bx: MX + 178,     label: 'B14' },
    { bx: MX + 226,     label: 'B18' },
    { bx: MX + 256,     label: 'B19' },
    { bx: MX + 286,     label: 'B20' },
    { bx: MX + 334,     label: 'B24' },
    { bx: AX,           label: 'B26' },
    { bx: PX,           label: 'B42' },
  ];

  const isSel = (id: FieldKey) => selectedField === id;
  const isHov = (id: FieldKey) => hoveredField === id && selectedField !== id;

  const hFill = (id: FieldKey) =>
    isSel(id) ? 'rgba(0,188,212,0.15)'  :
    isHov(id) ? 'rgba(246,248,255,0.07)' :
                'rgba(246,248,255,0.025)';

  const toggle = (id: FieldKey) => setSelectedField(p => p === id ? null : id);

  return (
    <div className={`packet-format-wrap ${active ? 'is-active' : ''}`}>
      <svg
        className="packet-svg"
        viewBox={`0 0 ${VW} 300`}
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
          fill="none" stroke="rgba(246,248,255,0.14)" strokeWidth="1"
          style={{ pointerEvents: 'none' }} />

        {/* Dividers + field labels */}
        {hf.map((f, i) => {
          const fx = fxs[i];
          const cx = fx + f.w / 2;
          const cy = BY + BH / 2;
          const narrow = f.w < 44;
          const sel = isSel(f.id);
          return (
            <g key={i} className={`packet-field pf-${i}`} style={{ pointerEvents: 'none' }}>
              {i > 0 && (
                <line x1={fx} y1={BY+7} x2={fx} y2={BB-7}
                  stroke="rgba(246,248,255,0.1)" strokeWidth="0.8" />
              )}
              {narrow ? (
                <text x={cx} y={cy+2} textAnchor="middle" dominantBaseline="middle"
                  fill={sel ? CYAN : 'rgba(246,248,255,0.72)'}
                  fontSize="10" fontFamily="var(--font-mono,monospace)"
                  transform={`rotate(-90,${cx},${cy})`}>
                  {f.id}
                </text>
              ) : (
                <>
                  <text x={cx} y={cy-7} textAnchor="middle"
                    fill={sel ? CYAN : 'rgba(246,248,255,0.8)'}
                    fontSize="11" fontFamily="var(--font-mono,monospace)">
                    {f.id}
                  </text>
                  <text x={cx} y={cy+11} textAnchor="middle"
                    fill="rgba(246,248,255,0.35)" fontSize="9.5"
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

        {/* ── Bracket labels (non-interactive) ── */}
        <g style={{ pointerEvents: 'none' }}>
          <line x1={MX}    y1={BY-24} x2={MX+HW} y2={BY-24} stroke="rgba(246,248,255,0.18)" strokeWidth="0.8" />
          <line x1={MX}    y1={BY-24} x2={MX}    y2={BY-13} stroke="rgba(246,248,255,0.18)" strokeWidth="0.8" />
          <line x1={MX+HW} y1={BY-24} x2={MX+HW} y2={BY-13} stroke="rgba(246,248,255,0.18)" strokeWidth="0.8" />
          <text x={MX+HW/2} y={BY-28} textAnchor="middle"
            fill="rgba(246,248,255,0.32)" fontSize="8.5" fontFamily="var(--font-mono,monospace)" letterSpacing="0.08em">
            PLAINTEXT HEADER · 26 B · RELAY CAN READ
          </text>

          <line x1={AX}    y1={BY-24} x2={PX+PW} y2={BY-24} stroke={CYAN} strokeWidth="0.8" opacity="0.4" />
          <line x1={AX}    y1={BY-24} x2={AX}    y2={BY-13} stroke={CYAN} strokeWidth="0.8" opacity="0.4" />
          <line x1={PX+PW} y1={BY-24} x2={PX+PW} y2={BY-13} stroke={CYAN} strokeWidth="0.8" opacity="0.4" />
          <text x={AX+(AW+GAP+PW)/2} y={BY-28} textAnchor="middle"
            fill={CYAN} fontSize="8.5" fontFamily="var(--font-mono,monospace)" letterSpacing="0.08em" opacity="0.65">
            AES-128-GCM AUTHENTICATED · ≤224 B · RELAY CANNOT READ
          </text>
        </g>

        {/* ── Byte offset ticks ── */}
        {ticks.map((t, i) => (
          <g key={i} style={{ pointerEvents: 'none' }}>
            <line x1={t.bx} y1={BB} x2={t.bx} y2={BB+11} stroke="rgba(246,248,255,0.12)" strokeWidth="0.7" />
            <text x={t.bx} y={BB+22} textAnchor="middle"
              fill="rgba(246,248,255,0.26)" fontSize="8.5" fontFamily="var(--font-mono,monospace)">
              {t.label}
            </text>
          </g>
        ))}

        {/* Total cap + hint */}
        <text x={VW/2} y={BB+42} textAnchor="middle"
          fill="rgba(246,248,255,0.18)" fontSize="9.5"
          fontFamily="var(--font-mono,monospace)" letterSpacing="0.08em"
          style={{ pointerEvents: 'none' }}>
          42 B FIXED HEADER + 0–208 B PAYLOAD · 250 B TOTAL CAP · PacketSerializer.kt
        </text>

        {!selectedField && (
          <text x={VW/2} y={BB+60} textAnchor="middle"
            fill="rgba(246,248,255,0.22)" fontSize="9"
            fontFamily="var(--font-mono,monospace)" letterSpacing="0.12em"
            className="pf-click-hint-svg"
            style={{ pointerEvents: 'none' }}>
            ↑ CLICK ANY FIELD TO EXPLORE ↑
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

// ─── Slide 11: Key Metrics (6-metric grid) ───────────────────────────────────
function NumbersSlide({ visibleCount }: { visibleCount: number }) {
  const metrics = [
    { value: '<2',    unit: 's',   label: 'END-TO-END LATENCY',        sub: 'measured across 5 hops in testing',          color: CYAN },
    { value: '1,500', unit: 'm',   label: 'LONGEST OFFLINE DELIVERY',  sub: 'no infrastructure, real hardware',            color: GOLD },
    { value: '30',    unit: 'm',   label: 'BLE PER-HOP RANGE',         sub: 'LE Coded PHY, SF=8 — indoor tested',          color: CYAN },
    { value: '3',     unit: 'km',  label: 'LORA BRIDGE RANGE',         sub: 'line-of-sight, urban environment',            color: GOLD },
    { value: '250',   unit: 'B',   label: 'PACKET SIZE CAP',           sub: 'optimized for LoRa airtime constraints',      color: CYAN },
    { value: '5',     unit: '',    label: 'MAX HOP COUNT (TTL)',        sub: 'flood-limited, seen_msg_ids dedup at 200',   color: GOLD },
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
      <p className={`numbers-footer ${visibleCount >= 6 ? 'is-visible' : ''}`}>
        Real measurements. Real hardware. Real results.
      </p>
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
        <line x1="162" y1="150" x2="260" y2="150" stroke="rgba(246,248,255,0.35)" strokeWidth="1.2" />
        <line x1="320" y1="150" x2="420" y2="150" stroke="rgba(246,248,255,0.35)" strokeWidth="1.2" />
        <line x1="480" y1="150" x2="580" y2="150" stroke="rgba(246,248,255,0.35)" strokeWidth="1.2" />
        <line x1="640" y1="150" x2="804" y2="150" stroke="rgba(246,248,255,0.35)" strokeWidth="1.2" />
        <g transform="translate(70 72)"><AndroidPhoneIcon compact /></g>
        <g transform="translate(780 72)"><AndroidPhoneIcon compact /></g>
        {[292, 452, 612].map((x, idx) => (
          <g key={x}>
            <rect x={x} y={98} width="44" height="84" rx="10" fill="#111620" stroke="rgba(246,248,255,0.62)" strokeWidth="1.6" />
            <circle cx={x + 22} cy={170} r="3" fill="rgba(246,248,255,0.64)" />
            <g className={`crypto-no-read r${idx + 1}`}>
              <circle cx={x + 22} cy={76} r="13" fill="rgba(16,20,29,0.96)" stroke="rgba(246,248,255,0.38)" strokeWidth="1" />
              <path d={`M${x + 13} 76h18`} stroke="rgba(246,248,255,0.64)" strokeWidth="1.2" />
              <path d={`M${x + 15} 70c2-2 4-3 7-3s5 1 7 3`} stroke="rgba(246,248,255,0.58)" strokeWidth="1" fill="none" />
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
        <p className="line1">Keys exchanged out-of-band via QR code — never transmitted over the mesh</p>
        <p className="line2">Curve25519 ECDH · HKDF-SHA256 · AES-128-GCM</p>
        <p className="line3">Zero plaintext exposure at intermediate relay nodes</p>
      </div>
      <p className="crypto-footer">Even if a relay is compromised, your message remains private.</p>
    </div>
  );
}

// ─── Slide 13: Security Deep Dive ────────────────────────────────────────────
function SecurityDeepDiveAnimation({ replayKey }: { replayKey: number }) {
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
          <line x1="96" y1="98" x2="200" y2="88" stroke="rgba(246,248,255,0.2)" strokeWidth="1" />
          <line x1="310" y1="88" x2="355" y2="88" stroke="rgba(246,248,255,0.2)" strokeWidth="1" />
          <line x1="465" y1="88" x2="510" y2="88" stroke="rgba(246,248,255,0.2)" strokeWidth="1" />
          <line x1="620" y1="88" x2="724" y2="98" stroke="rgba(246,248,255,0.2)" strokeWidth="1" />

          {/* Traveling key dot */}
          <circle r="5" fill={GOLD} className="sdp-keydot">
            <animateMotion dur="3.2s" repeatCount="indefinite"
              path="M96,98 L200,88 L310,88 L355,88 L465,88 L510,88 L620,88 L724,98" />
          </circle>

          {/* QR label */}
          <text x="68"  y="168" textAnchor="middle" fill={CYAN} fontSize="9" opacity="0.55" fontFamily="var(--font-mono,monospace)">PHONE A</text>
          <text x="752" y="168" textAnchor="middle" fill={CYAN} fontSize="9" opacity="0.55" fontFamily="var(--font-mono,monospace)">PHONE B</text>
          <text x="410" y="155" textAnchor="middle" fill="rgba(246,248,255,0.3)" fontSize="9" fontFamily="var(--font-mono,monospace)">QR SCAN OUT-OF-BAND · KEY NEVER CROSSES THE MESH</text>
        </svg>
      </div>

      {/* ── Threat model ── */}
      <div className="sec-threat-grid">
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
  { title: 'Install App', desc: 'APK installs in seconds. No account, no sign-up, no server connection required.' },
  { title: 'Key Generation', desc: 'On first launch the device auto-generates a Curve25519 keypair. Your cryptographic identity is born on-device.' },
  { title: 'QR Exchange', desc: 'Scan a peer\'s QR code to exchange public keys out-of-band. Keys never travel over the radio.' },
  { title: 'Network Tab', desc: 'See the live mesh — nodes, hop counts, RSSI, and which ones are LoRa-extended reach.' },
  { title: 'Start Chatting', desc: 'AES-128-GCM encrypted on your device. Relay nodes forward ciphertext they cannot read.' },
  { title: 'Settings', desc: 'Tune transmit power, hop count, relay mode, and inspect your node ID and key fingerprint.' },
];

function LiveDemoSlide({ isActive }: { isActive: boolean }) {
  const [winPos, setWinPos] = useState({ x: -9999, y: 0 });
  const [winSize, setWinSize] = useState({ w: 340, h: 620 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const resizeRef = useRef<{ sx: number; sy: number; ow: number; oh: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    setWinPos({ x: Math.round(r.width * 0.52), y: Math.round((r.height - 620) / 2) });
  }, []);

  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: winPos.x, oy: winPos.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setWinPos({ x: dragRef.current.ox + ev.clientX - dragRef.current.sx, y: dragRef.current.oy + ev.clientY - dragRef.current.sy });
    };
    const onUp = () => { dragRef.current = null; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const onResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { sx: e.clientX, sy: e.clientY, ow: winSize.w, oh: winSize.h };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      setWinSize({ w: Math.max(280, resizeRef.current.ow + ev.clientX - resizeRef.current.sx), h: Math.max(400, resizeRef.current.oh + ev.clientY - resizeRef.current.sy) });
    };
    const onUp = () => { resizeRef.current = null; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div className="demo-slide" ref={containerRef}>
      <div className="demo-steps-panel">
        <div className="hook-label">LIVE DEMO</div>
        <h2 className="demo-steps-heading">See it in action.</h2>
        <p className="demo-steps-sub">Your teammates have the real app running — follow along on screen.</p>
        <ol className="demo-steps-list">
          {DEMO_STEPS.map((step, i) => (
            <li key={i} className="demo-step-item">
              <div className="demo-step-num">{i + 1}</div>
              <div className="demo-step-body">
                <div className="demo-step-title">{step.title}</div>
                <div className="demo-step-desc">{step.desc}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {winPos.x > -9999 && (
        <div className="demo-float-win" style={{ left: winPos.x, top: winPos.y, width: winSize.w, height: winSize.h }}>
          <div className="demo-win-titlebar" onMouseDown={onDragStart}>
            <div className="demo-win-dots">
              <span className="demo-win-dot" style={{ background: '#ff5f57' }} />
              <span className="demo-win-dot" style={{ background: '#febc2e' }} />
              <span className="demo-win-dot" style={{ background: '#28c840' }} />
            </div>
            <div className="demo-win-label">Peer Reach · Android App</div>
            <div className="demo-win-grab-hint">drag to move</div>
          </div>
          <iframe
            src="/peerreach-mockup.html"
            className="demo-win-iframe"
            title="Peer Reach App"
            sandbox="allow-scripts allow-same-origin"
          />
          <div className="demo-win-resizer" onMouseDown={onResizeStart} title="Drag to resize" />
        </div>
      )}
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
  const [cryptoReplayKey,      setCryptoReplayKey]       = useState(0);
  const [secDeepReplayKey,     setSecDeepReplayKey]      = useState(0);
  const [archActive,           setArchActive]            = useState(false);
  const [packetActive,         setPacketActive]          = useState(false);
  const [openComponent,        setOpenComponent]         = useState<ComponentKey | null>(null);

  // Indices after restructure:
  // 0 cover | 1 abstract | 2 problem | 3 insight | 4 range | 5 solution
  // 6 related | 7 components | 8 architecture | 9 packet | 10 numbers
  // 11 security | 12 security-deep | 13 transition

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

  // Problem list (index 2)
  useEffect(() => {
    if (currentSectionIndex !== 2 || showProblemList) return;
    const t = window.setTimeout(() => setShowProblemList(true), 800);
    return () => window.clearTimeout(t);
  }, [currentSectionIndex, showProblemList]);

  // Related table (index 6)
  useEffect(() => {
    if (currentSectionIndex !== 6) return;
    const t = window.setTimeout(() => setShowRelatedTable(true), 400);
    return () => window.clearTimeout(t);
  }, [currentSectionIndex]);

  // Architecture active (index 9)
  useEffect(() => {
    setArchActive(currentSectionIndex === 9);
  }, [currentSectionIndex]);

  // Packet active (index 10)
  useEffect(() => {
    setPacketActive(currentSectionIndex === 10);
  }, [currentSectionIndex]);

  // Numbers (index 11)
  useEffect(() => {
    if (currentSectionIndex !== 11) { setVisibleNumberCount(0); return; }
    setVisibleNumberCount(0);
    const ts = [120, 280, 440, 600, 760, 920].map((ms, i) =>
      window.setTimeout(() => setVisibleNumberCount(i + 1), ms)
    );
    return () => ts.forEach(t => window.clearTimeout(t));
  }, [currentSectionIndex]);

  // Security overview (index 12)
  useEffect(() => {
    if (currentSectionIndex === 12) setCryptoReplayKey(k => k + 1);
  }, [currentSectionIndex]);

  // Security deep dive (index 13)
  useEffect(() => {
    if (currentSectionIndex === 13) setSecDeepReplayKey(k => k + 1);
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
    <div className="intro-shell" style={{ background: DEEP_BLACK }}>
      <div ref={scrollerRef} className="intro-scroll-root">

        {/* ── Slide 1: Cover ── */}
        <SectionFrame id="cover" isActive={currentSectionIndex === 0}>
          <AmbientBackground />
          <div className="intro-overlay" />
          <div className={`cover-content intro-content ${dir}`}>
            <h1 className={`cover-title ${mounted ? 'is-visible' : ''}`}>PEER REACH</h1>
            <div className={`cover-kicker ${mounted ? 'is-visible' : ''}`}>
              OFFLINE · DECENTRALIZED · PEER-TO-PEER COMMUNICATION
            </div>
            <p className={`cover-abstract ${mounted ? 'is-visible' : ''}`}>
              A hybrid BLE-LoRa mesh protocol enabling encrypted, infrastructure-free messaging across smartphones and embedded devices — no internet required.
            </p>
          </div>
          <div className={`cover-scroll-cue ${mounted && !hideScrollCue ? 'is-visible' : ''}`}>
            <div className="scroll-line"><span className="scroll-dot" /></div>
            <div className="scroll-label">SCROLL TO EXPLORE</div>
          </div>
        </SectionFrame>

        {/* ── Slide 2: Abstract ── */}
        <SectionFrame id="hook-abstract" isActive={currentSectionIndex === 1}>
          <div className={`hook-inner intro-content ${dir}`}>
            <div className="hook-label">THESIS OVERVIEW</div>
            <h2>What we built. What we proved.</h2>
            <AbstractSlide />
          </div>
        </SectionFrame>

        {/* ── Slide 3: Problem ── */}
        <SectionFrame id="hook-problem" isActive={currentSectionIndex === 2}>
          <div className={`hook-inner intro-content ${dir}`}>
            <div className="hook-label">ACT 1 · THE PROBLEM</div>
            <h2>When infrastructure fails, communication dies.</h2>
            <ProblemList visible={showProblemList} />
            <p className="hook-subline">Existing solutions depend on infrastructure that isn't always there.</p>
          </div>
        </SectionFrame>

        {/* ── Slide 4: Insight ── */}
        <SectionFrame id="hook-insight" isActive={currentSectionIndex === 3}>
          <div className={`hook-inner intro-content ${dir}`}>
            <h2>Every device in your pocket is a radio.</h2>
            <InsightAnimation />
            <p className="hook-subline">Bluetooth Low Energy lets devices talk directly — no towers, no internet, no middleman.</p>
          </div>
        </SectionFrame>

        {/* ── Slide 5: Range Problem ── */}
        <SectionFrame id="hook-range" isActive={currentSectionIndex === 4}>
          <div className={`hook-inner intro-content ${dir}`}>
            <h2>But Bluetooth only reaches ~30 meters.</h2>
            <RangeFailureAnimation />
            <p className="hook-subline">In large areas, BLE clusters are isolated — the gap between them cannot be bridged by BLE alone.</p>
          </div>
        </SectionFrame>

        {/* ── Slide 6: Solution ── */}
        <SectionFrame id="hook-solution" isActive={currentSectionIndex === 5}>
          <div className={`hook-inner intro-content ${dir}`}>
            <h2>So we extended the range by 50×.</h2>
            <SolutionAnimation />
            <p className="hook-subline">LoRa bridges distant BLE clusters up to 1,500 m tested — 3 km line-of-sight. The result: a city-scale offline mesh.</p>
          </div>
        </SectionFrame>

        {/* ── Slide 7: Related Work ── */}
        <SectionFrame id="hook-related" isActive={currentSectionIndex === 6}>
          <div className={`hook-inner intro-content ${dir}`} style={{ width: 'min(1100px, 100%)' }}>
            <div className="hook-label">POSITIONING</div>
            <h2>Why not just use what exists?</h2>
            <RelatedWorkTable visible={showRelatedTable} />
          </div>
        </SectionFrame>

        {/* ── Slide 8: Components ── */}
        <SectionFrame id="hook-components" isActive={currentSectionIndex === 7}>
          <div className={`hook-inner hook-components intro-content ${dir}`}>
            <h2>Three components. One mesh.</h2>
            <p className="hook-subline">Each plays a distinct role in the network.</p>
            <ComponentsCards visible={currentSectionIndex === 7} onOpen={setOpenComponent} />
          </div>
        </SectionFrame>

        {/* ── Slide 9: Live Demo ── */}
        <SectionFrame id="hook-demo" isActive={currentSectionIndex === 8}>
          <LiveDemoSlide isActive={currentSectionIndex === 8} />
        </SectionFrame>

        {/* ── Slide 10: Architecture ── */}
        <SectionFrame id="hook-architecture" isActive={currentSectionIndex === 9}>
          <div className={`hook-inner intro-content ${dir}`} style={{ width: 'min(1000px, 100%)' }}>
            <div className="hook-label">SYSTEM DESIGN</div>
            <h2>The full topology.</h2>
            <ArchitectureDiagram active={archActive} />
            <p className="hook-subline">Two BLE clusters, one LoRa bridge. The inter-cluster hop is completely transparent to end nodes — they see only BLE.</p>
          </div>
        </SectionFrame>

        {/* ── Slide 11: Packet Format ── */}
        <SectionFrame id="hook-packet" isActive={currentSectionIndex === 10}>
          <div className={`hook-inner intro-content ${dir}`} style={{ width: 'min(960px, 100%)' }}>
            <div className="hook-label">PROTOCOL DESIGN</div>
            <h2>Every byte has a purpose.</h2>
            <PacketFormatDiagram active={packetActive} />
            <p className="hook-subline">250-byte cap optimized for LoRa airtime constraints. Only the nonce and ciphertext cross the relay — plaintext never leaves the originating device.</p>
          </div>
        </SectionFrame>

        {/* ── Slide 12: Numbers ── */}
        <SectionFrame id="hook-numbers" isActive={currentSectionIndex === 11}>
          <div className={`hook-inner hook-numbers intro-content ${dir}`}>
            <NumbersSlide visibleCount={visibleNumberCount} />
          </div>
        </SectionFrame>

        {/* ── Slide 13: Security Overview ── */}
        <SectionFrame id="hook-security" isActive={currentSectionIndex === 12}>
          <div className={`hook-inner intro-content ${dir}`}>
            <h2>No relay ever reads your message.</h2>
            <p className="hook-subline">End-to-end encrypted. Always.</p>
            <EncryptionFlowAnimation replayKey={cryptoReplayKey} />
          </div>
        </SectionFrame>

        {/* ── Slide 14: Security Deep Dive ── */}
        <SectionFrame id="hook-security-deep" isActive={currentSectionIndex === 13}>
          <div className={`hook-inner intro-content ${dir}`} style={{ width: 'min(1060px, 100%)' }}>
            <div className="hook-label">SECURITY DEEP DIVE</div>
            <h2>The key never crosses the air.</h2>
            <SecurityDeepDiveAnimation replayKey={secDeepReplayKey} />
          </div>
        </SectionFrame>

        {/* ── Slide 15: Transition ── */}
        <SectionFrame id="hook-transition" isActive={currentSectionIndex === 14}>
          <div className={`hook-inner transition-inner intro-content ${dir}`}>
            <div className="hook-label">ACT 2 · EXPLAINER</div>
            <h2>This is Peer Reach.</h2>
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
