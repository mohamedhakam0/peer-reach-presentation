import type { Scenario } from '../lib/scenarios';

interface Props {
  scenario: Scenario;
  stepIndex: number;
  speed: number;
  isAutoPlay: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSpeedChange: (v: number) => void;
  onAutoPlayToggle: () => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 3];

function formatSpeed(v: number): string {
  return v === 1 ? '1×' : `${v}×`;
}

export default function StepControls({ scenario, stepIndex, speed, isAutoPlay, onPrev, onNext, onSpeedChange, onAutoPlayToggle }: Props) {
  const step = scenario.steps[stepIndex];
  const totalSteps = scenario.steps.length;
  const hasPrev = stepIndex > 0;
  const hasNext = stepIndex < totalSteps - 1;

  // Map speed to slider position (0–5 for 6 options)
  const sliderIndex = SPEED_OPTIONS.indexOf(speed);
  const sliderValue = sliderIndex >= 0 ? sliderIndex : 2;

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value, 10);
    onSpeedChange(SPEED_OPTIONS[idx]);
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: 280,
        minWidth: 240,
        maxWidth: 300,
        background: 'hsl(var(--card))',
        borderLeft: '1px solid hsl(var(--card-border))',
        padding: '20px 18px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          letterSpacing: '0.1em',
          color: 'hsl(var(--muted-foreground))',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          {scenario.title}
        </div>
        <h2 style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: 16,
          lineHeight: 1.25,
          color: 'hsl(var(--foreground))',
          letterSpacing: '-0.01em',
          margin: 0,
        }}>
          {step?.title ?? '—'}
        </h2>
      </div>

      {/* Step counter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 4 }}>
          {scenario.steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === stepIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === stepIndex
                  ? 'rgba(255,255,255,0.85)'
                  : i < stepIndex
                    ? 'rgba(255,255,255,0.35)'
                    : 'rgba(255,255,255,0.12)',
                transition: 'width 0.2s, background 0.2s',
              }}
            />
          ))}
        </div>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          color: 'hsl(var(--muted-foreground))',
          marginLeft: 2,
        }}>
          {stepIndex + 1}/{totalSteps}
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'hsl(var(--border))', marginBottom: 16 }} />

      {/* Description */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 20 }}>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          lineHeight: 1.65,
          color: 'hsl(var(--muted-foreground))',
          margin: 0,
        }}>
          {step?.description ?? ''}
        </p>
      </div>

      {/* Legend */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 8,
        padding: '10px 12px',
        marginBottom: 18,
      }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
          PACKET TYPES
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { color: '#67e8f9', label: 'BLE advertisement' },
            { color: '#fcd34d', label: 'LoRa transmission' },
            { color: '#86efac', label: 'ACK packet' },
            { color: '#c4b5fd', label: 'HELLO beacon' },
            { color: '#f87171', label: 'Dropped / duplicate' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 8, height: 8,
                borderRadius: '50%',
                background: item.color,
                flexShrink: 0,
                boxShadow: `0 0 4px ${item.color}`,
              }} />
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                color: 'hsl(var(--muted-foreground))',
                opacity: 0.7,
              }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Speed control */}
      <div style={{ marginBottom: 18 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.08em',
            color: 'hsl(var(--muted-foreground))',
          }}>
            SPEED
          </span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13,
            fontWeight: 600,
            color: 'hsl(var(--foreground))',
          }}>
            {formatSpeed(speed)}
          </span>
        </div>
        <input
          data-testid="speed-slider"
          type="range"
          min={0}
          max={5}
          step={1}
          value={sliderValue}
          onChange={handleSlider}
          style={{
            width: '100%',
            height: 4,
            appearance: 'none',
            background: `linear-gradient(to right, var(--slider-filled) 0%, var(--slider-filled) ${(sliderValue / 5) * 100}%, var(--slider-unfilled) ${(sliderValue / 5) * 100}%, var(--slider-unfilled) 100%)`,
            borderRadius: 2,
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 4,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          color: 'var(--slider-end-label)',
        }}>
          <span>0.25×</span>
          <span>3×</span>
        </div>
      </div>

      {/* Auto-play toggle */}
      <div style={{ marginBottom: 10 }}>
        <button
          data-testid="btn-autoplay"
          onClick={onAutoPlayToggle}
          style={{
            width: '100%',
            padding: '9px 0',
            border: `1px solid ${isAutoPlay ? 'rgba(103,232,249,0.5)' : 'rgba(255,255,255,0.14)'}`,
            borderRadius: 8,
            background: isAutoPlay
              ? 'rgba(103,232,249,0.1)'
              : 'rgba(255,255,255,0.05)',
            color: isAutoPlay ? '#67e8f9' : 'rgba(255,255,255,0.65)',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            letterSpacing: '0.06em',
            transition: 'background 0.2s, border-color 0.2s, color 0.2s',
            boxShadow: isAutoPlay ? '0 0 10px rgba(103,232,249,0.15)' : 'none',
          }}
        >
          {isAutoPlay ? (
            <>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
                <rect x="1" y="1" width="3" height="9" rx="1"/>
                <rect x="7" y="1" width="3" height="9" rx="1"/>
              </svg>
              PAUSE
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
                <path d="M2 1.5L9.5 5.5L2 9.5V1.5Z"/>
              </svg>
              AUTO PLAY
            </>
          )}
        </button>
      </div>

      {/* Prev / Next */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          data-testid="btn-prev"
          onClick={onPrev}
          disabled={!hasPrev}
          style={{
            flex: 1,
            padding: '10px 0',
            border: `1px solid ${hasPrev ? 'var(--step-prev-btn-border)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 8,
            background: hasPrev ? 'var(--step-prev-btn-bg)' : 'transparent',
            color: hasPrev ? 'var(--step-prev-btn-text)' : 'rgba(255,255,255,0.2)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: 13,
            cursor: hasPrev ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s, color 0.15s, border-color 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            flexDirection: 'column',
          }}
          onMouseEnter={e => hasPrev && ((e.currentTarget as HTMLButtonElement).style.background = 'var(--step-prev-btn-bg-hover)')}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = hasPrev ? 'var(--step-prev-btn-bg)' : 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Prev
          </div>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            opacity: 0.4,
            letterSpacing: '0.05em',
          }}>← key</span>
        </button>
        <button
          data-testid="btn-next"
          onClick={onNext}
          disabled={!hasNext}
          style={{
            flex: 1,
            padding: '10px 0',
            border: `1px solid ${hasNext ? 'var(--step-nav-btn-border)' : 'rgba(255,255,255,0.2)'}`,
            borderRadius: 8,
            background: hasNext ? 'var(--step-nav-btn-bg)' : 'transparent',
            color: hasNext ? 'var(--step-nav-btn-text)' : 'rgba(255,255,255,0.2)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: 13,
            cursor: hasNext ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s, color 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            flexDirection: 'column',
          }}
          onMouseEnter={e => hasNext && ((e.currentTarget as HTMLButtonElement).style.background = 'var(--step-nav-btn-bg-hover)')}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = hasNext ? 'var(--step-nav-btn-bg)' : 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            Next
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            opacity: 0.4,
            letterSpacing: '0.05em',
          }}>→ key</span>
        </button>
      </div>
    </div>
  );
}
