import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { SCENARIOS } from './lib/scenarios';
import type { LogEntry } from './lib/scenarios';
import AppSidebar from './components/AppSidebar';
import type { ActivePageType } from './components/AppSidebar';
import type { SavedPresetItem } from './components/AppSidebar';
import SimulationCanvas from './components/SimulationCanvas';
import StepControls from './components/StepControls';
import LogPanel from './components/LogPanel';
import TestbedPage from './components/TestbedPage';
import SandboxPage from './components/SandboxPage';
import IntroExperience from './components/IntroExperience';
import type { SandboxCanvasState } from './components/SandboxPage';
import { supabase } from './lib/supabase';

function getPageFromHash(hash: string): ActivePageType {
  if (hash === '#/intro') return 'intro';
  if (hash === '#/sandbox') return 'sandbox';
  if (hash === '#/simulator') return 'simulator';
  return 'testbed';
}

function getHashFromPage(page: ActivePageType): string {
  if (page === 'intro') return '#/intro';
  if (page === 'sandbox') return '#/sandbox';
  if (page === 'simulator') return '#/simulator';
  return '#/';
}

export default function App() {
  const [theme,            setTheme]            = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [activePage,       setActivePage]       = useState<ActivePageType>(() => getPageFromHash(window.location.hash || '#/intro'));
  const [activeScenarioId, setActiveScenarioId] = useState(SCENARIOS[0].id);
  const [stepIndex,        setStepIndex]        = useState(0);
  const [speed,            setSpeed]            = useState(1);
  const [isAutoPlay,       setIsAutoPlay]       = useState(false);
  const [savedPresets,     setSavedPresets]     = useState<SavedPresetItem[]>([]);
  const [sandboxCanvasState, setSandboxCanvasState] = useState<SandboxCanvasState>({ nodes: [], links: [] });
  const [pendingCanvasState, setPendingCanvasState] = useState<SandboxCanvasState | null>(null);
  const [pendingCanvasStateVersion, setPendingCanvasStateVersion] = useState(0);
  const [showAdminModal,   setShowAdminModal]   = useState(false);
  const [isAdmin,          setIsAdmin]          = useState(false);
  const [passwordInput,    setPasswordInput]    = useState('');
  const [authError,        setAuthError]        = useState('');
  const [authLoading,      setAuthLoading]      = useState(false);
  const [saveName,         setSaveName]         = useState('');
  const [saveDescription,  setSaveDescription]  = useState('');
  const [saveError,        setSaveError]        = useState('');
  const [saveLoading,      setSaveLoading]      = useState(false);

  // Dynamic logs emitted by SimulationCanvas (keyed by stepIndex)
  const [dynLogs, setDynLogs] = useState<Record<number, LogEntry[]>>({});
  // Clear dynamic logs whenever the scenario or step resets
  const dynLogsRef = useRef(dynLogs);
  dynLogsRef.current = dynLogs;

  const scenario = SCENARIOS.find(s => s.id === activeScenarioId) ?? SCENARIOS[0];

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
      document.body.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Ignore storage failures.
    }
  }, [theme]);

  useEffect(() => {
    const loadSavedPresets = async () => {
      const { data, error } = await supabase
        .from('saved_presets')
        .select('id,name,description,created_at,canvas_state')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setSavedPresets(data as SavedPresetItem[]);
      }
    };
    loadSavedPresets();
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setActivePage(getPageFromHash(window.location.hash || '#/intro'));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const nextHash = getHashFromPage(activePage);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  }, [activePage]);

  const sha256Hex = useCallback(async (value: string) => {
    const encoded = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  }, []);

  const handleAuthSubmit = useCallback(async () => {
    setAuthError('');
    if (!passwordInput.trim()) {
      setAuthError('Access denied');
      return;
    }
    setAuthLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_config')
        .select('password_hash')
        .limit(1)
        .single();

      if (error || !data?.password_hash) {
        setAuthError('Access denied');
        return;
      }

      const enteredHash = await sha256Hex(passwordInput);
      if (enteredHash !== data.password_hash) {
        setAuthError('Access denied');
        return;
      }

      setIsAdmin(true);
      setPasswordInput('');
      setAuthError('');
    } finally {
      setAuthLoading(false);
    }
  }, [passwordInput, sha256Hex]);

  const handleSavePreset = useCallback(async () => {
    setSaveError('');
    const trimmedName = saveName.trim();
    const trimmedDescription = saveDescription.trim();
    if (!trimmedName) {
      setSaveError('Scenario Name is required');
      return;
    }
    setSaveLoading(true);
    try {
      const payload = {
        name: trimmedName,
        description: trimmedDescription || null,
        created_at: new Date().toISOString(),
        canvas_state: {
          nodes: sandboxCanvasState.nodes.map((n) => ({
            id: n.id,
            type: n.type,
            x: n.x,
            y: n.y,
            label: n.label,
          })),
          links: sandboxCanvasState.links.map((l) => ({
            sourceId: l.sourceId,
            targetId: l.targetId,
          })),
        },
      };

      const { data, error } = await supabase
        .from('saved_presets')
        .insert(payload)
        .select('id,name,description,created_at,canvas_state')
        .single();

      if (error || !data) {
        setSaveError('Could not save preset');
        return;
      }

      setSavedPresets((prev) => [data as SavedPresetItem, ...prev]);
      setSaveName('');
      setSaveDescription('');
    } finally {
      setSaveLoading(false);
    }
  }, [sandboxCanvasState, saveDescription, saveName]);

  const handleSelectSavedPreset = useCallback((preset: SavedPresetItem) => {
    const state = preset.canvas_state;
    if (
      state &&
      Array.isArray(state.nodes) &&
      Array.isArray(state.links)
    ) {
      setPendingCanvasState({
        nodes: state.nodes,
        links: state.links,
      });
      setPendingCanvasStateVersion(Date.now());
    }
    setActivePage('sandbox');
  }, []);

  const handleRenameSavedPreset = useCallback(async (presetId: string, newName: string) => {
    if (!isAdmin) return 'Access denied';
    const trimmed = newName.trim();
    if (!trimmed) return 'Name is required';

    const { data, error } = await supabase
      .from('saved_presets')
      .update({ name: trimmed })
      .eq('id', presetId)
      .select('id,name,description,created_at,canvas_state')
      .single();

    if (error || !data) return 'Could not rename preset';

    setSavedPresets((prev) => prev.map((p) => (p.id === presetId ? (data as SavedPresetItem) : p)));
    return null;
  }, [isAdmin]);

  const handleEditSavedPresetDescription = useCallback(async (presetId: string, newDescription: string) => {
    if (!isAdmin) return 'Access denied';

    const { data, error } = await supabase
      .from('saved_presets')
      .update({ description: newDescription || null })
      .eq('id', presetId)
      .select('id,name,description,created_at,canvas_state')
      .single();

    if (error || !data) return 'Could not update description';

    setSavedPresets((prev) => prev.map((p) => (p.id === presetId ? (data as SavedPresetItem) : p)));
    return null;
  }, [isAdmin]);

  const handleDeleteSavedPreset = useCallback(async (presetId: string) => {
    if (!isAdmin) return 'Access denied';

    const { error } = await supabase
      .from('saved_presets')
      .delete()
      .eq('id', presetId);

    if (error) return 'Could not delete preset';

    setSavedPresets((prev) => prev.filter((p) => p.id !== presetId));
    return null;
  }, [isAdmin]);

  // ── Aggregated log entries: prefer dynamic, fall back to static ───────────
  const logEntries: LogEntry[] = useMemo(() => {
    const entries: LogEntry[] = [];
    for (let i = 0; i <= stepIndex; i++) {
      const dyn = dynLogs[i];
      if (dyn) {
        entries.push(...dyn);
      } else {
        const step = scenario.steps[i];
        if (step?.state?.logs) entries.push(...step.state.logs);
      }
    }
    return entries;
  }, [scenario.id, stepIndex, dynLogs]);

  // ── Scenario / step handlers ──────────────────────────────────────────────
  const handleSelectScenario = (id: number) => {
    setActiveScenarioId(id);
    setStepIndex(0);
    setIsAutoPlay(false);
    setDynLogs({});       // clear per-step dynamic logs
    setActivePage('simulator');
  };

  const handleNext = useCallback(() => {
    setStepIndex(s => {
      if (s < scenario.steps.length - 1) return s + 1;
      setIsAutoPlay(false);
      return s;
    });
  }, [scenario.steps.length]);

  const handlePrev = useCallback(() => {
    setStepIndex(s => (s > 0 ? s - 1 : s));
  }, []);

  // ── Auto-play ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAutoPlay) return;
    const ms = Math.round(1800 / speed);
    const id = setInterval(() => {
      setStepIndex(s => {
        if (s < scenario.steps.length - 1) return s + 1;
        setIsAutoPlay(false);
        return s;
      });
    }, ms);
    return () => clearInterval(id);
  }, [isAutoPlay, speed, scenario.steps.length]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft')  handlePrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleNext, handlePrev]);

  // ── Dynamic log callback from SimulationCanvas ────────────────────────────
  const handleDynamicLogs = useCallback((si: number, logs: LogEntry[]) => {
    setDynLogs(prev => ({ ...prev, [si]: logs }));
  }, []);

  const showIntro = activePage === 'intro';
  const enterTestbed = useCallback(() => {
    setActivePage('testbed');
  }, []);

  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw',
      background:'var(--app-bg)', overflow:'hidden' }}>

      {!showIntro && (
        <AppSidebar
          scenarios={SCENARIOS}
          savedPresets={savedPresets}
          activePage={activePage}
          activeScenarioId={activeScenarioId}
          isAdmin={isAdmin}
          onSelectIntro={() => setActivePage('intro')}
          onSelectSandbox={() => setActivePage('sandbox')}
          onSelectTestbed={() => setActivePage('testbed')}
          onSelectScenario={handleSelectScenario}
          onSelectSavedPreset={handleSelectSavedPreset}
          onRenameSavedPreset={handleRenameSavedPreset}
          onEditSavedPresetDescription={handleEditSavedPresetDescription}
          onDeleteSavedPreset={handleDeleteSavedPreset}
        />
      )}

      <div style={{ flex:1, display:'flex', flexDirection:'column',
          overflow:'hidden', minWidth:0 }}>

        {/* Top status bar */}
        {!showIntro && (
          <div style={{ height:38, display:'flex', alignItems:'center',
              padding:'0 20px', borderBottom:'1px solid rgba(255,255,255,0.07)',
              background:'var(--topbar-bg)', borderBottomColor:'var(--topbar-border)', flexShrink:0, gap:14 }}>
          <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10,
              letterSpacing:'0.1em', color:'var(--topbar-text-muted)',
              textTransform:'uppercase' }}>
            BLE / LoRa Mesh Network Simulator
          </span>
          <div style={{ flex:1 }}/>
          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              border: '1px solid var(--topbar-border)',
              background: 'var(--panel-bg)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 14,
              lineHeight: 1,
              marginRight: 2,
            }}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <StatusChip color="#67e8f9" label="BLE"/>
          <StatusChip color="#fcd34d" label="LoRa"/>
          <StatusChip color="#86efac" label="Active"/>
          {activePage === 'simulator' && (
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10,
                color:'var(--topbar-text-muted)', paddingLeft:14,
                borderLeft:'1px solid var(--topbar-border)' }}>
              {scenario.title}
            </div>
          )}
          {activePage === 'testbed' && (
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10,
                color:'var(--topbar-text-muted)', paddingLeft:14,
                borderLeft:'1px solid var(--topbar-border)' }}>
              Testbed Configuration
            </div>
          )}
          {activePage === 'sandbox' && (
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10,
                color:'var(--topbar-text-muted)', paddingLeft:14,
                borderLeft:'1px solid var(--topbar-border)' }}>
              Sandbox Builder
            </div>
          )}
          <button
            onClick={() => {
              setShowAdminModal(true);
              setAuthError('');
              setSaveError('');
            }}
            title="Admin"
            style={{
              marginLeft: 8,
              width: 24,
              height: 24,
              borderRadius: 6,
              border: '1px solid var(--topbar-border)',
              background: 'var(--panel-bg)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ⋯
          </button>
          </div>
        )}

        {/* Page content */}
        <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
          {showIntro ? (
            <IntroExperience onEnterSystem={enterTestbed} />
          ) : activePage === 'sandbox' ? (
            <SandboxPage
              externalCanvasState={pendingCanvasState}
              externalCanvasStateVersion={pendingCanvasStateVersion}
              onCanvasStateChange={setSandboxCanvasState}
            />
          ) : activePage === 'testbed' ? (
            <TestbedPage isAdmin={isAdmin}/>
          ) : (
            <>
              {/* Canvas + log */}
              <div style={{ flex:1, display:'flex', flexDirection:'column',
                  overflow:'hidden', minWidth:0 }}>
                <div style={{ flex:1, padding:'14px', overflow:'hidden',
                    minHeight:0, display:'flex', alignItems:'stretch' }}>
                    <div className="sim-canvas-surface" style={{ flex:1, position:'relative', borderRadius:12,
                      border:'1px solid hsl(var(--border))',
                      background:'var(--canvas-card-bg)', overflow:'hidden' }}>
                    <div style={{ position:'absolute', inset:0, pointerEvents:'none',
                        background:'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.01) 0%, transparent 70%)' }}/>
                    <SimulationCanvas
                      scenario={scenario}
                      stepIndex={stepIndex}
                      speed={speed}
                      onDynamicLogs={handleDynamicLogs}
                    />
                  </div>
                </div>
                <LogPanel entries={logEntries}/>
              </div>

              {/* Step controls */}
              <StepControls
                scenario={scenario} stepIndex={stepIndex}
                speed={speed} isAutoPlay={isAutoPlay}
                onPrev={handlePrev} onNext={handleNext}
                onSpeedChange={setSpeed}
                onAutoPlayToggle={() => setIsAutoPlay(p => !p)}
              />
            </>
          )}
        </div>
      </div>

      {showAdminModal && (
        <>
          <div
            onClick={() => setShowAdminModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'var(--modal-overlay)',
              zIndex: 1000,
            }}
          />
          <div style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 420,
            background: 'var(--modal-bg)',
            border: '1px solid var(--panel-border)',
            borderRadius: 10,
            padding: 18,
            zIndex: 1001,
            boxShadow: '0 20px 70px rgba(0,0,0,0.6)',
          }}>
            {!isAdmin ? (
              <>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  marginBottom: 10,
                }}>
                  Admin Authentication
                </div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAuthSubmit();
                  }}
                  placeholder="Enter admin password"
                  style={{
                    width: '100%',
                    background: 'var(--panel-bg-soft)',
                    border: '1px solid var(--panel-border)',
                    color: 'var(--text-primary)',
                    borderRadius: 8,
                    padding: '9px 11px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
                {authError && (
                  <div style={{
                    marginTop: 8,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    color: '#f87171',
                  }}>
                    {authError}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                  <button
                    onClick={() => setShowAdminModal(false)}
                    style={{
                      border: '1px solid var(--panel-border)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      borderRadius: 8,
                      padding: '7px 12px',
                      cursor: 'pointer',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAuthSubmit}
                    disabled={authLoading}
                    style={{
                      border: '1px solid rgba(103,232,249,0.5)',
                      background: 'rgba(103,232,249,0.16)',
                      color: '#67e8f9',
                      borderRadius: 8,
                      padding: '7px 12px',
                      cursor: authLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                      opacity: authLoading ? 0.6 : 1,
                    }}
                  >
                    {authLoading ? 'Checking...' : 'Unlock'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  color: '#86efac',
                  marginBottom: 10,
                }}>
                  Admin Authenticated
                </div>
                <input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Scenario Name"
                  style={{
                    width: '100%',
                    background: 'var(--panel-bg-soft)',
                    border: '1px solid var(--panel-border)',
                    color: 'var(--text-primary)',
                    borderRadius: 8,
                    padding: '9px 11px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    outline: 'none',
                    marginBottom: 8,
                  }}
                />
                <input
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Description"
                  style={{
                    width: '100%',
                    background: 'var(--panel-bg-soft)',
                    border: '1px solid var(--panel-border)',
                    color: 'var(--text-primary)',
                    borderRadius: 8,
                    padding: '9px 11px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
                {saveError && (
                  <div style={{
                    marginTop: 8,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    color: '#f87171',
                  }}>
                    {saveError}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                  <button
                    onClick={() => setShowAdminModal(false)}
                    style={{
                      border: '1px solid var(--panel-border)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      borderRadius: 8,
                      padding: '7px 12px',
                      cursor: 'pointer',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                    }}
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSavePreset}
                    disabled={saveLoading}
                    style={{
                      border: '1px solid rgba(134,239,172,0.5)',
                      background: 'rgba(134,239,172,0.16)',
                      color: '#86efac',
                      borderRadius: 8,
                      padding: '7px 12px',
                      cursor: saveLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                      opacity: saveLoading ? 0.6 : 1,
                    }}
                  >
                    {saveLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatusChip({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <div style={{ width:5, height:5, borderRadius:'50%',
          background:color, boxShadow:`0 0 5px ${color}` }}/>
      <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10,
          color:'var(--topbar-text-muted)' }}>{label}</span>
    </div>
  );
}
