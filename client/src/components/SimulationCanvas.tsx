import { useEffect, useRef, useState, useCallback } from 'react';
import type { Scenario, SimNode, NodeStatus, LogEntry } from '../lib/scenarios';

// ─── Constants ───────────────────────────────────────────────────────────────
const VB_W = 1000, VB_H = 560;
const BLE_RADIUS = 160;
const DRAG_RADIUS = 60;

const COLOR_BLE_PACKET    = '#67e8f9';
const COLOR_LORA_PACKET   = '#fcd34d';
const COLOR_ACK_PACKET    = '#86efac';
const COLOR_HELLO_PACKET  = '#c4b5fd';
const COLOR_DROP_PACKET   = '#f87171';
const COLOR_NODE_ACTIVE   = '#ffffff';
const COLOR_NODE_IDLE     = 'var(--canvas-muted-text)';
const COLOR_NODE_RECEIVER = '#86efac';
const COLOR_NODE_OFFLINE  = '#374151';
const COLOR_NODE_NEW      = '#c4b5fd';
const COLOR_NODE_OOR      = '#4b5563';
const COLOR_BLE_RANGE     = 'var(--canvas-ble-stroke)';
const COLOR_LORA_LINK     = 'var(--canvas-lora-link)';
const ICON_CACHE_BUST = '20260411b';
const NODE_ICON_SRC = {
  phone: `/icons/phone.webp?v=${ICON_CACHE_BUST}`,
  esp32: `/icons/esp32.webp?v=${ICON_CACHE_BUST}`,
  'esp32-lora': `/icons/lora.webp?v=${ICON_CACHE_BUST}`,
} as const;

function packetColor(type: string) {
  switch (type) {
    case 'ble': return COLOR_BLE_PACKET;
    case 'lora': return COLOR_LORA_PACKET;
    case 'ack': return COLOR_ACK_PACKET;
    case 'hello': return COLOR_HELLO_PACKET;
    case 'duplicate-drop': return COLOR_DROP_PACKET;
    default: return COLOR_BLE_PACKET;
  }
}

function nodeColor(node: SimNode, isActive: boolean, _isPulse: boolean, override?: NodeStatus): string {
  const s = override ?? node.status ?? 'idle';
  if (s === 'offline') return COLOR_NODE_OFFLINE;
  if (s === 'out-of-range') return COLOR_NODE_OOR;
  if (s === 'receiver') return COLOR_NODE_RECEIVER;
  if (s === 'new') return COLOR_NODE_NEW;
  if (isActive) return COLOR_NODE_ACTIVE;
  return COLOR_NODE_IDLE;
}

// ─── Connectivity ─────────────────────────────────────────────────────────────
function computeAdj(nodes: SimNode[], pos: Record<string, { x: number; y: number }>) {
  const adj: Record<string, string[]> = {};
  nodes.forEach(n => (adj[n.id] = []));
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      // LoRa↔LoRa: always connected (radio link, not BLE range)
      if (a.type === 'esp32-lora' && b.type === 'esp32-lora') {
        adj[a.id].push(b.id); adj[b.id].push(a.id); continue;
      }
      const pa = pos[a.id] ?? { x: a.x, y: a.y };
      const pb = pos[b.id] ?? { x: b.x, y: b.y };
      if (Math.hypot(pa.x - pb.x, pa.y - pb.y) <= BLE_RADIUS * 2) {
        adj[a.id].push(b.id); adj[b.id].push(a.id);
      }
    }
  }
  return adj;
}

function isLoRaHop(fromT?: string, toT?: string) {
  return fromT === 'esp32-lora' && toT === 'esp32-lora';
}

function willArrive(fromId: string, toId: string, fromT: string | undefined, toT: string | undefined, adj: Record<string, string[]>) {
  if (isLoRaHop(fromT, toT)) return true;
  return (adj[fromId] ?? []).includes(toId);
}

/** Progress (0–1) at which the packet hits the sender's BLE ring boundary */
function dropProg(fx: number, fy: number, tx: number, ty: number) {
  const d = Math.hypot(tx - fx, ty - fy);
  return d > 0 ? Math.min(0.9, BLE_RADIUS / d) : 0;
}

