import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const CYAN = '#67e8f9';
const AMBER = '#fcd34d';
const VIOLET = '#c084fc';
const GREEN = '#86efac';
const GRAY = 'var(--canvas-muted-text)';
const ICON_SRC = {
  phone: '/icons/phone.webp',
  esp32: '/icons/esp32.webp',
  lora: '/icons/lora.webp',
} as const;
const CANVAS_W = 1260;
const CANVAS_H = 620;

type NodeType = 'phone' | 'esp32' | 'lora';
type CanvasNode = { id: string; type: NodeType; x: number; y: number; label: string };
type CanvasLink = { sourceId: string; targetId: string };
type CanvasState = { nodes: CanvasNode[]; links: CanvasLink[] };

type ClusterInfo = {
  id: number;
  memberIds: string[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type PacketPulse = {
  id: string;
  fromId: string;
  toId: string;
  startMs: number;
  durationMs: number;
};

const ASSUMPTIONS: Array<{ label: string; value: string; accent?: string }> = [
  { label: 'MAX NODES (THIS TESTBED)', value: '9' },
  { label: 'BREAKDOWN', value: '4 phones + 3 ESP32 + 2 LoRa' },
  { label: 'BLE PER-HOP RANGE', value: '~50 m', accent: CYAN },
  { label: 'BLE PHY', value: 'LE Coded PHY, SF=8', accent: CYAN },
  { label: 'LORA INTER-CLUSTER RANGE', value: '1–5 km LOS', accent: VIOLET },
  { label: 'MAX TTL / HOP COUNT', value: '5 hops' },
  { label: 'PACKET SIZE CAP', value: '250 bytes', accent: AMBER },
  { label: 'AIRTIME CONSTRAINT', value: 'LoRa duty cycle', accent: AMBER },
  { label: 'MESSAGE DEDUP WINDOW', value: '200 msg IDs' },
  { label: 'DEDUP STRUCTURE', value: 'LRU cache (ring buffer)' },
  { label: 'SUPPORTED USERS (THESIS)', value: '7–9 devices' },
  { label: 'MAX COVERAGE AREA', value: '~10 km²' },
  { label: 'COVERAGE MODEL', value: '2 clusters + LoRa bridge' },
  { label: 'SECURITY', value: 'Curve25519 ECDH + AES-128-GCM', accent: VIOLET },
  { label: 'KEY EXCHANGE', value: 'ECDH (Curve25519)' },
  { label: 'ONBOARDING', value: 'QR code (OOB)' },
];

const TYPEWRITER_LINES = [
  'Decentralized. Offline. Encrypted.',
  'No internet. No towers. Just mesh.',
  'BLE + LoRa. Multi-hop. End-to-end secure.',
];

function fallbackIntroState(): CanvasState {
  const nodes: CanvasNode[] = [
    { id: 'a-p1', type: 'phone', x: 160, y: 210, label: 'Phone 1' },
    { id: 'a-p2', type: 'phone', x: 280, y: 150, label: 'Phone 2' },
    { id: 'a-p3', type: 'phone', x: 290, y: 285, label: 'Phone 3' },
    { id: 'a-e', type: 'esp32', x: 405, y: 220, label: 'ESP32-L' },
    { id: 'a-l', type: 'lora', x: 520, y: 220, label: 'LoRa-A' },
    { id: 'b-p4', type: 'phone', x: 980, y: 210, label: 'Phone 4' },
    { id: 'b-p5', type: 'phone', x: 860, y: 150, label: 'Phone 5' },
    { id: 'b-p6', type: 'phone', x: 850, y: 285, label: 'Phone 6' },
    { id: 'b-e', type: 'esp32', x: 735, y: 220, label: 'ESP32-R' },
    { id: 'b-l', type: 'lora', x: 620, y: 220, label: 'LoRa-B' },
  ];

  const links: CanvasLink[] = [
    { sourceId: 'a-p1', targetId: 'a-e' },
    { sourceId: 'a-p2', targetId: 'a-e' },
    { sourceId: 'a-p3', targetId: 'a-e' },
    { sourceId: 'a-e', targetId: 'a-l' },
    { sourceId: 'b-p4', targetId: 'b-e' },
    { sourceId: 'b-p5', targetId: 'b-e' },
    { sourceId: 'b-p6', targetId: 'b-e' },
    { sourceId: 'b-e', targetId: 'b-l' },
    { sourceId: 'a-l', targetId: 'b-l' },
  ];

  return { nodes, links };
}

function getNodeAccent(type: NodeType) {
  if (type === 'esp32') return AMBER;
  if (type === 'lora') return VIOLET;
  return CYAN;
}

function getNodePlaceholderColor(type: NodeType) {
  if (type === 'esp32') return '#f0a500';
  if (type === 'lora') return '#9c27b0';
  return '#00bcd4';
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function computeClusters(nodes: CanvasNode[], threshold = 250): { clusterById: Record<string, number>; clusters: ClusterInfo[] } {
  const visited = new Set<string>();
  const clusterById: Record<string, number> = {};
  const clusters: ClusterInfo[] = [];

  nodes.forEach((n) => {
    if (visited.has(n.id)) return;
    const queue = [n.id];
    const ids: string[] = [];
    visited.add(n.id);

    while (queue.length > 0) {
      const curId = queue.shift()!;
      ids.push(curId);
      const cur = nodes.find((x) => x.id === curId);
      if (!cur) continue;

      nodes.forEach((other) => {
        if (visited.has(other.id)) return;
        if (dist(cur, other) <= threshold) {
          visited.add(other.id);
          queue.push(other.id);
        }
      });
    }

    const memberNodes = ids.map((id) => nodes.find((n2) => n2.id === id)!).filter(Boolean);
    const minX = Math.min(...memberNodes.map((m) => m.x)) - 80;
    const maxX = Math.max(...memberNodes.map((m) => m.x)) + 80;
    const minY = Math.min(...memberNodes.map((m) => m.y)) - 80;
    const maxY = Math.max(...memberNodes.map((m) => m.y)) + 80;
    const clusterIndex = clusters.length;
    ids.forEach((id) => {
      clusterById[id] = clusterIndex;
    });
    clusters.push({
      id: clusterIndex,
      memberIds: ids,
      minX: Math.max(40, minX),
      maxX: Math.min(CANVAS_W - 40, maxX),
      minY: Math.max(70, minY),
      maxY: Math.min(CANVAS_H - 70, maxY),
    });
  });

  return { clusterById, clusters };
}

function parseCanvasState(raw: any): CanvasState | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!Array.isArray(raw.nodes) || !Array.isArray(raw.links)) return null;

  const validNodes: CanvasNode[] = raw.nodes
    .filter((n: any) => n && typeof n.id === 'string' && typeof n.label === 'string')
    .filter((n: any) => n.type === 'phone' || n.type === 'esp32' || n.type === 'lora')
    .map((n: any) => ({
      id: n.id,
      label: n.label,
      type: n.type as NodeType,
      x: Number(n.x),
      y: Number(n.y),
    }))
    .filter((n: CanvasNode) => Number.isFinite(n.x) && Number.isFinite(n.y));

  const validNodeIds = new Set(validNodes.map((n: CanvasNode) => n.id));
  const validLinks = raw.links
    .filter((l: any) => l && typeof l.sourceId === 'string' && typeof l.targetId === 'string')
    .filter((l: any) => validNodeIds.has(l.sourceId) && validNodeIds.has(l.targetId))
    .map((l: any) => ({ sourceId: l.sourceId, targetId: l.targetId }));

  if (validNodes.length === 0) return null;
  return { nodes: validNodes, links: validLinks };
}

function centerNodesInCanvas(nodes: CanvasNode[]): CanvasNode[] {
  if (nodes.length === 0) return nodes;
  const minX = Math.min(...nodes.map((n) => n.x));
  const maxX = Math.max(...nodes.map((n) => n.x));
  const minY = Math.min(...nodes.map((n) => n.y));
  const maxY = Math.max(...nodes.map((n) => n.y));
  const boxCenterX = (minX + maxX) / 2;
  const boxCenterY = (minY + maxY) / 2;
  const dx = CANVAS_W / 2 - boxCenterX;
  const dy = CANVAS_H / 2 - boxCenterY;

  return nodes.map((n) => ({
    ...n,
    x: n.x + dx,
    y: n.y + dy,
  }));
}

function AssumptionCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      style={{
        background: 'var(--assumption-card-bg)',
        border: '1px solid var(--assumption-card-border)',
        borderRadius: 10,
        padding: '12px 12px 13px',
        minHeight: 88,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9.5,
          letterSpacing: '0.11em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
          lineHeight: 1.4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-sans, "Inter", sans-serif)',
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1.2,
          color: accent || 'var(--text-primary)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionHeading({ section, title, subtitle }: { section: string; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.16em',
          color: 'var(--text-faint)',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {section}
      </div>
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--font-sans, "Inter", sans-serif)',
          fontSize: 34,
          lineHeight: 1.05,
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          marginTop: 8,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

export default function TestbedPage({ isAdmin }: { isAdmin: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [links, setLinks] = useState<CanvasLink[]>([]);
  const [introPresetId, setIntroPresetId] = useState<string | null>(null);
  const [clockMs, setClockMs] = useState(0);
  const [packets, setPackets] = useState<PacketPulse[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);

  const [phraseIdx, setPhraseIdx] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);

  const nodeMetaRef = useRef<Record<string, { phaseX: number; phaseY: number; speed: number }>>({});
  const clustersRef = useRef<ClusterInfo[]>([]);
  const clusterByNodeRef = useRef<Record<string, number>>({});
  const clockRef = useRef(0);
  const packetTimerRef = useRef<number | null>(null);
  const dragRef = useRef<{ nodeId: string; offX: number; offY: number } | null>(null);

  const currentLine = TYPEWRITER_LINES[phraseIdx] ?? TYPEWRITER_LINES[0];
  const livePulse = 1 + (Math.sin(clockMs * 0.006) * 0.16);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCursorOn((v) => !v);
    }, 420);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;
    const loadIcon = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load icon: ${src}`));
        img.src = src;
      });

    Promise.all(Object.values(ICON_SRC).map((src) => loadIcon(src)))
      .then(() => {
        if (active) setIconsReady(true);
      })
      .catch(() => {
        // Keep placeholders visible if any icon fails to load.
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const full = TYPEWRITER_LINES[phraseIdx] ?? '';
    const t = window.setTimeout(() => {
      if (!deleting && typedChars < full.length) {
        setTypedChars((c) => c + 1);
        return;
      }
      if (!deleting && typedChars >= full.length) {
        setDeleting(true);
        return;
      }
      if (deleting && typedChars > 0) {
        setTypedChars((c) => c - 1);
        return;
      }
      if (deleting && typedChars === 0) {
        setDeleting(false);
        setPhraseIdx((i) => (i + 1) % TYPEWRITER_LINES.length);
      }
    }, !deleting && typedChars < full.length ? 42 : deleting ? 24 : 2200);

    return () => window.clearTimeout(t);
  }, [deleting, phraseIdx, typedChars]);

  useEffect(() => {
    const loadIntro = async () => {
      const { data } = await supabase
        .from('saved_presets')
        .select('id,canvas_state')
        .eq('name', 'intro')
        .limit(1)
        .maybeSingle();

      const parsed = parseCanvasState(data?.canvas_state);
      const initial = parsed ?? fallbackIntroState();
      const centeredNodes = centerNodesInCanvas(initial.nodes);
      setNodes(centeredNodes);
      setLinks(initial.links);
      setIntroPresetId(data?.id ?? null);

      const clusterMeta = computeClusters(centeredNodes, 250);
      clustersRef.current = clusterMeta.clusters;
      clusterByNodeRef.current = clusterMeta.clusterById;

      const nextMeta: Record<string, { phaseX: number; phaseY: number; speed: number }> = {};
      centeredNodes.forEach((n, idx) => {
        nextMeta[n.id] = {
          phaseX: idx * 0.81 + Math.random() * 2,
          phaseY: idx * 1.13 + Math.random() * 2,
          speed: 0.15 + Math.random() * 0.15,
        };
      });
      nodeMetaRef.current = nextMeta;

      requestAnimationFrame(() => setCanvasVisible(true));
    };

    loadIntro();
  }, []);

  useEffect(() => {
    if (nodes.length === 0 || editMode) return;

    let raf = 0;
    let lastMs = performance.now();

    const tick = (ts: number) => {
      const dtFactor = Math.min(2.2, (ts - lastMs) / 16.67);
      lastMs = ts;
      clockRef.current = ts;
      setClockMs(ts);

      setNodes((prev) => {
        const next = prev.map((n) => ({ ...n }));
        const byId = new Map(next.map((n) => [n.id, n]));

        for (let i = 0; i < next.length; i += 1) {
          const node = next[i];
          if (node.type !== 'phone') continue;
          const meta = nodeMetaRef.current[node.id];
          if (!meta) continue;

          const cid = clusterByNodeRef.current[node.id];
          const cluster = clustersRef.current[cid];
          if (!cluster) continue;

          const nx = node.x
            + (Math.sin(ts * 0.0009 * meta.speed + meta.phaseX) * 0.22 + Math.cos(ts * 0.0007 + meta.phaseY) * 0.11) * dtFactor;
          const ny = node.y
            + (Math.cos(ts * 0.00085 * meta.speed + meta.phaseY) * 0.22 + Math.sin(ts * 0.0006 + meta.phaseX) * 0.1) * dtFactor;

          const clampedX = Math.max(cluster.minX, Math.min(cluster.maxX, nx));
          const clampedY = Math.max(cluster.minY, Math.min(cluster.maxY, ny));

          let overlaps = false;
          for (let j = 0; j < next.length; j += 1) {
            if (j === i) continue;
            const other = byId.get(next[j].id)!;
            if (dist({ x: clampedX, y: clampedY }, other) < 40) {
              overlaps = true;
              break;
            }
          }

          if (!overlaps) {
            node.x = clampedX;
            node.y = clampedY;
          }
        }

        return next;
      });

      setPackets((prev) => prev.filter((p) => ts - p.startMs < p.durationMs));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [editMode, nodes.length]);

  const schedulePacket = useCallback(() => {
    if (editMode || nodes.length === 0) return;

    const byId = new Map(nodes.map((n) => [n.id, n]));
    const intraClusterLinks = links.filter((l) => {
      const a = byId.get(l.sourceId);
      const b = byId.get(l.targetId);
      if (!a || !b) return false;
      const ca = clusterByNodeRef.current[a.id];
      const cb = clusterByNodeRef.current[b.id];
      if (ca !== cb) return false;
      if (a.type === 'lora' && b.type === 'lora') return false;
      return true;
    });

    let candidates = intraClusterLinks;
    if (candidates.length === 0) {
      const synthetic: CanvasLink[] = [];
      const groups = clustersRef.current.map((c) => c.memberIds);
      groups.forEach((ids) => {
        for (let i = 0; i < ids.length; i += 1) {
          for (let j = i + 1; j < ids.length; j += 1) {
            const a = byId.get(ids[i]);
            const b = byId.get(ids[j]);
            if (!a || !b) continue;
            if (a.type === 'lora' && b.type === 'lora') continue;
            synthetic.push({ sourceId: a.id, targetId: b.id });
          }
        }
      });
      candidates = synthetic;
    }

    if (candidates.length === 0) return;
    const link = candidates[Math.floor(Math.random() * candidates.length)];

    setPackets((prev) => [
      ...prev,
      {
        id: `${link.sourceId}-${link.targetId}-${Date.now()}`,
        fromId: link.sourceId,
        toId: link.targetId,
        startMs: clockRef.current,
        durationMs: 1500 + Math.random() * 1100,
      },
    ]);
  }, [editMode, links, nodes]);

  useEffect(() => {
    if (editMode || nodes.length === 0) return;

    const arm = () => {
      const delay = 4000 + Math.random() * 2000;
      packetTimerRef.current = window.setTimeout(() => {
        schedulePacket();
        arm();
      }, delay);
    };

    arm();
    return () => {
      if (packetTimerRef.current) {
        window.clearTimeout(packetTimerRef.current);
      }
    };
  }, [editMode, nodes.length, schedulePacket]);

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const loraPair = useMemo(() => {
    const loras = nodes.filter((n) => n.type === 'lora');
    if (loras.length >= 2) return [loras[0], loras[1]] as const;
    return null;
  }, [nodes]);

  const onNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (!editMode || !svgRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = svgRef.current.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    const sy = (e.clientY - rect.top) * (CANVAS_H / rect.height);
    const n = nodeById.get(nodeId);
    if (!n) return;
    dragRef.current = {
      nodeId,
      offX: sx - n.x,
      offY: sy - n.y,
    };
  }, [editMode, nodeById]);

  const onSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!editMode || !svgRef.current || !dragRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    const sy = (e.clientY - rect.top) * (CANVAS_H / rect.height);

    const { nodeId, offX, offY } = dragRef.current;
    const clusterId = clusterByNodeRef.current[nodeId];
    const cluster = clustersRef.current[clusterId];
    if (!cluster) return;

    setNodes((prev) => prev.map((n) => {
      if (n.id !== nodeId) return n;
      return {
        ...n,
        x: Math.max(cluster.minX, Math.min(cluster.maxX, sx - offX)),
        y: Math.max(cluster.minY, Math.min(cluster.maxY, sy - offY)),
      };
    }));
  }, [editMode]);

  const onSvgMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const saveIntroLayout = useCallback(async () => {
    if (!isAdmin || saving) return;
    setSaving(true);
    const canvasState: CanvasState = {
      nodes: nodes.map((n) => ({ id: n.id, type: n.type, x: n.x, y: n.y, label: n.label })),
      links: links.map((l) => ({ sourceId: l.sourceId, targetId: l.targetId })),
    };

    try {
      if (introPresetId) {
        const { error } = await supabase
          .from('saved_presets')
          .update({ canvas_state: canvasState })
          .eq('id', introPresetId);
        if (error) return;
      } else {
        const { data, error } = await supabase
          .from('saved_presets')
          .insert({ name: 'intro', description: 'PeerReach ambient landing layout', canvas_state: canvasState })
          .select('id')
          .single();
        if (error) return;
        setIntroPresetId(data?.id ?? null);
      }
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  }, [introPresetId, isAdmin, links, nodes, saving]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        minHeight: 0,
        minWidth: 0,
        background: 'var(--app-bg)',
      }}
    >
      <div style={{ padding: '24px 24px 30px', maxWidth: 1500, margin: '0 auto' }}>
        <section style={{ marginBottom: 28 }}>
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                letterSpacing: '0.16em',
                color: 'var(--text-faint)',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              SECTION 01
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-sans, "Inter", sans-serif)',
                fontSize: 40,
                lineHeight: 1.02,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Physical Setup
            </h2>
            <div
              style={{
                marginTop: 10,
                minHeight: 22,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                color: 'var(--text-muted)',
                opacity: 0.95,
              }}
            >
              {currentLine.slice(0, typedChars)}
              <span style={{ opacity: cursorOn ? 1 : 0 }}>|</span>
            </div>
          </div>

          <div className="sim-canvas-surface"
            style={{
              width: '100%',
              height: 'calc(100vh - 130px)',
              minHeight: 560,
              background: 'var(--canvas-bg)',
              border: '1px solid var(--panel-border)',
              borderRadius: 14,
              overflow: 'hidden',
              position: 'relative',
              opacity: canvasVisible ? 1 : 0,
              transition: 'opacity 800ms ease',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 5,
                padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid rgba(134,239,172,0.45)',
                background: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: GREEN,
                  transform: `scale(${livePulse})`,
                  boxShadow: `0 0 ${10 + livePulse * 4}px rgba(134,239,172,0.7)`,
                }}
              />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#ffffff' }}>
                LIVE  Peer Reach Mesh - Active
              </span>
            </div>

            {isAdmin && (
              <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 5, display: 'flex', gap: 8 }}>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    style={{
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#e5e7eb',
                      borderRadius: 8,
                      padding: '7px 10px',
                      cursor: 'pointer',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10.5,
                    }}
                  >
                    ✎ Edit Layout
                  </button>
                ) : (
                  <button
                    onClick={saveIntroLayout}
                    disabled={saving}
                    style={{
                      border: '1px solid rgba(103,232,249,0.45)',
                      background: 'rgba(103,232,249,0.12)',
                      color: CYAN,
                      borderRadius: 8,
                      padding: '7px 10px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.65 : 1,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10.5,
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Layout'}
                  </button>
                )}
              </div>
            )}

            <svg
              ref={svgRef}
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              width="100%"
              height="100%"
              style={{ display: 'block', background: 'var(--canvas-bg)', cursor: editMode ? 'grab' : 'default' }}
              onMouseMove={onSvgMouseMove}
              onMouseUp={onSvgMouseUp}
              onMouseLeave={onSvgMouseUp}
            >
              <defs>
                <pattern id="ambient-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--canvas-grid-dot)" strokeWidth="0.6" />
                </pattern>
                <filter id="packet-glow" x="-120%" y="-120%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="url(#ambient-grid)" />

              {clustersRef.current.map((c, idx) => (
                <text
                  key={c.id}
                  x={(c.minX + c.maxX) / 2}
                  y={Math.max(24, c.minY - 18)}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.5"
                  letterSpacing="0.16em"
                  fill={GRAY}
                  opacity={0.6}
                >
                  {`CLUSTER ${String.fromCharCode(65 + idx)}`}
                </text>
              ))}

              {links.map((l, idx) => {
                const a = nodeById.get(l.sourceId);
                const b = nodeById.get(l.targetId);
                if (!a || !b) return null;
                const sameCluster = clusterByNodeRef.current[a.id] === clusterByNodeRef.current[b.id];
                const isLoraBridge = a.type === 'lora' && b.type === 'lora';
                if (!sameCluster || isLoraBridge) return null;
                return (
                  <line
                    key={`${l.sourceId}-${l.targetId}-${idx}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={'var(--canvas-link-line)'}
                    strokeWidth={1.2}
                    opacity={1}
                  />
                );
              })}

              {loraPair && (
                <>
                  <line
                    x1={loraPair[0].x}
                    y1={loraPair[0].y}
                    x2={loraPair[1].x}
                    y2={loraPair[1].y}
                    stroke={'var(--canvas-lora-link)'}
                    strokeWidth={2.4}
                    strokeDasharray="11 7"
                    strokeDashoffset={-(clockMs * 0.02)}
                    opacity={0.92}
                  />
                  <text
                    x={(loraPair[0].x + loraPair[1].x) / 2}
                    y={(loraPair[0].y + loraPair[1].y) / 2 - 16}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="11"
                    fill={'var(--canvas-lora-link)'}
                    opacity={0.88}
                  >
                    1–5 km LOS
                  </text>
                  <text
                    x={(loraPair[0].x + loraPair[1].x) / 2}
                    y={(loraPair[0].y + loraPair[1].y) / 2 - 2}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="9"
                    fill={'var(--canvas-lora-link)'}
                    opacity={0.66}
                  >
                    LoRa 868 MHz
                  </text>
                </>
              )}

              {nodes.map((n, idx) => {
                const t = clockMs * 0.001 + idx * 0.7;
                const cycle = (Math.sin((t * Math.PI * 2) / 3) + 1) * 0.5;
                const pulse = 1 + cycle * 0.08;
                const rippleOpacity = 0.08 + (1 - cycle) * 0.18;
                const accent = getNodeAccent(n.type);
                const placeholderColor = getNodePlaceholderColor(n.type);
                return (
                  <g
                    key={n.id}
                    onMouseDown={(e) => onNodeMouseDown(e, n.id)}
                    style={{ cursor: editMode ? 'grab' : 'default' }}
                  >
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={30 * pulse}
                      fill="none"
                      stroke={'var(--canvas-ble-stroke)'}
                      strokeWidth={1}
                      opacity={rippleOpacity}
                    />
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={24}
                      fill={accent}
                      opacity={0.09}
                    />
                    {iconsReady ? (
                      <image href={ICON_SRC[n.type]} x={n.x - 18} y={n.y - 18} width={36} height={36} opacity={0.97} />
                    ) : (
                      <circle cx={n.x} cy={n.y} r={20} fill={placeholderColor} />
                    )}
                    <text
                      x={n.x}
                      y={n.y + 34}
                      textAnchor="middle"
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="10.5"
                      fill={'var(--canvas-node-label)'}
                      opacity={0.92}
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}

              {packets.map((p) => {
                const a = nodeById.get(p.fromId);
                const b = nodeById.get(p.toId);
                if (!a || !b) return null;
                const progress = Math.min(1, (clockMs - p.startMs) / p.durationMs);
                if (progress <= 0 || progress >= 1) return null;
                const x = a.x + (b.x - a.x) * progress;
                const y = a.y + (b.y - a.y) * progress;
                return (
                  <g key={p.id} filter="url(#packet-glow)">
                    <circle cx={x} cy={y} r={4} fill={CYAN} opacity={1 - progress} />
                  </g>
                );
              })}

              <g transform={`translate(0 ${CANVAS_H - 24})`}>
                <rect x="0" y="-26" width={CANVAS_W} height="30" fill="var(--canvas-legend-bg)" opacity="0.96" />
                <g transform="translate(72 0)">
                  <image href={ICON_SRC.phone} x="0" y="-15" width="24" height="24" />
                  <text x="30" y="2" fontSize="10" fill="var(--canvas-legend-text)" fontFamily="JetBrains Mono, monospace">Android Phone (BLE)</text>
                </g>

                <g transform="translate(372 0)">
                  <image href={ICON_SRC.esp32} x="0" y="-15" width="24" height="24" />
                  <text x="30" y="2" fontSize="10" fill="var(--canvas-legend-text)" fontFamily="JetBrains Mono, monospace">ESP32 Bridge (BLE + LoRa)</text>
                </g>

                <g transform="translate(724 0)">
                  <image href={ICON_SRC.lora} x="0" y="-15" width="24" height="24" />
                  <text x="30" y="2" fontSize="10" fill="var(--canvas-legend-text)" fontFamily="JetBrains Mono, monospace">LoRa Module</text>
                </g>

                <g transform="translate(984 0)">
                  <line x1="0" y1="-2" x2="48" y2="-2" stroke="var(--canvas-lora-link)" strokeWidth="2" strokeDasharray="8 5" strokeDashoffset={-(clockMs * 0.02)} />
                  <text x="60" y="2" fontSize="10" fill="var(--canvas-legend-text)" fontFamily="JetBrains Mono, monospace">LoRa Link</text>
                </g>
              </g>
            </svg>
          </div>
        </section>

        <section>
          <SectionHeading
            section="SECTION 02"
            title="System Assumptions"
            subtitle="Fixed parameters and constraints for all simulation scenarios."
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 10,
            }}
          >
            {ASSUMPTIONS.map((item) => (
              <AssumptionCard key={item.label} label={item.label} value={item.value} accent={item.accent} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
