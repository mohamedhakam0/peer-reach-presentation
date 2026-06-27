import React, { useState, useEffect, useRef } from 'react';
import type { Scenario } from '../lib/scenarios';

// ── Color tokens ────────────────────────────────────────────────────────────
const CYAN   = '#67e8f9';
const AMBER  = '#fcd34d';
const VIOLET = '#c084fc';
const GRAY   = 'var(--text-muted)';
const DARK   = 'var(--text-faint)';

const SIDEBAR_W_EXPANDED  = 260;
const SIDEBAR_W_COLLAPSED =  56;

// Desired sidebar order
const SCENARIO_ORDER = [4, 1, 5, 2, 3, 7]; // HELLO, BLE Delivery, Dup, OoR, LoRa, NodeLeaves

// ── Tooltip wrapper ──────────────────────────────────────────────────────────
function Tooltip({ label, children, disabled }: { label: string; children: React.ReactNode; disabled?: boolean }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  if (disabled) return <>{children}</>;
  return (
    <div
      ref={ref}
      style={{ position: 'relative', display: 'flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          left: SIDEBAR_W_COLLAPSED - 4,
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#1c1c1c',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#e2e8f0',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          padding: '5px 10px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          zIndex: 1000,
          pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ── Icons ───────────────────────────────────────────────────────────────────
function GridIcon({ size = 16, color = GRAY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.3"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.3"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.3"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.3"/>
    </svg>
  );
}

function OrbitIcon({ size = 16, color = GRAY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" fill={color} />
      <ellipse cx="8" cy="8" rx="6.2" ry="2.7" stroke={color} strokeWidth="1.2" opacity="0.85" />
      <ellipse cx="8" cy="8" rx="3.2" ry="6" stroke={color} strokeWidth="1.2" opacity="0.55" />
    </svg>
  );
}

function MeshIcon({ size = 18, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <polygon points="11,2 20,7 20,15 11,20 2,15 2,7" fill="none" stroke={color} strokeWidth="1.5"/>
      <circle cx="11" cy="11" r="3" fill="none" stroke={color} strokeWidth="1.5"/>
      <line x1="11" y1="2" x2="11" y2="8" stroke={color} strokeWidth="1" opacity="0.5"/>
      <line x1="20" y1="7" x2="14.2" y2="9.4" stroke={color} strokeWidth="1" opacity="0.5"/>
      <line x1="20" y1="15" x2="14.2" y2="12.6" stroke={color} strokeWidth="1" opacity="0.5"/>
    </svg>
  );
}

function ChevronDownIcon({ size = 12, color = GRAY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M2.5 4.5L6 8L9.5 4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronRightIcon({ size = 12, color = GRAY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M4.5 2.5L8 6L4.5 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Scenario type icons (small, for sidebar items)
function ScenarioMiniIcon({ scenarioId, active }: { scenarioId: number; active: boolean }) {
  const c = active ? CYAN : GRAY;
  const opacity = active ? 0.9 : 0.5;
  switch (scenarioId) {
    case 1: // BLE Mesh Delivery — three nodes in a row
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" opacity={opacity}>
          <circle cx="2" cy="7" r="1.5" stroke={c} strokeWidth="1.2"/>
          <circle cx="7" cy="7" r="1.5" stroke={c} strokeWidth="1.2"/>
          <circle cx="12" cy="7" r="1.5" stroke={c} strokeWidth="1.2"/>
          <line x1="3.5" y1="7" x2="5.5" y2="7" stroke={c} strokeWidth="1.2"/>
          <line x1="8.5" y1="7" x2="10.5" y2="7" stroke={c} strokeWidth="1.2"/>
        </svg>
      );
    case 2: // Out of Range — two nodes, gap, faded node
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" opacity={opacity}>
          <circle cx="2" cy="7" r="1.5" stroke={c} strokeWidth="1.2"/>
          <circle cx="7" cy="7" r="1.5" stroke={c} strokeWidth="1.2"/>
          <circle cx="12" cy="7" r="1.5" stroke={c} strokeWidth="1.2" opacity="0.25"/>
          <line x1="3.5" y1="7" x2="5.5" y2="7" stroke={c} strokeWidth="1.2"/>
          <line x1="8.5" y1="7" x2="10.5" y2="7" stroke={c} strokeWidth="1.2" strokeDasharray="2 1.5"/>
        </svg>
      );
    case 3: // LoRa Bridge — two clusters joined by dashed line
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" opacity={opacity}>
          <circle cx="2" cy="7" r="1.5" stroke={c} strokeWidth="1.2"/>
          <circle cx="5.5" cy="7" r="1.5" stroke={AMBER} strokeWidth="1.2"/>
          <circle cx="8.5" cy="7" r="1.5" stroke={AMBER} strokeWidth="1.2"/>
          <circle cx="12" cy="7" r="1.5" stroke={c} strokeWidth="1.2"/>
          <line x1="3.5" y1="7" x2="4" y2="7" stroke={c} strokeWidth="1.2"/>
          <line x1="10" y1="7" x2="10.5" y2="7" stroke={c} strokeWidth="1.2"/>
          <line x1="7" y1="7" x2="7" y2="7" stroke={VIOLET} strokeWidth="1.5" strokeDasharray="1.5 1.5"/>
        </svg>
      );
    case 4: // HELLO Beacon — star pattern with new node
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" opacity={opacity}>
          <circle cx="4" cy="4" r="1.5" stroke={c} strokeWidth="1.2"/>
          <circle cx="7" cy="9" r="1.5" stroke={c} strokeWidth="1.2"/>
          <circle cx="10" cy="4" r="1.5" stroke={c} strokeWidth="1.2"/>
          <circle cx="13" cy="7" r="1.5" stroke='#86efac' strokeWidth="1.2"/>
          <line x1="5.5" y1="4" x2="8.5" y2="4" stroke={c} strokeWidth="1" opacity="0.5"/>
          <line x1="6" y1="8" x2="9.5" y2="5" stroke={c} strokeWidth="1" opacity="0.5"/>
        </svg>
      );
    case 5: // Duplicate Suppression — diamond mesh
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" opacity={opacity}>
          <circle cx="2" cy="7" r="1.5" stroke={c} strokeWidth="1.2"/>
          <circle cx="7" cy="3" r="1.5" stroke={c} strokeWidth="1.2"/>
          <circle cx="7" cy="11" r="1.5" stroke={c} strokeWidth="1.2"/>
          <circle cx="12" cy="7" r="1.5" stroke={c} strokeWidth="1.2"/>
          <line x1="3.5" y1="6.5" x2="5.5" y2="4" stroke={c} strokeWidth="1" opacity="0.5"/>
          <line x1="3.5" y1="7.5" x2="5.5" y2="10" stroke={c} strokeWidth="1" opacity="0.5"/>
          <line x1="8.5" y1="4" x2="10.5" y2="6.5" stroke={c} strokeWidth="1" opacity="0.5"/>
          <line x1="8.5" y1="10" x2="10.5" y2="7.5" stroke={c} strokeWidth="1" opacity="0.5"/>
        </svg>
      );
    case 7: // Node Leaves Mid-Delivery — three nodes, last one offline (×)
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" opacity={opacity}>
          <circle cx="2" cy="7" r="1.5" stroke={c} strokeWidth="1.2"/>
          <circle cx="7" cy="7" r="1.5" stroke={c} strokeWidth="1.2"/>
          <circle cx="12" cy="7" r="1.5" stroke={c} strokeWidth="1.2" opacity="0.2"/>
          <line x1="3.5" y1="7" x2="5.5" y2="7" stroke={c} strokeWidth="1.2"/>
          <line x1="8.5" y1="7" x2="10.5" y2="7" stroke={c} strokeWidth="1.2"/>
          <line x1="10.5" y1="5" x2="13.5" y2="9" stroke="#f87171" strokeWidth="1.2" opacity="0.8"/>
          <line x1="13.5" y1="5" x2="10.5" y2="9" stroke="#f87171" strokeWidth="1.2" opacity="0.8"/>
        </svg>
      );
    default:
      return null;
  }
}

// ── Props ────────────────────────────────────────────────────────────────────
export type ActivePageType = 'intro' | 'sandbox' | 'testbed' | 'simulator';

export interface SavedPresetItem {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  canvas_state?: {
    nodes: Array<{ id: string; type: 'phone' | 'esp32' | 'lora'; x: number; y: number; label: string }>;
    links: Array<{ sourceId: string; targetId: string }>;
  } | null;
}

interface Props {
  scenarios: Scenario[];
  savedPresets: SavedPresetItem[];
  activePage: ActivePageType;
  activeScenarioId: number;
  isAdmin: boolean;
  onSelectIntro: () => void;
  onSelectSandbox: () => void;
  onSelectTestbed: () => void;
  onSelectScenario: (id: number) => void;
  onSelectSavedPreset: (preset: SavedPresetItem) => void;
  onRenameSavedPreset: (presetId: string, newName: string) => Promise<string | null>;
  onEditSavedPresetDescription: (presetId: string, newDescription: string) => Promise<string | null>;
  onDeleteSavedPreset: (presetId: string) => Promise<string | null>;
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────
export default function AppSidebar({ scenarios, savedPresets, activePage, activeScenarioId, isAdmin, onSelectIntro, onSelectSandbox, onSelectTestbed, onSelectScenario, onSelectSavedPreset, onRenameSavedPreset, onEditSavedPresetDescription, onDeleteSavedPreset }: Props) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const [scenariosOpen, setScenariosOpen] = useState<boolean>(() => {
    try { return localStorage.getItem('sidebar-scenarios-open') !== 'false'; } catch { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem('sidebar-collapsed', String(collapsed)); } catch {}
  }, [collapsed]);

  useEffect(() => {
    try { localStorage.setItem('sidebar-scenarios-open', String(scenariosOpen)); } catch {}
  }, [scenariosOpen]);

  const w = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED;

  // Ordered scenario list
  const orderedScenarios = SCENARIO_ORDER.map(id => scenarios.find(s => s.id === id)).filter(Boolean) as Scenario[];

  return (
    <aside
      data-sidebar
      style={{
        width: w,
        minWidth: w,
        maxWidth: w,
        height: '100%',
        background: 'var(--panel-bg)',
        borderRight: '1px solid var(--panel-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease',
        overflow: 'visible',
        flexShrink: 0,
      }}
    >
      {/* ── Toggle button on right edge ─────────────────────────────────── */}
      <button
        className="collapse-btn"
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'fixed',
          left: w - 12,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 100,
        }}
      >
        {collapsed ? '›' : '‹'}
      </button>

      {/* ── Logo / title ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '18px 0' : '18px 18px 14px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        flexShrink: 0,
      }}>
        <MeshIcon size={20} color="white"/>
        {!collapsed && (
          <div>
            <div style={{
              fontFamily: 'var(--font-sans, "Inter", sans-serif)',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}>
              Peer Reach
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9,
              color: DARK,
              letterSpacing: '0.06em',
              marginTop: 2,
            }}>
              BLE / LoRa Mesh
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--panel-border)', margin: '0 0 8px', flexShrink: 0 }}/>

      {/* ── Nav content (scrollable) ──────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>

        {/* ── INTRO item ────────────────────────────────────────────────── */}
        {!collapsed && (
          <div style={{ padding: '6px 12px 4px', flexShrink: 0 }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 8.5,
              letterSpacing: '0.14em',
              color: DARK,
              textTransform: 'uppercase',
            }}>About</span>
          </div>
        )}

        <Tooltip label="Intro – Cinematic Story" disabled={!collapsed}>
          <NavItem
            collapsed={collapsed}
            active={activePage === 'intro'}
            onClick={onSelectIntro}
            icon={<OrbitIcon size={16} color={activePage === 'intro' ? CYAN : GRAY}/>}
            label="Intro"
            subtitle="Cover and system story"
            accentColor={CYAN}
          />
        </Tooltip>

        <div style={{ height: 6 }}/>

        {/* ── TESTBED item ──────────────────────────────────────────────── */}
        {!collapsed && (
          <div style={{ padding: '6px 12px 4px', flexShrink: 0 }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 8.5,
              letterSpacing: '0.14em',
              color: DARK,
              textTransform: 'uppercase',
            }}>Testbed</span>
          </div>
        )}

        <Tooltip label="Testbed – Physical Setup" disabled={!collapsed}>
          <NavItem
            collapsed={collapsed}
            active={activePage === 'testbed'}
            onClick={onSelectTestbed}
            icon={<GridIcon size={16} color={activePage === 'testbed' ? CYAN : GRAY}/>}
            label="Testbed"
            subtitle="Physical setup & constraints"
            accentColor={CYAN}
          />
        </Tooltip>

        {/* ── SANDBOX item ──────────────────────────────────────────────── */}
        {!collapsed && (
          <div style={{ padding: '6px 12px 4px', flexShrink: 0, marginTop: 8 }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 8.5,
              letterSpacing: '0.14em',
              color: DARK,
              textTransform: 'uppercase',
            }}>Sandbox</span>
          </div>
        )}

        <Tooltip label="Sandbox – Network Builder" disabled={!collapsed}>
          <NavItem
            collapsed={collapsed}
            active={activePage === 'sandbox'}
            onClick={onSelectSandbox}
            icon={<MeshIcon size={16} color={activePage === 'sandbox' ? VIOLET : GRAY}/>}
            label="Sandbox"
            subtitle="Free-form simulator"
            accentColor={VIOLET}
          />
        </Tooltip>

        {/* Spacer */}
        <div style={{ height: 8 }}/>

        {/* ── SCENARIOS section ─────────────────────────────────────────── */}
        {!collapsed ? (
          /* Expanded: section header with toggle */
          <button
            onClick={() => setScenariosOpen(o => !o)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 16px 4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 8.5,
              letterSpacing: '0.14em',
              color: DARK,
              textTransform: 'uppercase',
            }}>Scenarios</span>
            <span style={{ color: DARK, transition: 'transform 0.2s', display: 'flex' }}>
              {scenariosOpen ? <ChevronDownIcon/> : <ChevronRightIcon/>}
            </span>
          </button>
        ) : (
          /* Collapsed: just a thin divider line */
          <div style={{ height: 1, background: 'var(--panel-border)', margin: '4px 10px 6px' }}/>
        )}

        {/* Scenarios list */}
        <div style={{
          overflow: 'hidden',
          maxHeight: (collapsed || scenariosOpen) ? 1400 : 0,
          transition: 'max-height 0.2s ease',
        }}>
          {orderedScenarios.map((s, idx) => {
            const isActive = activePage === 'simulator' && s.id === activeScenarioId;
            const isLoRa = s.id === 3;
            return (
              <Tooltip key={s.id} label={`${idx + 1}. ${s.title}`} disabled={!collapsed}>
                <ScenarioNavItem
                  scenario={s}
                  index={idx + 1}
                  active={isActive}
                  collapsed={collapsed}
                  isCore={isLoRa}
                  onClick={() => onSelectScenario(s.id)}
                />
              </Tooltip>
            );
          })}

          {savedPresets.length > 0 && !collapsed && (
            <div style={{
              margin: '8px 12px 4px',
              paddingTop: 8,
              borderTop: '1px solid var(--panel-border)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 8.5,
              letterSpacing: '0.14em',
              color: DARK,
              textTransform: 'uppercase',
            }}>
              Saved
            </div>
          )}

          {savedPresets.map((p) => (
            <Tooltip key={p.id} label={p.name} disabled={!collapsed}>
              <SavedPresetNavItem
                collapsed={collapsed}
                presetId={p.id}
                name={p.name}
                description={p.description}
                isAdmin={isAdmin}
                onClick={() => onSelectSavedPreset(p)}
                onRenameSavedPreset={onRenameSavedPreset}
                onEditSavedPresetDescription={onEditSavedPresetDescription}
                onDeleteSavedPreset={onDeleteSavedPreset}
              />
            </Tooltip>
          ))}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--panel-border)',
          flexShrink: 0,
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            color: DARK,
            lineHeight: 1.7,
            letterSpacing: '0.04em',
          }}>
            BLE Mesh Thesis Simulator<br/>
            v1.0.0 — Frontend Only
          </div>
        </div>
      )}
    </aside>
  );
}

