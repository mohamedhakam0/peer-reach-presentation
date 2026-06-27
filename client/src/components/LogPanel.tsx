import { useEffect, useRef } from 'react';
import type { LogEntry } from '../lib/scenarios';

interface Props {
  entries: LogEntry[];
}

const COLOR_MAP: Record<LogEntry['color'], string> = {
  white: 'var(--text-secondary)',
  cyan:  '#67e8f9',
  amber: '#fcd34d',
  green: '#86efac',
  red:   '#f87171',
};

const BG_MAP: Record<LogEntry['color'], string> = {
  white: 'transparent',
  cyan:  'rgba(103,232,249,0.04)',
  amber: 'rgba(252,211,77,0.04)',
  green: 'rgba(134,239,172,0.04)',
  red:   'rgba(248,113,113,0.04)',
};

export default function LogPanel({ entries }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div
      data-testid="log-panel"
      style={{
        height: 180,
        background: 'var(--log-panel-bg)',
        borderTop: '1px solid hsl(var(--border))',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 16px',
        borderBottom: '1px solid var(--panel-border)',
        flexShrink: 0,
      }}>
        {/* Status dot */}
        <div style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: '#86efac',
          boxShadow: '0 0 6px #86efac',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.1em',
          color: 'var(--text-muted)',
        }}>
          ENGINEER LOG
        </span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          color: 'var(--text-faint)',
        }}>
          {entries.length} entries
        </span>
      </div>

      {/* Entries */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '6px 0 4px',
        }}
      >
        {entries.length === 0 ? (
          <div style={{
            padding: '16px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: 'var(--text-faint)',
          }}>
            Waiting for step...
          </div>
        ) : (
          entries.map((entry, i) => {
            const color = COLOR_MAP[entry.color];
            const bg = BG_MAP[entry.color];
            const isLast = i === entries.length - 1;
            return (
              <div
                key={i}
                className="log-entry"
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 0,
                  padding: '3px 16px',
                  background: isLast ? bg : 'transparent',
                  borderLeft: isLast ? `2px solid ${color}` : '2px solid transparent',
                  marginLeft: 0,
                  transition: 'background 0.15s',
                }}
              >
                {/* Timestamp */}
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  color: 'var(--text-faint)',
                  flexShrink: 0,
                  marginRight: 10,
                  minWidth: 72,
                }}>
                  [{entry.time}]
                </span>

                {/* Function name */}
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  color: color,
                  flexShrink: 0,
                  marginRight: 10,
                  minWidth: 160,
                }}>
                  [{entry.fn}]
                </span>

                {/* Message */}
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  color: isLast ? 'var(--text-secondary)' : 'var(--text-muted)',
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {entry.msg}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