// ─── Dynamic log builder ──────────────────────────────────────────────────────
function buildDynamicLogs(
  step: Scenario['steps'][number],
  nodeMap: Map<string, SimNode>,
  adj: Record<string, string[]>,
): LogEntry[] {
  const staticLogs: LogEntry[] = [...(step.state.logs ?? [])];
  const lastTime = staticLogs[staticLogs.length - 1]?.time ?? '00:00.000';
  const extra: LogEntry[] = [];

  // Topology error: primary sender fully isolated
  const sender = step.state.pulseNodes?.[0] ?? step.state.activeNodes?.[0];
  if (sender) {
    const sn = nodeMap.get(sender);
    if (sn?.type !== 'esp32-lora' && (adj[sender] ?? []).length === 0) {
      return [
        { time: staticLogs[0]?.time ?? '00:00.000', fn: 'TOPOLOGY_ERROR', color: 'red',
          msg: `Node ${sender} has no BLE neighbors — drag it closer to initiate flood` },
        ...staticLogs,
      ];
    }
  }

  for (const pkt of (step.state.packets ?? [])) {
    const fn = nodeMap.get(pkt.from);
    const tn = nodeMap.get(pkt.to);
    const ok = willArrive(pkt.from, pkt.to, fn?.type, tn?.type, adj);
    if (!ok) {
      extra.push({ time: lastTime, fn: 'RANGE_CHECK', color: 'amber',
        msg: `${pkt.from}→${pkt.to}: distance > BLE range — packet will not arrive` });
      extra.push({ time: lastTime, fn: 'PKT_DROP', color: 'red',
        msg: `${pkt.type.toUpperCase()} from ${pkt.from} to ${pkt.to} dropped at range boundary` });
    } else if (!isLoRaHop(fn?.type, tn?.type)) {
      extra.push({ time: lastTime, fn: 'RANGE_CHECK', color: 'green',
        msg: `${pkt.from}→${pkt.to}: within BLE range — delivering` });
    }
  }

  return [...staticLogs, ...extra];
}