// ── Generic nav item ─────────────────────────────────────────────────────────
function NavItem({
  collapsed, active, onClick, icon, label, subtitle, accentColor,
}: {
  collapsed: boolean;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  accentColor?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const accent = accentColor ?? CYAN;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: collapsed ? 'center' : 'flex-start',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10,
        padding: collapsed ? '10px 0' : '9px 12px',
        margin: collapsed ? '0' : '0 4px',
        width: collapsed ? '100%' : 'calc(100% - 8px)',
        borderRadius: 8,
        border: 'none',
        borderLeft: active && !collapsed ? `2px solid ${accent}` : '2px solid transparent',
        background: active
          ? `rgba(103,232,249,0.05)`
          : hovered
            ? 'var(--elevate-1)'
            : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s, border-color 0.15s',
        flexShrink: 0,
      }}
    >
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</div>
      {!collapsed && (
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-sans, "Inter", sans-serif)',
            fontWeight: active ? 600 : 500,
            fontSize: 13,
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {label}
          </div>
          {subtitle && (
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9.5,
              color: GRAY,
              opacity: 0.55,
              marginTop: 2,
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </button>
  );
}

// ── Scenario nav item ─────────────────────────────────────────────────────────
function ScenarioNavItem({
  scenario, index, active, collapsed, isCore, onClick,
}: {
  scenario: Scenario;
  index: number;
  active: boolean;
  collapsed: boolean;
  isCore?: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  if (collapsed) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          padding: '8px 0',
          border: 'none',
          background: active ? 'rgba(103,232,249,0.06)' : hovered ? 'var(--elevate-1)' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.15s',
          position: 'relative',
        }}
      >
        {/* Active indicator dot */}
        <div style={{
          width: 5, height: 5, borderRadius: '50%',
          background: active ? CYAN : 'var(--text-faint)',
          boxShadow: active ? `0 0 5px ${CYAN}` : 'none',
          transition: 'background 0.2s',
        }}/>
        {/* Number badge */}
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          color: active ? CYAN : DARK,
        }}>{index}</span>
        {active && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: '15%',
            bottom: '15%',
            width: 2,
            background: CYAN,
            borderRadius: '0 2px 2px 0',
          }}/>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 'calc(100% - 8px)',
        margin: '0 4px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 9,
        padding: '8px 10px',
        borderRadius: 8,
        border: 'none',
        borderLeft: active ? `2px solid ${CYAN}` : '2px solid transparent',
        background: active
          ? 'rgba(103,232,249,0.05)'
          : hovered
            ? 'var(--elevate-1)'
            : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {/* Status dot */}
      <div style={{
        marginTop: 4,
        width: 5, height: 5,
        borderRadius: '50%',
        background: active ? CYAN : 'var(--text-faint)',
        boxShadow: active ? `0 0 6px ${CYAN}` : 'none',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}/>

      {/* Icon */}
      <div style={{ marginTop: 1, flexShrink: 0 }}>
        <ScenarioMiniIcon scenarioId={scenario.id} active={active}/>
      </div>

      {/* Text */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            fontFamily: 'var(--font-sans, "Inter", sans-serif)',
            fontWeight: active ? 600 : 500,
            fontSize: 12.5,
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 135,
          }}>
            {scenario.title}
          </span>
          {isCore && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 7.5,
              color: VIOLET,
              border: `1px solid ${VIOLET}`,
              borderRadius: 3,
              padding: '0 4px',
              lineHeight: 1.7,
              flexShrink: 0,
              opacity: 0.9,
            }}>CORE</span>
          )}
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          color: GRAY,
          opacity: 0.5,
          marginTop: 2,
          lineHeight: 1.4,
          whiteSpace: 'normal',
          maxWidth: 165,
        }}>
          {scenario.subtitle}
        </div>
      </div>
    </button>
  );
}

