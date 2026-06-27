import type { Scenario } from '../lib/scenarios';

interface Props {
  scenarios: Scenario[];
  activeId: number;
  onSelect: (id: number) => void;
}

// Scenario type icons as simple SVG inline
function ScenarioIcon({ id }: { id: number }) {
  switch (id) {
    case 1:
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="3" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="15" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
          <line x1="5" y1="9" x2="7" y2="9" stroke="currentColor" strokeWidth="1.5" />
          <line x1="11" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 2:
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="3" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="15" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
          <line x1="5" y1="9" x2="7" y2="9" stroke="currentColor" strokeWidth="1.5" />
          <line x1="11" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.4" />
          <line x1="13" y1="6" x2="17" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        </svg>
      );
    case 3:
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="3" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="15" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
          <line x1="5" y1="9" x2="6" y2="9" stroke="currentColor" strokeWidth="1.5" />
          <line x1="12" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.5" />
          <line x1="6" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5" opacity="0.6" />
        </svg>
      );
    case 4:
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="6" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="16" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <line x1="8" y1="6" x2="10" y2="9" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <line x1="8" y1="12" x2="10" y2="9" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <line x1="14" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.5 1.5" opacity="0.5" />
        </svg>
      );
    case 5:
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="3" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="15" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
          <line x1="5" y1="9" x2="7.5" y2="5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="5" y1="9" x2="7.5" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="11" y1="4" x2="13" y2="7" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="11" y1="14" x2="13" y2="11" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>
      );
    case 7:
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="3" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="15" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
          <line x1="5" y1="9" x2="7" y2="9" stroke="currentColor" strokeWidth="1.5" />
          <line x1="11" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.5" />
          {/* Power off cross */}
          <line x1="13" y1="6" x2="17" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <line x1="17" y1="6" x2="13" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        </svg>
      );
    default:
      return <span className="text-xs font-mono">{id}</span>;
  }
}

export default function ScenarioSidebar({ scenarios, activeId, onSelect }: Props) {
  return (
    <aside
      className="flex flex-col h-full"
      style={{
        width: 260,
        minWidth: 220,
        maxWidth: 280,
        background: 'hsl(var(--sidebar))',
        borderRight: '1px solid hsl(var(--sidebar-border))',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 20px 16px' }}>
        {/* Logo */}
        <div className="flex items-center gap-2 mb-1">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-label="Peer Reach logo">
            <polygon points="11,2 20,7 20,15 11,20 2,15 2,7" fill="none" stroke="white" strokeWidth="1.5" />
            <circle cx="11" cy="11" r="3" fill="none" stroke="white" strokeWidth="1.5" />
            <line x1="11" y1="2" x2="11" y2="8" stroke="white" strokeWidth="1" opacity="0.5" />
            <line x1="20" y1="7" x2="14.2" y2="9.4" stroke="white" strokeWidth="1" opacity="0.5" />
            <line x1="20" y1="15" x2="14.2" y2="12.6" stroke="white" strokeWidth="1" opacity="0.5" />
          </svg>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: 'hsl(var(--foreground))' }}>
            Peer Reach
          </span>
        </div>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'hsl(var(--muted-foreground))', letterSpacing: '0.08em', marginTop: 2 }}>
          BLE / LoRa NETWORK
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'hsl(var(--sidebar-border))', margin: '0 0 8px' }} />

      {/* Section label */}
      <div style={{ padding: '8px 20px 4px' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>
          Scenarios
        </span>
      </div>

      {/* Scenario list */}
      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto" style={{ padding: '4px 10px 16px' }}>
        {scenarios.map(s => {
          const isActive = s.id === activeId;
          return (
            <button
              key={s.id}
              data-testid={`scenario-btn-${s.id}`}
              onClick={() => onSelect(s.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                border: isActive ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s, border-color 0.15s',
                color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }
              }}
            >
              {/* Icon */}
              <div style={{ marginTop: 1, flexShrink: 0, opacity: isActive ? 1 : 0.5 }}>
                <ScenarioIcon id={s.id} />
              </div>

              {/* Text */}
              <div>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 13,
                  lineHeight: 1.3,
                  marginBottom: 2,
                }}>
                  {s.title}
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  opacity: 0.55,
                  lineHeight: 1.4,
                }}>
                  {s.subtitle}
                </div>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div style={{
                  marginLeft: 'auto',
                  flexShrink: 0,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.6)',
                  marginTop: 5,
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid hsl(var(--sidebar-border))' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'hsl(var(--muted-foreground))', opacity: 0.5, letterSpacing: '0.05em', lineHeight: 1.6 }}>
          BLE Mesh Thesis Simulator<br />
          v1.0.0 — Frontend Only
        </div>
      </div>
    </aside>
  );
}