// ─── Node icons ──────────────────────────────────────────────────────────────
function NodeIconShape({
  x,
  y,
  color,
  glow,
  type,
}: {
  x: number;
  y: number;
  color: string;
  glow: boolean;
  type: SimNode['type'];
}) {
  const size = 56;
  return (
    <g>
      {glow && (
        <circle
          cx={x}
          cy={y}
          r={type === 'phone' ? 28 : 24}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          opacity={0.25}
        />
      )}
      <image href={NODE_ICON_SRC[type]} x={x - 28} y={y - 28} width={size} height={size} />
    </g>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface RunningPacket {
  id: string;
  fromX: number; fromY: number;
  toX: number; toY: number;
  type: string; label?: string;
  progress: number; done: boolean;
  // connectivity
  arrives: boolean;
  stopProg: number;   // progress value where the packet halts (= 1 if arrives)
  stopX: number; stopY: number;
  phase: 'travel' | 'fade' | 'gone';
  fadeT: number;      // 0→1 fade after stopping
}

interface Ripple { id: string; nodeId: string; color: string; progress: number; }
interface DropPulse { id: string; x: number; y: number; progress: number; }
interface DragState { nodeId: string; ox: number; oy: number; offX: number; offY: number; }

function svgPt(svg: SVGSVGElement, cx: number, cy: number) {
  const r = svg.getBoundingClientRect();
  return { x: (cx - r.left) * VB_W / r.width, y: (cy - r.top) * VB_H / r.height };
}
function clampPos(x: number, y: number, ox: number, oy: number, R: number) {
  const dx = x-ox, dy = y-oy, d = Math.hypot(dx, dy);
  return d <= R ? {x, y} : { x: ox+dx/d*R, y: oy+dy/d*R };
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  scenario: Scenario;
  stepIndex: number;
  speed: number;
  onDynamicLogs?: (stepIndex: number, logs: LogEntry[]) => void;
}

export default function SimulationCanvas({ scenario, stepIndex, speed, onDynamicLogs }: Props) {
  const [packets,    setPackets]    = useState<RunningPacket[]>([]);
  const [ripples,    setRipples]    = useState<Ripple[]>([]);
  const [dropPulses, setDropPulses] = useState<DropPulse[]>([]);
  const [topoError,  setTopoError]  = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, tick] = useState(0); // force re-render during drag

  const rafRef   = useRef<number | null>(null);
  const svgRef   = useRef<SVGSVGElement>(null);
  const posRef   = useRef<Record<string, { x: number; y: number }>>({});
  const origRef  = useRef<Record<string, { x: number; y: number }>>({});
  const dragRef  = useRef<DragState | null>(null);
  const dpIdRef  = useRef(0);

  useEffect(() => {
    // Preload node icons once so packet-step transitions don't show unloaded images.
    Object.values(NODE_ICON_SRC).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // ── Init / scenario reset ─────────────────────────────────────────────────
  useEffect(() => {
    const pos: Record<string, {x:number;y:number}> = {};
    const ori: Record<string, {x:number;y:number}> = {};
    scenario.nodes.forEach(n => { pos[n.id] = {x:n.x, y:n.y}; ori[n.id] = {x:n.x, y:n.y}; });
    posRef.current  = pos;
    origRef.current = ori;
    dragRef.current = null;
    setDraggingId(null);
    setTopoError(null);
    tick(v => v+1);
  }, [scenario.id]);

  const step  = scenario.steps[stepIndex];
  const state = step?.state;
  const activeSet   = new Set(state?.activeNodes ?? []);
  const pulseSet    = new Set(state?.pulseNodes  ?? []);
  const overrideMap = new Map<string, NodeStatus>();
  (state?.nodeOverrides ?? []).forEach(o => overrideMap.set(o.nodeId, o.status));
  const nodeMap = new Map(scenario.nodes.map(n => [n.id, n]));

  // Live adjacency (for connection lines, computed every render)
  const liveAdj = computeAdj(scenario.nodes, posRef.current);

  // ── Step change: freeze adjacency, resolve packets, emit logs ─────────────
  useEffect(() => {
    if (!step) return;
    const adj = computeAdj(scenario.nodes, posRef.current);

    // Topology-error check
    const sender = step.state.pulseNodes?.[0] ?? step.state.activeNodes?.[0];
    let err: string | null = null;
    if (sender) {
      const sn = nodeMap.get(sender);
      if (sn?.type !== 'esp32-lora' && (adj[sender] ?? []).length === 0)
        err = `Node ${sender} has no BLE neighbors — drag it closer to another node`;
    }
    setTopoError(err);

    // Emit dynamic logs
    onDynamicLogs?.(stepIndex, buildDynamicLogs(step, nodeMap, adj));

    // Build packets
    if (!state?.packets?.length) { setPackets([]); return; }

    const newPkts: RunningPacket[] = (state.packets ?? []).map(pkt => {
      const from = posRef.current[pkt.from] ?? {x:0,y:0};
      const to   = posRef.current[pkt.to]   ?? {x:0,y:0};
      const fn   = nodeMap.get(pkt.from);
      const tn   = nodeMap.get(pkt.to);
      const ok   = willArrive(pkt.from, pkt.to, fn?.type, tn?.type, adj);
      const sp   = ok ? 1 : dropProg(from.x, from.y, to.x, to.y);
      return {
        id: pkt.id, fromX: from.x, fromY: from.y, toX: to.x, toY: to.y,
        type: pkt.type, label: pkt.label,
        progress: 0, done: false,
        arrives: ok, stopProg: sp,
        stopX: from.x + (to.x-from.x)*sp,
        stopY: from.y + (to.y-from.y)*sp,
        phase: 'travel', fadeT: 0,
      };
    });
    setPackets(newPkts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id, stepIndex]);

  // ── Animation loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const pkts = state?.packets ?? [];
    const durMap = new Map<string, {dur:number; delay:number}>();
    pkts.forEach(p => durMap.set(p.id, { dur:(p.duration??1000)/speed, delay:(p.delay??0)/speed }));
    const t0 = performance.now();

    const frame = (now: number) => {
      const el = now - t0;
      const newDPs: DropPulse[] = [];

      setPackets(prev => prev.map(pkt => {
        if (pkt.done) return pkt;
        const info = durMap.get(pkt.id);
        if (!info) return pkt;
        const { dur, delay } = info;
        if (el < delay) return pkt;

        if (!pkt.arrives) {
          // travel only to stopProg then fade
          const travelDur = dur * pkt.stopProg;
          const t = (el - delay) / travelDur;
          if (t < 1) return { ...pkt, progress: Math.min(pkt.stopProg, t * pkt.stopProg) };
          if (pkt.phase === 'travel') {
            newDPs.push({ id: `dp-${pkt.id}-${++dpIdRef.current}`, x: pkt.stopX, y: pkt.stopY, progress: 0 });
            return { ...pkt, progress: pkt.stopProg, phase: 'fade' as const };
          }
          if (pkt.phase === 'fade') {
            const fp = Math.min(1, (el - delay - travelDur) / 350);
            if (fp >= 1) return { ...pkt, done: true, phase: 'gone' as const, fadeT: 1 };
            return { ...pkt, fadeT: fp };
          }
          return pkt;
        }
        const t = Math.min(1, (el - delay) / dur);
        return { ...pkt, progress: t, done: t >= 1 };
      }));

      if (newDPs.length) setDropPulses(prev => [...prev, ...newDPs]);

      setRipples(prev => prev.map(r => ({...r, progress: r.progress + 0.04*speed})).filter(r => r.progress < 1));
      setDropPulses(prev => prev.map(d => ({...d, progress: d.progress + 0.04*speed})).filter(d => d.progress < 1));

      const allDone = !pkts.length || pkts.every(p => {
        const i = durMap.get(p.id); if (!i) return true;
        return el >= i.delay + i.dur + 400;
      });
      if (!allDone) rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id, stepIndex, speed]);

  // ── Ripples ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state?.pulseNodes?.length) { setRipples([]); return; }
    setRipples((state.pulseNodes ?? []).map(nid => {
      const nd = nodeMap.get(nid);
      return { id: `rip-${nid}-${stepIndex}`, nodeId: nid,
        color: nd ? nodeColor(nd, true, false, overrideMap.get(nid)) : '#fff', progress: 0 };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id, stepIndex]);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const onNodeDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!svgRef.current) return;
    const pt  = svgPt(svgRef.current, e.clientX, e.clientY);
    const cur = posRef.current[nodeId]  ?? {x:0,y:0};
    const ori = origRef.current[nodeId] ?? cur;
    dragRef.current = { nodeId, ox: ori.x, oy: ori.y, offX: pt.x-cur.x, offY: pt.y-cur.y };
    setDraggingId(nodeId);
  }, []);

  const onSvgMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragRef.current || !svgRef.current) return;
    const { nodeId, ox, oy, offX, offY } = dragRef.current;
    const pt = svgPt(svgRef.current, e.clientX, e.clientY);
    posRef.current[nodeId] = clampPos(pt.x-offX, pt.y-offY, ox, oy, DRAG_RADIUS);
    tick(v => v+1);
  }, []);

  const onSvgUp = useCallback(() => { dragRef.current = null; setDraggingId(null); }, []);

  // ─── Render ───────────────────────────────────────────────────────────────
  const loraLinks    = state?.loraLinks    ?? [];
  const rangeCircles = state?.rangeCircles ?? [];

  return (
    <svg ref={svgRef} viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-full"
      style={{ display:'block', cursor: draggingId ? 'grabbing' : 'default' }}
      onMouseMove={onSvgMove} onMouseUp={onSvgUp} onMouseLeave={onSvgUp}
    >
      <defs>
        <pattern id="sim-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--canvas-grid-dot)" strokeWidth={0.5}/>
        </pattern>
        <filter id="glow-sm"><feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="glow-lg"><feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width={VB_W} height={VB_H} fill="url(#sim-grid)"/>

      {/* LoRa links */}
      {loraLinks.map(link => {
        const fp = posRef.current[link.from]; const tp = posRef.current[link.to];
        if (!fp || !tp) return null;
        return (
          <g key={`lora-${link.from}-${link.to}`}>
            {link.active && <line x1={fp.x} y1={fp.y} x2={tp.x} y2={tp.y}
              stroke={COLOR_LORA_LINK} strokeWidth={3} opacity={0.15} strokeDasharray="12 8"/>}
            <line x1={fp.x} y1={fp.y} x2={tp.x} y2={tp.y}
              stroke={link.active ? COLOR_LORA_LINK : 'var(--canvas-link-line)'}
              strokeWidth={1.5} strokeDasharray="12 8" opacity={link.active ? 0.7 : 0.3}/>
            <text x={(fp.x+tp.x)/2} y={(fp.y+tp.y)/2-10} textAnchor="middle"
              fill={COLOR_LORA_LINK} fontSize={11} fontFamily="JetBrains Mono, monospace" opacity={0.7}>
              LoRa
            </text>
          </g>
        );
      })}

      {/* Connection lines — only drawn when nodes are adjacent */}
      {scenario.nodes.map((n1, i) =>
        scenario.nodes.slice(i+1).map(n2 => {
          if (n1.type === 'esp32-lora' && n2.type === 'esp32-lora') return null;
          if (!(liveAdj[n1.id] ?? []).includes(n2.id)) return null;
          const p1 = posRef.current[n1.id] ?? {x:n1.x, y:n1.y};
          const p2 = posRef.current[n2.id] ?? {x:n2.x, y:n2.y};
          return (
            <line key={`conn-${n1.id}-${n2.id}`}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="var(--canvas-link-line)" strokeWidth={1}/>
          );
        })
      )}

      {/* BLE range circles — explicit ones from step */}
      {rangeCircles.map(rc => {
        const pos = posRef.current[rc.nodeId];
        if (!pos) return null;
        return (
          <circle key={`range-${rc.nodeId}`}
            cx={pos.x} cy={pos.y} r={BLE_RADIUS} fill="none"
            stroke={rc.type === 'ble' ? COLOR_BLE_RANGE : COLOR_LORA_LINK}
            strokeWidth={1} strokeDasharray="6 4"
            opacity={rc.active ? 0.35 : 0.12}/>
        );
      })}

      {/* Faint BLE ranges for all non-offline nodes */}
      {scenario.nodes.map(n => {
        if (rangeCircles.some(r => r.nodeId === n.id)) return null;
        if (overrideMap.get(n.id) === 'offline') return null;
        if (n.status === 'out-of-range') return null;
        const pos = posRef.current[n.id] ?? {x:n.x, y:n.y};
        return (
          <circle key={`range-bg-${n.id}`}
            cx={pos.x} cy={pos.y} r={BLE_RADIUS} fill="none"
            stroke="var(--canvas-grid-dot)" strokeWidth={1} strokeDasharray="4 5"/>
        );
      })}

      {/* Ripples — follow node position */}
      {ripples.map(r => {
        const pos = posRef.current[r.nodeId] ?? {x:0,y:0};
        return (
          <circle key={r.id} cx={pos.x} cy={pos.y}
            r={20 + r.progress*60} fill="none" stroke={r.color}
            strokeWidth={2} opacity={(1-r.progress)*0.5}/>
        );
      })}

      {/* Drop pulses — red expanding ring at drop point */}
      {dropPulses.map(dp => (
        <g key={dp.id}>
          <circle cx={dp.x} cy={dp.y} r={8 + dp.progress*20}
            fill="none" stroke={COLOR_DROP_PACKET} strokeWidth={2}
            opacity={(1-dp.progress)*0.9}/>
          <circle cx={dp.x} cy={dp.y} r={4}
            fill={COLOR_DROP_PACKET} opacity={(1-dp.progress)*0.7}/>
        </g>
      ))}

      {/* Running packets */}
      {packets.map(pkt => {
        if (pkt.done) return null;
        const prog  = pkt.progress;
        const x     = pkt.fromX + (pkt.toX - pkt.fromX) * prog;
        const y     = pkt.fromY + (pkt.toY - pkt.fromY) * prog;
        const color = packetColor(pkt.type);
        const isDrop = pkt.type === 'duplicate-drop';
        const opacity = pkt.phase === 'fade' ? 1 - pkt.fadeT : 1;
        return (
          <g key={pkt.id} opacity={opacity}>
            <circle cx={x} cy={y} r={10} fill={color} opacity={0.18}/>
            <circle cx={x} cy={y} r={isDrop ? 4 : 5} fill={color} opacity={isDrop ? 0.6 : 0.95}/>
            {prog > 0.04 && pkt.phase === 'travel' && (
              <line
                x1={pkt.fromX + (pkt.toX-pkt.fromX) * Math.max(0, prog-0.12)}
                y1={pkt.fromY + (pkt.toY-pkt.fromY) * Math.max(0, prog-0.12)}
                x2={x} y2={y}
                stroke={color} strokeWidth={1.5} opacity={0.35}/>
            )}
            {pkt.label && prog > 0.25 && prog < 0.85 && pkt.phase === 'travel' && (
              <text x={x} y={y-12} textAnchor="middle"
                fill={color} fontSize={10} fontFamily="JetBrains Mono, monospace" opacity={0.85}>
                {pkt.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes — draggable */}
      {scenario.nodes.map(node => {
        const isActive  = activeSet.has(node.id);
        const isPulse   = pulseSet.has(node.id);
        const ovr       = overrideMap.get(node.id);
        const color     = nodeColor(node, isActive, isPulse, ovr);
        const isOffline = ovr === 'offline'       || node.status === 'offline';
        const isOOR     = ovr === 'out-of-range'  || node.status === 'out-of-range';
        const opacity   = isOffline ? 0.2 : isOOR ? 0.35 : 1;
        const pos       = posRef.current[node.id] ?? {x:node.x, y:node.y};
        const isDragging = draggingId === node.id;

        return (
          <g key={node.id} opacity={opacity}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={e => onNodeDown(e, node.id)}
          >
            {/* Drag hint ring */}
            <circle cx={pos.x} cy={pos.y} r={node.type === 'phone' ? 36 : 32}
              fill="none"
              stroke={isDragging ? color : 'rgba(255,255,255,0.07)'}
              strokeWidth={isDragging ? 1.5 : 1}
              strokeDasharray={isDragging ? undefined : '3 4'}
              opacity={isDragging ? 0.35 : 0.6}/>

            <NodeIconShape x={pos.x} y={pos.y} color={color} glow={isActive} type={node.type} />

            <text x={pos.x} y={pos.y + (node.type === 'phone' ? 36 : 32)}
              textAnchor="middle" fill={color} fontSize={13} fontWeight={600}
              fontFamily="General Sans, sans-serif"
              opacity={isOffline ? 0.4 : isOOR ? 0.5 : 1}>
              {node.label}
            </text>

            {isOffline && (
              <text x={pos.x} y={pos.y-36} textAnchor="middle"
                fill={COLOR_DROP_PACKET} fontSize={9}
                fontFamily="JetBrains Mono, monospace" letterSpacing={1} opacity={0.7}>
                OFFLINE
              </text>
            )}
            {isOOR && !isOffline && (
              <text x={pos.x} y={pos.y-36} textAnchor="middle"
                fill="#9ca3af" fontSize={9}
                fontFamily="JetBrains Mono, monospace" letterSpacing={1} opacity={0.6}>
                OUT OF RANGE
              </text>
            )}
            {isActive && (
              <circle cx={pos.x} cy={pos.y} r={node.type === 'phone' ? 30 : 26}
                fill="none" stroke={color} strokeWidth={1} opacity={0.3}/>
            )}
          </g>
        );
      })}

      {/* Topology error overlay */}
      {topoError && (
        <g>
          <rect x={VB_W/2 - 280} y={VB_H/2 - 28} width={560} height={56} rx={10}
            fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth={1}/>
          <text x={VB_W/2} y={VB_H/2 - 6} textAnchor="middle"
            fill="#f87171" fontSize={11} fontFamily="JetBrains Mono, monospace"
            letterSpacing={1} fontWeight={700}>
            TOPOLOGY ERROR
          </text>
          <text x={VB_W/2} y={VB_H/2 + 14} textAnchor="middle"
            fill="#f87171" fontSize={10} fontFamily="JetBrains Mono, monospace" opacity={0.8}>
            {topoError}
          </text>
        </g>
      )}

      {/* LoRa cluster labels */}
      {scenario.nodes.some(n => n.type === 'esp32-lora') && (
        <>
          <text x={200} y={520} textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize={11}
            fontFamily="JetBrains Mono, monospace" letterSpacing={2}>LOCAL CLUSTER</text>
          <text x={800} y={520} textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize={11}
            fontFamily="JetBrains Mono, monospace" letterSpacing={2}>REMOTE CLUSTER</text>
          <line x1={500} y1={30} x2={500} y2={490}
            stroke="rgba(255,255,255,0.05)" strokeWidth={1} strokeDasharray="3 6"/>
        </>
      )}
    </svg>
  );
}