function SavedPresetNavItem({
  collapsed,
  presetId,
  name,
  description,
  isAdmin,
  onClick,
  onRenameSavedPreset,
  onEditSavedPresetDescription,
  onDeleteSavedPreset,
}: {
  collapsed: boolean;
  presetId: string;
  name: string;
  description: string | null;
  isAdmin: boolean;
  onClick: () => void;
  onRenameSavedPreset: (presetId: string, newName: string) => Promise<string | null>;
  onEditSavedPresetDescription: (presetId: string, newDescription: string) => Promise<string | null>;
  onDeleteSavedPreset: (presetId: string) => Promise<string | null>;
}) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuOpenUp, setMenuOpenUp] = useState(false);
  const [mode, setMode] = useState<'menu' | 'rename' | 'description' | 'delete'>('menu');
  const [draftName, setDraftName] = useState(name);
  const [draftDescription, setDraftDescription] = useState(description ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraftName(name);
  }, [name]);

  useEffect(() => {
    setDraftDescription(description ?? '');
  }, [description]);

  useEffect(() => {
    if (!menuOpen) return;
    const onWindowPointerDown = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setMode('menu');
        setError('');
      }
    };
    window.addEventListener('mousedown', onWindowPointerDown);
    return () => window.removeEventListener('mousedown', onWindowPointerDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const estimatedPopoverHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    setMenuOpenUp(spaceBelow < estimatedPopoverHeight);
  }, [menuOpen, mode]);

  if (collapsed) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          padding: '8px 0',
          border: 'none',
          background: hovered ? 'var(--elevate-1)' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        <div style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: 'var(--text-faint)',
          transition: 'background 0.2s',
        }}/>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 8,
          color: DARK,
        }}>S</span>
      </button>
    );
  }

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: 'calc(100% - 8px)',
        margin: '0 4px',
      }}
    >
    <button
      onClick={onClick}
      style={{
        width: 'calc(100% - 8px)',
        margin: 0,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 9,
        padding: '8px 10px',
        borderRadius: 8,
        border: 'none',
        borderLeft: '2px solid transparent',
        background: hovered ? 'var(--elevate-1)' : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <div style={{
        marginTop: 4,
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: 'var(--text-faint)',
        flexShrink: 0,
      }}/>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-sans, "Inter", sans-serif)',
          fontWeight: 500,
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 150,
        }}>
          <span style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>{name}</span>
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          color: GRAY,
          opacity: 0.5,
          marginTop: 2,
          lineHeight: 1.4,
          whiteSpace: 'normal',
          maxWidth: 165,
        }}>
          {description || 'Saved preset'}
        </div>
      </div>
    </button>

    {isAdmin && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
          setMode('menu');
          setError('');
        }}
        title="Manage preset"
        style={{
          position: 'absolute',
          right: 8,
          top: 8,
          width: 20,
          height: 20,
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.16)',
          background: 'rgba(255,255,255,0.04)',
          color: 'rgba(255,255,255,0.8)',
          display: (hovered || menuOpen) ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          lineHeight: 1,
          zIndex: 4,
        }}
      >
        ⋯
      </button>
    )}

    {isAdmin && menuOpen && (
      <div
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: menuOpenUp ? 'auto' : 32,
          bottom: menuOpenUp ? 30 : 'auto',
          right: 8,
          width: 250,
          background: '#131313',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 10,
          padding: 10,
          zIndex: 10,
          boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
        }}
      >
        {mode === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={() => {
                setDraftName(name);
                setMode('rename');
                setError('');
              }}
              style={{
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.03)',
                color: '#e2e8f0',
                borderRadius: 8,
                padding: '7px 10px',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
              }}
            >
              Rename
            </button>
            <button
              onClick={() => {
                setDraftDescription(description ?? '');
                setMode('description');
                setError('');
              }}
              style={{
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.03)',
                color: '#e2e8f0',
                borderRadius: 8,
                padding: '7px 10px',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
              }}
            >
              Edit Description
            </button>
            <button
              onClick={() => {
                setMode('delete');
                setError('');
              }}
              style={{
                border: '1px solid rgba(248,113,113,0.35)',
                background: 'rgba(248,113,113,0.12)',
                color: '#fca5a5',
                borderRadius: 8,
                padding: '7px 10px',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
              }}
            >
              Delete
            </button>
          </div>
        )}

        {mode === 'rename' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: 'rgba(255,255,255,0.8)',
            }}>
              Rename preset
            </div>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              style={{
                width: '100%',
                background: '#0b0b0b',
                border: '1px solid rgba(255,255,255,0.16)',
                color: '#f1f5f9',
                borderRadius: 8,
                padding: '8px 10px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                outline: 'none',
              }}
            />
            {error && <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#f87171' }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button
                onClick={() => {
                  setMode('menu');
                  setError('');
                }}
                style={{
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.75)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10.5,
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const trimmed = draftName.trim();
                  if (!trimmed) {
                    setError('Name is required');
                    return;
                  }
                  setBusy(true);
                  const maybeErr = await onRenameSavedPreset(presetId, trimmed);
                  setBusy(false);
                  if (maybeErr) {
                    setError(maybeErr);
                    return;
                  }
                  setMenuOpen(false);
                  setMode('menu');
                  setError('');
                }}
                disabled={busy}
                style={{
                  border: '1px solid rgba(103,232,249,0.5)',
                  background: 'rgba(103,232,249,0.16)',
                  color: '#67e8f9',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.6 : 1,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10.5,
                }}
              >
                {busy ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {mode === 'description' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: 'rgba(255,255,255,0.8)',
            }}>
              Edit description
            </div>
            <input
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              style={{
                width: '100%',
                background: '#0b0b0b',
                border: '1px solid rgba(255,255,255,0.16)',
                color: '#f1f5f9',
                borderRadius: 8,
                padding: '8px 10px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                outline: 'none',
              }}
            />
            {error && <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#f87171' }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button
                onClick={() => {
                  setMode('menu');
                  setError('');
                }}
                style={{
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.75)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10.5,
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setBusy(true);
                  const maybeErr = await onEditSavedPresetDescription(presetId, draftDescription.trim());
                  setBusy(false);
                  if (maybeErr) {
                    setError(maybeErr);
                    return;
                  }
                  setMenuOpen(false);
                  setMode('menu');
                  setError('');
                }}
                disabled={busy}
                style={{
                  border: '1px solid rgba(103,232,249,0.5)',
                  background: 'rgba(103,232,249,0.16)',
                  color: '#67e8f9',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.6 : 1,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10.5,
                }}
              >
                {busy ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {mode === 'delete' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: '#fca5a5',
              lineHeight: 1.5,
            }}>
              Delete this preset? This cannot be undone.
            </div>
            {error && <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#f87171' }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button
                onClick={() => {
                  setMode('menu');
                  setError('');
                }}
                style={{
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.75)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10.5,
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setBusy(true);
                  const maybeErr = await onDeleteSavedPreset(presetId);
                  setBusy(false);
                  if (maybeErr) {
                    setError(maybeErr);
                    return;
                  }
                  setMenuOpen(false);
                  setMode('menu');
                  setError('');
                }}
                disabled={busy}
                style={{
                  border: '1px solid rgba(248,113,113,0.45)',
                  background: 'rgba(248,113,113,0.14)',
                  color: '#fca5a5',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.6 : 1,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10.5,
                }}
              >
                {busy ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </div>
    )}
    </div>
  );
}
