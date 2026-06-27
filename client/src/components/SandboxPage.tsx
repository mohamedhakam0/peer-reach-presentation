import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import LogPanel from './LogPanel';
import type { LogEntry } from '../lib/scenarios';
import { Play, RotateCcw, ChevronDown, ChevronRight, Edit2, Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

// ── COLOR CONSTANTS ─────────────────────────────────────────────────────────
const CYAN   = '#67e8f9';
const AMBER  = '#fcd34d';
const VIOLET = '#c4b5fd';
const ICON_CACHE_BUST = '20260411b';
const NODE_ICON_SRC = {
    phone: `/icons/phone.webp?v=${ICON_CACHE_BUST}`,
    esp32: `/icons/esp32.webp?v=${ICON_CACHE_BUST}`,
    lora: `/icons/lora.webp?v=${ICON_CACHE_BUST}`,
} as const;
const NODE_PLACEHOLDER_COLOR = {
    phone: '#00bcd4',
    esp32: '#f0a500',
    lora: '#9c27b0',
} as const;

// ── TYPES ───────────────────────────────────────────────────────────────────
type NodeType = 'phone' | 'esp32' | 'lora';

export interface SandboxCanvasState {
    nodes: Array<{ id: string; type: NodeType; x: number; y: number; label: string }>;
    links: Array<{ sourceId: string; targetId: string }>;
}

interface SandboxPageProps {
    externalCanvasState?: SandboxCanvasState | null;
    externalCanvasStateVersion?: number;
    onCanvasStateChange?: (state: SandboxCanvasState) => void;
}

interface NetworkNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label: string;
}

interface LoRaLink {
  id: string;
  from: string;
  to: string;
}

type SimStatus = 'idle' | 'playing' | 'paused' | 'done';

interface SimFrame {
    packets: { id: string, from: string, to: string, status: 'moving' | 'delivered' | 'drop', type: 'flood'|'ack' }[];
    logs: LogEntry[];
    delivered: boolean;
}

export type Preset = {
  id: string;
  name: string;
  description: string;
  nodes: Array<{id: string, label: string, type: 'phone'|'esp32'|'lora', x: number, y: number}>;
  lora_links: Array<{from: string, to: string}>;
  created_at?: string;
  updated_at?: string;
  is_builtin?: boolean;
}

const BUILTIN_PRESETS: Preset[] = [
  { id: 'b1', name: 'BLE Mesh Delivery', description: 'Simple multi-hop delivery', is_builtin: true, nodes: [{id:'n1', label:'Phone A', type:'phone', x: 200, y: 300}, {id:'n2', label:'ESP32-1', type:'esp32', x: 400, y: 300}, {id:'n3', label:'Phone B', type:'phone', x: 600, y: 300}], lora_links: [] },
  { id: 'b2', name: 'Out of Range', description: 'Destination cannot be reached', is_builtin: true, nodes: [{id:'n1', label:'Phone A', type:'phone', x: 200, y: 300}, {id:'n2', label:'ESP32-1', type:'esp32', x: 400, y: 300}, {id:'n3', label:'Phone B', type:'phone', x: 800, y: 300}], lora_links: [] },
  { id: 'b3', name: 'LoRa Bridge', description: 'Two meshes connected via LoRa', is_builtin: true, nodes: [{id:'n1', label:'Phone A', type:'phone', x: 200, y: 300}, {id:'n2', label:'LoRa-1', type:'lora', x: 400, y: 300}, {id:'n3', label:'LoRa-2', type:'lora', x: 700, y: 300}, {id:'n4', label:'Phone B', type:'phone', x: 900, y: 300}], lora_links: [{from: 'n2', to: 'n3'}] },
  { id: 'b4', name: 'HELLO Beacon', description: 'New node introduction', is_builtin: true, nodes: [{id:'n1', label:'Phone A', type:'phone', x: 300, y: 200}, {id:'n2', label:'ESP32-1', type:'esp32', x: 400, y: 350}, {id:'n3', label:'Phone B', type:'phone', x: 500, y: 200}], lora_links: [] },
  { id: 'b5', name: 'Dup Suppression', description: 'Diamond topology flood', is_builtin: true, nodes: [{id:'n1', label:'Phone A', type:'phone', x: 150, y: 300}, {id:'n2', label:'ESP32-1', type:'esp32', x: 350, y: 150}, {id:'n3', label:'ESP32-2', type:'esp32', x: 350, y: 450}, {id:'n4', label:'Phone B', type:'phone', x: 550, y: 300}], lora_links: [] },
  { id: 'b6', name: 'Node Leaves', description: 'Mid-delivery dropout', is_builtin: true, nodes: [{id:'n1', label:'Phone A', type:'phone', x: 200, y: 300}, {id:'n2', label:'ESP32-1', type:'esp32', x: 400, y: 300}, {id:'n3', label:'Phone B', type:'phone', x: 600, y: 300}], lora_links: [] }
];

// ── CONSTANTS & HELPERS ─────────────────────────────────────────────────────
const MAX_NODES = 12;
const RADIUS = { phone: 120, esp32: 120, lora: 160 };

function getRadius(type: NodeType) { return RADIUS[type]; }
function generateHexagonPoints(radius: number) {
  return Array.from({ length: 6 }).map((_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return `${radius * Math.cos(angle)},${radius * Math.sin(angle)}`;
  }).join(' ');
}
function generateDiamondPoints(radius: number) { return `0,-${radius} ${radius},0 0,${radius} -${radius},0`; }

// ── ICONS ───────────────────────────────────────────────────────────────────
const NodeTypeIcon = ({ type, size = 20 }: { type: NodeType; size?: number }) => (
    <img
        src={NODE_ICON_SRC[type]}
        alt={type}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
);

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function SandboxPage({ externalCanvasState, externalCanvasStateVersion, onCanvasStateChange }: SandboxPageProps) {
  // Global canvas state
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [links, setLinks] = useState<LoRaLink[]>([]);
  
  // Interaction state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [drawingLink, setDrawingLink] = useState<{ fromId: string; x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, target: {type:'node', id:string}|{type:'link', id:string} | null, showRename:boolean } | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [activePresetName, setActivePresetName] = useState<string | null>(null);
    const [palettePos, setPalettePos] = useState({ x: 24, y: 14 });
    const [paletteDrag, setPaletteDrag] = useState<{ offsetX: number; offsetY: number } | null>(null);

  // Simulation state
  const [sourceId, setSourceId] = useState<string>('');
  const [destId, setDestId] = useState<string>('');
  const [ttl, setTtl] = useState<number>(5);
  
  const [simStatus, setSimStatus] = useState<SimStatus>('idle');
  const [simFrames, setSimFrames] = useState<SimFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [simLogs, setSimLogs] = useState<LogEntry[]>([]);
  const [simMetrics, setSimMetrics] = useState<any>(null);
    const [simSpeed, setSimSpeed] = useState<number>(1);

  // Presets & Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  
  const [presetsPanelExpanded, setPresetsPanelExpanded] = useState(true);
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [presetsError, setPresetsError] = useState(false);

  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetForm, setPresetForm] = useState({ id: '', name: '', description: '' });
        const [iconsReady, setIconsReady] = useState(false);
        const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
        const [panDrag, setPanDrag] = useState<{ lastX: number; lastY: number } | null>(null);

  const [pendingLoadPreset, setPendingLoadPreset] = useState<Preset | null>(null);

  // UI state
  const [toastMsg, setToastMsg] = useState<{msg: string, color: string} | null>(null);
    const [showSimTooltip, setShowSimTooltip] = useState(false);
    const [logPanelCollapsed, setLogPanelCollapsed] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
    const paletteRef = useRef<HTMLDivElement>(null);
    const simulateWrapRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string, color: string = '#fca5a5') => {
      setToastMsg({ msg, color });
  };

  const formatSpeed = (value: number) => {
      const rounded = Math.round(value * 100) / 100;
      return Number.isInteger(rounded) ? `${rounded}x` : `${rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}x`;
  };

  const handlePrevStep = useCallback(() => {
      setSimStatus((s) => (s === 'playing' ? 'paused' : s));
      setCurrentFrameIndex((idx) => Math.max(0, idx - 1));
  }, []);

  const handleNextStep = useCallback(() => {
      setCurrentFrameIndex((idx) => {
          const last = Math.max(0, simFrames.length - 1);
          const next = Math.min(last, idx + 1);
          if (next >= last) {
              setSimStatus('done');
          } else {
              setSimStatus((s) => (s === 'playing' || s === 'done' ? 'paused' : s));
          }
          return next;
      });
  }, [simFrames.length]);

  const toggleAutoPlay = useCallback(() => {
      setSimStatus((s) => {
          if (s === 'playing') return 'paused';
          if (s === 'done') {
              setCurrentFrameIndex(0);
              setSimLogs(simFrames[0]?.logs ?? []);
              return 'playing';
          }
          return 'playing';
      });
  }, [currentFrameIndex, simFrames]);

  useEffect(() => {
        let active = true;
        const loadIcon = (src: string) =>
            new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => reject(new Error(`Failed to load icon: ${src}`));
                img.src = src;
            });

        Promise.all(Object.values(NODE_ICON_SRC).map((src) => loadIcon(src)))
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
        if (!externalCanvasState || !externalCanvasStateVersion) return;
        const restoredNodes: NetworkNode[] = externalCanvasState.nodes.map((n) => ({
            id: n.id,
            type: n.type,
            x: n.x,
            y: n.y,
            label: n.label,
        }));
        const restoredLinks: LoRaLink[] = externalCanvasState.links.map((l, idx) => ({
            id: `link-restored-${externalCanvasStateVersion}-${idx}`,
            from: l.sourceId,
            to: l.targetId,
        }));
        setNodes(restoredNodes);
        setLinks(restoredLinks);
        setContextMenu(null);
        setRenamingNodeId(null);
        setActivePresetName(null);
        handleReset();
    }, [externalCanvasState, externalCanvasStateVersion]);

    useEffect(() => {
        if (!onCanvasStateChange) return;
        onCanvasStateChange({
            nodes: nodes.map((n) => ({
                id: n.id,
                type: n.type,
                x: n.x,
                y: n.y,
                label: n.label,
            })),
            links: links.map((l) => ({
                sourceId: l.from,
                targetId: l.to,
            })),
        });
    }, [nodes, links, onCanvasStateChange]);

    useEffect(() => {
    if (toastMsg) {
      const tm = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(tm);
    }
  }, [toastMsg]);

    useEffect(() => {
        if (sourceId && destId) {
            setShowSimTooltip(false);
        }
    }, [sourceId, destId]);

    useEffect(() => {
        const onDocPointerDown = (e: MouseEvent) => {
            if (!simulateWrapRef.current) return;
            if (!simulateWrapRef.current.contains(e.target as Node)) {
                setShowSimTooltip(false);
            }
        };
        window.addEventListener('mousedown', onDocPointerDown);
        return () => window.removeEventListener('mousedown', onDocPointerDown);
    }, []);

  useEffect(() => {
      // Load presets
      const fetchPresets = async () => {
          setLoadingPresets(true);
          try {
              const { data, error } = await supabase.from('presets').select('*').order('created_at', { ascending: false });
              if (error) throw error;
              setCustomPresets(data || []);
              setPresetsError(false);
          } catch (e) {
              setPresetsError(true);
          } finally {
              setLoadingPresets(false);
          }
      };
      fetchPresets();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable = !!target && (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement ||
          target.isContentEditable
      );

      if (e.key === 'Escape') {
          setContextMenu(null);
          setShowAdminModal(false);
          setShowPresetModal(false);
          setPendingLoadPreset(null);
      }

      if (!isEditable && simFrames.length > 0 && e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevStep();
          return;
      }

      if (!isEditable && simFrames.length > 0 && e.key === 'ArrowRight') {
          e.preventDefault();
          handleNextStep();
          return;
      }

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
          if (isAdmin) {
              setIsAdmin(false);
              showToast('Logged out of admin mode', '#86efac');
          } else {
              setShowAdminModal(true);
              setAdminPassword('');
          }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextStep, handlePrevStep, isAdmin, simFrames.length]);

  const handleAdminAuth = () => {
      if (adminPassword === import.meta.env.VITE_ADMIN_PASSWORD) {
          setIsAdmin(true);
          setShowAdminModal(false);
          showToast('Admin authenticated', '#86efac');
      } else {
          showToast('Incorrect password', '#f87171');
      }
  };

  // Preset operations
  const savePreset = async () => {
      if (!presetForm.name) return;
      try {
          const payload = {
              name: presetForm.name,
              description: presetForm.description,
              nodes: nodes.map(n => ({ id: n.id, label: n.label, type: n.type, x: n.x, y: n.y })),
              lora_links: links.map(l => ({ from: l.from, to: l.to }))
          };
          if (presetForm.id) {
              const { error } = await supabase.from('presets').update(payload).eq('id', presetForm.id);
              if (error) throw error;
              showToast('PRESET_UPDATED', '#86efac');
          } else {
              const { error } = await supabase.from('presets').insert([payload]);
              if (error) throw error;
              showToast('PRESET_SAVED "' + presetForm.name + '" saved successfully', '#86efac');
          }
          setShowPresetModal(false);
          // Refresh
          const { data } = await supabase.from('presets').select('*').order('created_at', { ascending: false });
          if(data) setCustomPresets(data);
      } catch (e: any) {
          showToast('Error saving: ' + (e.message || 'unknown'), '#f87171');
      }
  };

  const deletePreset = async (id: string, name: string) => {
      try {
          await supabase.from('presets').delete().eq('id', id);
          setCustomPresets(prev => prev.filter(p => p.id !== id));
          showToast('PRESET_DELETED', '#f87171');
      } catch (e) {
          showToast('Error deleting', '#f87171');
      }
  };

  const triggerLoadPreset = (p: Preset) => {
      if (nodes.length > 0) {
          setPendingLoadPreset(p);
      } else {
          executeLoadPreset(p);
      }
  };

  const executeLoadPreset = (preset: Preset) => {
      setNodes(preset.nodes.map(n => ({ id: n.id, label: n.label, type: n.type, x: n.x, y: n.y })));
      setLinks(preset.lora_links.map(l => ({ id: `link-${Date.now()}-${Math.random()}`, from: l.from, to: l.to })));
      setActivePresetName(preset.name);
      handleReset(); // reset sim
      setPendingLoadPreset(null);
  };

  // Node Labels
  const getNextLabel = (type: NodeType) => {
    if (type === 'phone') {
      const existing = nodes.filter(n => n.type === 'phone');
      const letter = String.fromCharCode(65 + existing.length);
      return `Phone ${letter}`;
    }
    if (type === 'esp32') {
      const highest = nodes.filter(n => n.type === 'esp32').length;
      return `ESP32-${highest + 1}`;
    }
    const highest = nodes.filter(n => n.type === 'lora').length;
    return `LoRa-${highest + 1}`;
  };

  // ── MOUSE / POINTER EVENTS ────────────────────────────────────────────────
    const handleCanvasPointerDown = (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('[data-no-pan="true"]')) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const renderX = e.clientX - rect.left;
        const renderY = e.clientY - rect.top;
        const hitX = renderX - panOffset.x;
        const hitY = renderY - panOffset.y;
        const clickedNode = nodes.some((n) => Math.hypot(n.x - hitX, n.y - hitY) <= 20);

        if (!clickedNode) {
            setPanDrag({ lastX: e.clientX, lastY: e.clientY });
        }
        setContextMenu(null);
  };

    const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (simStatus !== 'idle') return;
        const droppedType = e.dataTransfer.getData('nodeType') as NodeType;
        if (droppedType !== 'phone' && droppedType !== 'esp32' && droppedType !== 'lora') return;
        if (nodes.length >= MAX_NODES) {
            showToast(`MAX_NODES_REACHED: 12-node limit for this testbed`);
            return;
        }
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left - panOffset.x;
        const y = e.clientY - rect.top - panOffset.y;
        const newNode: NetworkNode = {
            id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: droppedType,
            x,
            y,
            label: getNextLabel(droppedType),
        };
        setNodes((prev) => [...prev, newNode]);
        setActivePresetName(null);
    };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

        if (panDrag) {
            const dx = e.clientX - panDrag.lastX;
            const dy = e.clientY - panDrag.lastY;
            if (dx !== 0 || dy !== 0) {
                setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                setPanDrag({ lastX: e.clientX, lastY: e.clientY });
            }
            return;
        }

    if (draggingNodeId) {
            setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: x - panOffset.x, y: y - panOffset.y } : n));
      setActivePresetName(null);
    }
    if (drawingLink) {
      setDrawingLink({ ...drawingLink, x, y });
    }
  };

  const handlePointerUp = () => {
    setDraggingNodeId(null);
        setPanDrag(null);
    if (drawingLink) setDrawingLink(null);
  };

  // ── NODE INTERACTIONS ──────────────────────────────────────────────────────
  const handleNodePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    if (e.button === 2) {
      setContextMenu({ x: e.clientX, y: e.clientY, target: {type:'node', id}, showRename: false });
        } else if (e.button === 0) {
      setDraggingNodeId(id);
      setContextMenu(null);
    }
  };

    useEffect(() => {
        if (!paletteDrag) return;
        const onMouseMove = (e: MouseEvent) => {
            const canvasRect = canvasRef.current?.getBoundingClientRect();
            const paletteRect = paletteRef.current?.getBoundingClientRect();
            if (!canvasRect || !paletteRect) return;
            const maxX = Math.max(0, canvasRect.width - paletteRect.width);
            const maxY = Math.max(0, canvasRect.height - paletteRect.height);
            const nextX = Math.min(maxX, Math.max(0, e.clientX - canvasRect.left - paletteDrag.offsetX));
            const nextY = Math.min(maxY, Math.max(0, e.clientY - canvasRect.top - paletteDrag.offsetY));
            setPalettePos({ x: nextX, y: nextY });
        };
        const onMouseUp = () => setPaletteDrag(null);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [paletteDrag]);

  const handleLoRaPortPointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    if (e.button === 0) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDrawingLink({ fromId: id, x: e.clientX - rect.left, y: e.clientY - rect.top });
      setContextMenu(null);
    }
  };

  const handleLoRaPortPointerUp = (e: React.PointerEvent, targetId: string) => {
    if (drawingLink && drawingLink.fromId !== targetId) {
      const from = drawingLink.fromId;
      const to = targetId;
      const exists = links.find(l => (l.from === from && l.to === to) || (l.from === to && l.to === from));
      if (!exists) {
        setLinks([...links, { id: `link-${Date.now()}`, from, to }]);
        setActivePresetName(null);
      }
    }
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu || !contextMenu.target) return;
    if (contextMenu.target.type === 'node') {
      const id = contextMenu.target.id;
      if (action === 'delete') {
         // handled directly
      } else if (action === 'rename') {
        const node = nodes.find(n => n.id === id);
        if (node) {
          setRenamingNodeId(id);
          setRenameInput(node.label);
          setContextMenu(null);
        }
      }
    } else if (contextMenu.target.type === 'link') {
      const id = contextMenu.target.id;
      if (action === 'delete') {
        setLinks(links.filter(l => l.id !== id));
        setActivePresetName(null);
        setContextMenu(null);
      }
    }
  };

  const finishRename = () => {
    if (renamingNodeId) {
      setNodes(nodes.map(n => n.id === renamingNodeId ? { ...n, label: renameInput.trim().slice(0, 12) || n.label } : n));
      setRenamingNodeId(null);
      setActivePresetName(null);
    }
  };

  // ── LINK COMPUTATIONS ──────────────────────────────────────────────────────
  const proximityLinks = useMemo(() => {
    const lines = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            if (a.type === 'lora' && b.type === 'lora') continue; 
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            const rA = getRadius(a.type);
            const rB = getRadius(b.type);
            if (dist <= rA + rB) {
                const color = a.type === 'phone' || b.type === 'phone' ? CYAN : AMBER;
                lines.push({ fromId: a.id, toId: b.id, x1: a.x, y1: a.y, x2: b.x, y2: b.y, color: `${color}40` });
            }
        }
    }
    return lines;
  }, [nodes]);

  const phoneCount = nodes.filter(n => n.type === 'phone').length;
  const espCount = nodes.filter(n => n.type === 'esp32').length;
  const isValid = phoneCount >= 2;

  // ── ENGINE ─────────────────────────────────────────────────────────────────
  const handleSimulate = () => {
      if(!sourceId || !destId) {
          setShowSimTooltip(true);
          return;
      }

      const adj: Record<string, string[]> = {};
      nodes.forEach(n => adj[n.id] = []);
      proximityLinks.forEach(l => {
          adj[l.fromId].push(l.toId);
          adj[l.toId].push(l.fromId);
      });
      links.forEach(l => {
          adj[l.from].push(l.to);
          adj[l.to].push(l.from);
      });

      const frames: SimFrame[] = [];
      let queue = [sourceId];
      let visited = new Set([sourceId]);
      let hop = 0;
      let targetFound = false;
      let pathMap = new Map<string, string>();
      
      let initialLogs: LogEntry[] = [
          { time: '00.00', fn: 'TOPOLOGY', msg: `Canvas: ${nodes.length} nodes — ${phoneCount} phones, ${espCount} ESP32`, color: 'white' },
          { time: '00.00', fn: 'SIM_START', msg: `Source=${nodes.find(n=>n.id===sourceId)?.label}  Destination=${nodes.find(n=>n.id===destId)?.label}  TTL=${ttl}  msg_id=0x3F`, color: 'white' }
      ];

      let totalPkt = 0;
      let totalDrops = 0;

      frames.push({ packets: [], logs: initialLogs, delivered: false });

      while(queue.length > 0 && hop < ttl && !targetFound) {
          let nxtQueue: string[] = [];
          let curPkts: any[] = [];
          let curLogs: LogEntry[] = [];

          for(const curr of queue) {
              const neighbors = adj[curr] || [];
              const currNode = nodes.find(n=>n.id===curr);
              for(const nbr of neighbors) {
                  const nbrNode = nodes.find(n=>n.id===nbr);
                  const isTarget = nbr === destId;

                  totalPkt++;
                  if(!visited.has(nbr)) {
                      visited.add(nbr);
                      pathMap.set(nbr, curr);
                      curPkts.push({ id: `pkt-${Date.now()}-${Math.random()}`, from: curr, to: nbr, status: isTarget ? 'delivered' : 'moving', type: 'flood' });
                      curLogs.push({ time: `00.0${hop+1}`, fn: `HOP_${hop+1}`, msg: `${currNode?.label}→${nbrNode?.label} BLE in-range ✓`, color: 'cyan' });
                      
                      if(isTarget) {
                          targetFound = true;
                      } else {
                          nxtQueue.push(nbr);
                      }
                  } else {
                      totalDrops++;
                      curPkts.push({ id: `pkt-${Date.now()}-${Math.random()}`, from: curr, to: nbr, status: 'drop', type: 'flood' });
                      curLogs.push({ time: `00.0${hop+1}`, fn: `DUP_DROP`, msg: `${nbrNode?.label} already received 0x3F — dropping copy`, color: 'red' });
                  }
              }
          }
          if (curPkts.length > 0 || curLogs.length > 0) {
              frames.push({ packets: curPkts, logs: curLogs, delivered: targetFound });
          }
          
          queue = nxtQueue;
          hop++;
      }

      if (targetFound) {
          let ackPath = [];
          let curr = destId;
          while(curr !== sourceId) {
              ackPath.push(curr);
              curr = pathMap.get(curr)!;
          }
          ackPath.push(sourceId);
          ackPath.reverse(); 
          
          frames.push({
              packets: [],
              logs: [{ time: `00.0${hop+1}`, fn: 'ACK_GEN', msg: `${nodes.find(n=>n.id===destId)?.label} generates ACK for 0x3F`, color: 'white' }],
              delivered: true
          });

          for (let i = ackPath.length - 1; i > 0; i--) {
              const sender = ackPath[i];
              const receiver = ackPath[i-1];
              totalPkt++;
              frames.push({
                  packets: [{ id: `ack-${Date.now()}-${Math.random()}`, from: sender, to: receiver, status: 'delivered', type: 'ack' }],
                  logs: [{ time: `00.0${hop+2}`, fn: 'ACK_HOP', msg: `${nodes.find(n=>n.id===sender)?.label}→${nodes.find(n=>n.id===receiver)?.label} ✓`, color: 'green' }],
                  delivered: true
              });
          }
          
          const pathStr = ackPath.map(id => nodes.find(n=>n.id===id)?.label).join('→');
          frames.push({
              packets: [],
              logs: [{ time: `00.0${hop+3}`, fn: 'DELIVERED', msg: `msg_id=0x3F hops=${ackPath.length - 1} path=${pathStr}`, color: 'green' }],
              delivered: true
          });

          setSimMetrics({
              status: 'DELIVERED',
              path: pathStr,
              hops: ackPath.length - 1,
              packetsSent: `${totalPkt} (${totalPkt - (ackPath.length - 1)} flood + ${ackPath.length - 1} ACK)`,
              duplicates: `${totalDrops} dropped`,
              latency: `~${((ackPath.length-1)*1.2).toFixed(1)}s`,
              ttl: ttl - (ackPath.length - 1)
          });

      } else {
          frames.push({
              packets: [],
              logs: [{ time: `00.0${hop+1}`, fn: 'UNCONFIRMED', msg: `Destination never reached. Timer started.`, color: 'red' }],
              delivered: false
          });
          setSimMetrics({
              status: 'UNCONFIRMED',
              path: 'N/A',
              hops: 'N/A',
              packetsSent: `${totalPkt} flood`,
              duplicates: `${totalDrops} dropped`,
              latency: 'TIMEOUT',
              ttl: Math.max(0, ttl - hop)
          });
      }

      setSimFrames(frames);
      setCurrentFrameIndex(0);
      setSimLogs(frames[0].logs);
      setSimStatus('playing');
  };

  const handleReset = () => {
    setSimStatus('idle');
    setSimFrames([]);
    setCurrentFrameIndex(0);
    setSimLogs([]);
    setSimMetrics(null);
  };

  useEffect(() => {
    let t: any;
    if (simStatus === 'playing' && simFrames.length > 0) {
        if (currentFrameIndex >= simFrames.length - 1) {
            setSimStatus('done');
        } else {
            t = setTimeout(() => {
                setCurrentFrameIndex((i) => Math.min(simFrames.length - 1, i + 1));
            }, Math.max(200, 1200 / simSpeed));
        }
    }
    return () => clearTimeout(t);
  }, [simStatus, currentFrameIndex, simFrames, simSpeed]);

  useEffect(() => {
      if (simFrames[currentFrameIndex]) {
          setSimLogs(prev => {
              const newLogs = simFrames[currentFrameIndex].logs;
              if (newLogs.length === 0) return prev;
              const lastPrev = prev[prev.length - 1];
              if (lastPrev === newLogs[newLogs.length - 1]) return prev;
              return [...prev, ...newLogs];
          });
      }
  }, [currentFrameIndex, simFrames]);

  const activePackets = simFrames[currentFrameIndex]?.packets || [];
    const needsRouteSelection = !sourceId || !destId;
        // Regression note: autoplay was changed to end in 'paused' instead of 'done',
        // so results must key off completion index rather than strict simStatus==='done'.
        const isSimulationComplete = simFrames.length > 0 && currentFrameIndex >= simFrames.length - 1;
    const logPanelWidth = logPanelCollapsed ? 34 : 340;

  return (
        <div className="sim-canvas-surface"
      style={{
        display:'flex', width:'100%', height:'100%', 
                background:'var(--canvas-bg)', overflow:'hidden', position: 'relative'
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* CANVAS + LOGS */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* TOP ROUTE Toolbar */}
        <div style={{
            height: 48, background: 'var(--panel-bg)', borderBottom: '1px solid var(--panel-border)',
            display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, zIndex: 10
        }}>
            <select 
                title="source"
                value={sourceId}
                onChange={e => setSourceId(e.target.value)}
                style={{ background: 'var(--panel-bg-soft)', color: 'var(--text-primary)', border: '1px solid var(--panel-border)', padding: '4px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
            >
                <option value="">Select source</option>
                {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            <span style={{ color: '#555' }}>→</span>
            <select 
                title="destination"
                value={destId}
                onChange={e => setDestId(e.target.value)}
                style={{ background: 'var(--panel-bg-soft)', color: 'var(--text-primary)', border: '1px solid var(--panel-border)', padding: '4px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
            >
                <option value="">Select destination</option>
                {nodes.filter(n=>n.id !== sourceId).map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            
            <div style={{ borderLeft: '1px solid #333', height: 24, margin: '0 8px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>TTL:</span>
                <input type="number" min="1" max="10" value={ttl} onChange={e=>setTtl(Number(e.target.value))} disabled={simStatus !== 'idle'}
                    style={{ width: 40, background: 'var(--panel-bg-soft)', color: 'var(--text-primary)', border: '1px solid var(--panel-border)', padding: '4px', borderRadius: 4, fontFamily: 'monospace', textAlign: 'center' }} />
            </div>

            <div style={{ flex: 1 }} />

            <div
                ref={simulateWrapRef}
                onMouseEnter={() => {
                    if (needsRouteSelection) setShowSimTooltip(true);
                }}
                onMouseLeave={() => {
                    setShowSimTooltip(false);
                }}
                style={{ position: 'relative', display: 'inline-flex' }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: 'calc(100% + 8px)',
                        transform: 'translateX(-50%)',
                        background: '#1a1a1a',
                        border: '1px solid var(--panel-border)',
                        color: 'var(--text-secondary)',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 10,
                        borderRadius: 6,
                        padding: '7px 10px',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        opacity: showSimTooltip && needsRouteSelection ? 1 : 0,
                        visibility: showSimTooltip && needsRouteSelection ? 'visible' : 'hidden',
                        transition: 'opacity 150ms ease',
                        zIndex: 40,
                    }}
                >
                    Please select a source and a destination first
                    <div
                        style={{
                            position: 'absolute',
                            left: '50%',
                            bottom: '100%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderBottom: '6px solid #1a1a1a',
                        }}
                    />
                </div>
                <button 
                    disabled={needsRouteSelection || simStatus !== 'idle'}
                    onClick={(e) => {
                        if (needsRouteSelection) {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowSimTooltip(true);
                            return;
                        }
                        handleSimulate();
                    }}
                    style={{ background: (!sourceId || !destId || simStatus !== 'idle') ? '#1c1c1c' : CYAN, color: (!sourceId || !destId || simStatus !== 'idle') ? '#555' : 'black', border: 'none', padding: '6px 16px', borderRadius: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, cursor: (!sourceId || !destId || simStatus !== 'idle') ? 'not-allowed' : 'pointer' }}
                >
                    <Play size={14} /> SIMULATE
                </button>
                {/* Regression note: disabling the button removed direct click events,
                    so this overlay restores click-to-tooltip behavior for invalid route selection. */}
                {needsRouteSelection && simStatus === 'idle' && (
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowSimTooltip(true);
                        }}
                        style={{ position: 'absolute', inset: 0, cursor: 'not-allowed' }}
                    />
                )}
            </div>
            <button 
                onClick={handleReset}
                disabled={simStatus === 'idle'}
                style={{ background: '#1c1c1c', color: '#ccc', border: 'none', padding: '6px 16px', borderRadius: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
                <RotateCcw size={14} /> RESET
            </button>

            {isSimulationComplete && (
                <button 
                    onClick={() => {
                        if (!sourceId || !destId) {
                            setShowSimTooltip(true);
                            return;
                        }
                        setSimMetrics(null);
                        setSimLogs([]);
                        handleSimulate();
                    }}
                    style={{ background: '#333', color: 'white', border: 'none', padding: '6px 16px', borderRadius: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                >
                    RESTART
                </button>
            )}
        </div>

        {/* PENDING LOAD BANNER */}
        {pendingLoadPreset && (
            <div style={{ position: 'absolute', top: 58, left: '50%', transform: 'translateX(-50%)', background: '#333', border: '1px solid #555', color: 'white', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, padding: '12px 20px', borderRadius: 6, zIndex: 100, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                Load preset '{pendingLoadPreset.name}'? Current canvas will be cleared.
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setPendingLoadPreset(null)} style={{ background: '#444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => executeLoadPreset(pendingLoadPreset)} style={{ background: VIOLET, color: 'black', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Load</button>
                </div>
            </div>
        )}

        {/* CANVAS & LOGS */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div className="sim-canvas-surface"
                ref={canvasRef}
                style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: panDrag ? 'grabbing' : 'grab' }}
                onPointerDown={handleCanvasPointerDown}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleCanvasDrop}
            >
                                {/* Floating node palette */}
                                <div data-no-pan="true" ref={paletteRef} style={{ position: 'absolute', left: palettePos.x, top: palettePos.y, padding: '6px 8px 8px', borderRadius: 12, background: 'color-mix(in srgb, var(--panel-bg) 78%, transparent)', backdropFilter: 'blur(6px)', border: '1px solid var(--panel-border)', zIndex: 30 }}>
                                    <div
                                        onMouseDown={(e) => {
                                            const rect = paletteRef.current?.getBoundingClientRect();
                                            if (!rect) return;
                                            setPaletteDrag({ offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
                                        }}
                                        style={{ height: 20, marginBottom: 6, borderRadius: 8, background: 'color-mix(in srgb, var(--panel-bg-soft) 72%, transparent)', border: '1px solid var(--panel-border)', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', cursor: 'move', userSelect: 'none' }}
                                    >
                                        <span>Nodes</span>
                                        <span style={{ letterSpacing: 1 }}>≡</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <ToolbarTool type="phone" icon={<NodeTypeIcon type="phone" size={38} />} label="Phone" color={CYAN} disabled={simStatus !== 'idle' || nodes.length >= MAX_NODES} />
                                        <ToolbarTool type="esp32" icon={<NodeTypeIcon type="esp32" size={38} />} label="ESP32" color={AMBER} disabled={simStatus !== 'idle' || nodes.length >= MAX_NODES} />
                                        <ToolbarTool type="lora" icon={<NodeTypeIcon type="lora" size={38} />} label="LoRa Node" color={VIOLET} disabled={simStatus !== 'idle' || nodes.length >= MAX_NODES} />
                                    </div>
                                </div>

                                {simFrames.length > 0 && (
                                    <div
                                        data-no-pan="true"
                                        onPointerDown={(e) => e.stopPropagation()}
                                        style={{
                                            position: 'absolute',
                                            right: 16,
                                            bottom: 48,
                                            width: 300,
                                            padding: '10px 12px 12px',
                                            borderRadius: 12,
                                            background: 'color-mix(in srgb, var(--panel-bg) 78%, transparent)',
                                            backdropFilter: 'blur(6px)',
                                            border: '1px solid var(--panel-border)',
                                            zIndex: 32,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ minWidth: 48, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 0.6 }}>SPEED</span>
                                            <input
                                                type="range"
                                                min={0.25}
                                                max={3}
                                                step={0.25}
                                                value={simSpeed}
                                                onChange={(e) => setSimSpeed(Number(e.target.value))}
                                                style={{ flex: 1 }}
                                            />
                                            <span style={{ minWidth: 34, textAlign: 'right', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{formatSpeed(simSpeed)}</span>
                                        </div>
                                        <div style={{ marginTop: 2, display: 'flex', justifyContent: 'space-between', paddingLeft: 56, paddingRight: 44, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
                                            <span>0.25x</span>
                                            <span>3x</span>
                                        </div>

                                        <div style={{ marginTop: 8, textAlign: 'center', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                                            {Math.min(currentFrameIndex + 1, simFrames.length)} / {simFrames.length}
                                        </div>

                                        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                                <button
                                                    onClick={handlePrevStep}
                                                    disabled={currentFrameIndex <= 0}
                                                    style={{ width: '100%', background: 'var(--panel-bg-soft)', color: 'var(--text-primary)', border: '1px solid var(--panel-border)', padding: '6px 8px', borderRadius: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, cursor: currentFrameIndex <= 0 ? 'not-allowed' : 'pointer', opacity: currentFrameIndex <= 0 ? 0.45 : 1 }}
                                                >
                                                    ‹ Prev
                                                </button>
                                                <span style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>←</span>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                                <button
                                                    onClick={toggleAutoPlay}
                                                    style={{ width: '100%', background: simStatus === 'playing' ? 'color-mix(in srgb, #86efac 25%, var(--panel-bg-soft))' : 'var(--panel-bg-soft)', color: 'var(--text-primary)', border: '1px solid var(--panel-border)', padding: '6px 8px', borderRadius: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, cursor: 'pointer' }}
                                                >
                                                    {simStatus === 'playing' ? '⏸ Pause' : '► Auto Play'}
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                                <button
                                                    onClick={handleNextStep}
                                                    disabled={currentFrameIndex >= simFrames.length - 1}
                                                    style={{ width: '100%', background: 'var(--panel-bg-soft)', color: 'var(--text-primary)', border: '1px solid var(--panel-border)', padding: '6px 8px', borderRadius: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, cursor: currentFrameIndex >= simFrames.length - 1 ? 'not-allowed' : 'pointer', opacity: currentFrameIndex >= simFrames.length - 1 ? 0.45 : 1 }}
                                                >
                                                    Next ›
                                                </button>
                                                <span style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>→</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                {/* BACKGROUND DOT GRID */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(var(--canvas-grid-dot) 1px, transparent 1px)', backgroundSize: '24px 24px', zIndex: 0 }} />

                {/* SVG Drawing Layer */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                    {proximityLinks.map((line, i) => (
                        <line key={`prox-${i}`} x1={line.x1 + panOffset.x} y1={line.y1 + panOffset.y} x2={line.x2 + panOffset.x} y2={line.y2 + panOffset.y} stroke={line.color} strokeWidth="1.5" />
                    ))}
                    {links.map(l => {
                        const n1 = nodes.find(n => n.id === l.from);
                        const n2 = nodes.find(n => n.id === l.to);
                        if (!n1 || !n2) return null;
                        return (
                            <line 
                                key={l.id} 
                                x1={n1.x + panOffset.x} y1={n1.y + panOffset.y} x2={n2.x + panOffset.x} y2={n2.y + panOffset.y} 
                                stroke={VIOLET} strokeWidth="2" strokeDasharray="6 4"
                                opacity={0.8}
                                style={{ pointerEvents: 'auto', cursor: 'context-menu' }}
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    if (e.button === 2 && simStatus === 'idle') setContextMenu({ x: e.clientX, y: e.clientY, target: {type:'link', id:l.id}, showRename: false });
                                }}
                            />
                        );
                    })}
                    {drawingLink && (() => {
                        const n1 = nodes.find(n => n.id === drawingLink.fromId);
                        if (!n1) return null;
                        return ( <line x1={n1.x + panOffset.x} y1={n1.y + panOffset.y} x2={drawingLink.x} y2={drawingLink.y} stroke={VIOLET} strokeWidth="2" strokeDasharray="6 4" opacity={0.6} /> );
                    })()}
                </svg>

                {/* ANIMATED PACKETS */}
                {activePackets.map(pkt => {
                    const fromN = nodes.find(n=>n.id === pkt.from);
                    const toN   = nodes.find(n=>n.id === pkt.to);
                    if (!fromN || !toN) return null;
                    const isAck = pkt.type === 'ack';
                    const isDrop = pkt.status === 'drop';
                    const c = isAck ? '#86efac' : CYAN;
                    
                    return (
                        <div key={pkt.id} style={{
                            position: 'absolute',
                            left: fromN.x + panOffset.x, top: fromN.y + panOffset.y,
                            width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 10px ${c}`, zIndex: 10,
                            animation: isDrop ? 'packet-drop 1s ease-out forwards' : 'packet-move 1s ease-in-out forwards',
                            // @ts-ignore
                            '--tx': `${toN.x - fromN.x}px`, '--ty': `${toN.y - fromN.y}px`
                        }} />
                    )
                })}
                <style>{`
                    @keyframes packet-move { 0% { transform: translate(-50%, -50%); opacity: 1; } 100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))); opacity: 0; } }
                    @keyframes packet-drop { 0% { transform: translate(-50%, -50%); opacity: 1; } 50% { transform: translate(calc(-50% + var(--tx)*0.7), calc(-50% + var(--ty)*0.7)); opacity: 1; background: red; box-shadow: 0 0 10px red; } 100% { transform: translate(calc(-50% + var(--tx)*0.7), calc(-50% + var(--ty)*0.7)) scale(2); opacity: 0; background: red; } }
                `}</style>

                {/* DOM Nodes Area */}
                {nodes.map(node => {
                    const isPhone = node.type === 'phone';
                    const isEsp   = node.type === 'esp32';
                    const isLora  = node.type === 'lora';
                    const c = isPhone ? CYAN : isEsp ? AMBER : VIOLET;
                    const r = getRadius(node.type);
                    const isRenaming = renamingNodeId === node.id;
                    const isSource = node.id === sourceId;
                    const isDest = node.id === destId;

                    return (
                        <div key={node.id} style={{ position: 'absolute', left: node.x + panOffset.x, top: node.y + panOffset.y, transform: 'translate(-50%, -50%)', zIndex: isLora ? 3 : 2, cursor: draggingNodeId === node.id ? 'grabbing' : 'grab', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                            <div style={{ position: 'absolute', width: r*2, height: r*2, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', borderRadius: '50%', border: `1px dashed ${c}`, opacity: 0.2, pointerEvents: 'none' }} />
                            <div style={{ width: 40, height: 40, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', boxShadow: isSource ? `0 0 0 2px ${CYAN}` : isDest ? `0 0 0 2px #86efac` : 'none', borderRadius: '50%' }} onPointerDown={(e) => handleNodePointerDown(e, node.id)} onPointerUp={(e) => isLora && handleLoRaPortPointerUp(e, node.id)}>
                                {iconsReady ? (
                                    <img
                                        src={isPhone ? NODE_ICON_SRC.phone : isEsp ? NODE_ICON_SRC.esp32 : NODE_ICON_SRC.lora}
                                        alt={node.type}
                                        width={36}
                                        height={36}
                                        style={{ width: 36, height: 36, objectFit: 'contain', display: 'block' }}
                                        draggable={false}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            background: NODE_PLACEHOLDER_COLOR[node.type],
                                        }}
                                    />
                                )}
                                {isLora && ( <div style={{ position: 'absolute', top: -14, right: -28, background: '#1a1a1a', border: `1px solid ${c}`, color: c, fontFamily: 'JetBrains Mono, monospace', fontSize: 8, padding: '2px 5px', borderRadius: 4, opacity: 0.8 }}>RF</div> )}
                                {isLora && simStatus === 'idle' && ( <div className="lora-port" style={{ position: 'absolute', right: -6, width: 12, height: 12, borderRadius: '50%', background: VIOLET, boxShadow: `0 0 8px ${VIOLET}`, cursor: 'crosshair', opacity: 0, pointerEvents: 'auto', zIndex: 10 }} onPointerDown={(e) => handleLoRaPortPointerDown(e, node.id)} /> )}
                                <style>{`div:hover > .lora-port { opacity: 1 !important; }`}</style>
                            </div>
                            <div style={{ marginTop: 8, pointerEvents: 'auto' }}>
                                {isRenaming ? ( <input autoFocus value={renameInput} onChange={e => setRenameInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') finishRename(); if (e.key === 'Escape') setRenamingNodeId(null); }} onBlur={finishRename} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, background: '#111', border: `1px solid ${c}`, color: '#fff', padding: '2px 6px', borderRadius: 4, width: 80, textAlign: 'center', outline: 'none' }} maxLength={12} /> ) : ( <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, cursor: 'text' }} onDoubleClick={(e) => { if(simStatus !== 'idle') return; e.stopPropagation(); handleContextMenuAction('rename'); setContextMenu({ target:{type:'node', id: node.id}} as any); setRenamingNodeId(node.id); setRenameInput(node.label); }}>{node.label}</div> )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* LOG PANEL SIDEBAR */}
            <div style={{ width: logPanelWidth, minWidth: logPanelWidth, maxWidth: logPanelWidth, background: 'var(--panel-bg)', borderLeft: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', zIndex: 2, position: 'relative', transition: 'width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease' }}>
                <button
                    className="collapse-btn"
                    onClick={() => setLogPanelCollapsed(v => !v)}
                    title={logPanelCollapsed ? 'Expand Engineer Log' : 'Collapse Engineer Log'}
                    style={{
                        position: 'fixed',
                        right: logPanelWidth - 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 100,
                    }}
                >
                    {logPanelCollapsed ? '‹' : '›'}
                </button>

                {logPanelCollapsed ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 10,
                            letterSpacing: '0.12em',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            userSelect: 'none',
                        }}>
                            Engineer Log
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}> <LogPanel entries={simLogs} /> </div>
                        {simMetrics && isSimulationComplete && (
                            <div style={{ padding: 16, borderTop: `1px solid ${simMetrics.status === 'DELIVERED' ? '#86efac' : '#f87171'}40`, background: 'var(--panel-bg-soft)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-primary)' }}>
                                <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontSize: 10 }}>┌─ SIMULATION RESULT ──────────────────┐</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 4, paddingLeft: 8 }}>
                                    <div style={{ color: 'rgba(255,255,255,0.5)' }}>Status</div><div style={{ color: simMetrics.status === 'DELIVERED' ? '#86efac' : '#f87171' }}>{simMetrics.status}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)' }}>Path</div><div>{simMetrics.path}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)' }}>Hops</div><div>{simMetrics.hops}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)' }}>Packets sent</div><div>{simMetrics.packetsSent}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)' }}>Duplicates dropped</div><div>{simMetrics.duplicates}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)' }}>Est. latency</div><div>{simMetrics.latency}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)' }}>TTL remaining</div><div>{simMetrics.ttl}</div>
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8, fontSize: 10 }}>└──────────────────────────────────────┘</div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
      </div>

      {/* VALIDATION OVERLAY BAR */}
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: logPanelWidth, height: 32, background: 'var(--panel-bg)', borderTop: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 20, zIndex: 20, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          <div>Nodes: {nodes.length} ({phoneCount} phones, {espCount} esp32)</div>
          <div>|</div>
          <div>Links: {proximityLinks.length} BLE, {links.length} LoRa</div>
          <div style={{ flex: 1 }} />
          {activePresetName && <div style={{ color: '#c4b5fd', borderRight: '1px solid #333', paddingRight: 20, marginRight: 20 }}>Preset: {activePresetName}</div>}
          <div style={{ color: isValid ? '#86efac' : (nodes.length > 0 ? '#fcd34d' : '#f87171') }}>Status: {isValid ? 'READY TO SIMULATE' : 'INVALID: MIN 2 PHONES PENDING'}</div>
      </div>

    {toastMsg && ( <div style={{ position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)', background: 'var(--modal-bg)', border: `1px solid ${toastMsg.color}`, color: toastMsg.color, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, padding: '8px 16px', borderRadius: 6, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{toastMsg.msg}</div> )}

    {isAdmin && ( <div style={{ position: 'absolute', bottom: 10, right: logPanelWidth + 10, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.2)', pointerEvents:'none', zIndex: 20 }}>ADMIN</div> )}

      {/* MODALS */}
      {showAdminModal && (
          <>
          <div style={{ position: 'fixed', inset: 0, background: 'var(--modal-overlay)', zIndex: 1000 }} onClick={()=>setShowAdminModal(false)} />
          <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--modal-bg)', border: '1px solid var(--panel-border)', padding: 24, borderRadius: 8, zIndex: 1001, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', width: 320, boxShadow: '0 10px 40px rgba(0,0,0,0.7)' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>┌─ ADMIN ACCESS ──────────────────┐</div>
              <div style={{ marginBottom: 8 }}>Enter admin password:</div>
              <input type="password" autoFocus value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleAdminAuth();}} style={{ width: '100%', background: '#0a0a0a', border: '1px solid #444', color: 'white', padding: '6px 12px', fontFamily: 'inherit', marginBottom: 16, outline: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={()=>setShowAdminModal(false)} style={{ background: 'transparent', border: '1px solid #555', color: '#ccc', padding: '6px 12px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleAdminAuth} style={{ background: '#e2e8f0', border: 'none', color: '#000', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}>Authenticate</button>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>└─────────────────────────────────┘</div>
          </div>
          </>
      )}

      {showPresetModal && (
          <>
          <div style={{ position: 'fixed', inset: 0, background: 'var(--modal-overlay)', zIndex: 1000 }} onClick={()=>setShowPresetModal(false)} />
          <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--modal-bg)', border: '1px solid var(--panel-border)', padding: 24, borderRadius: 8, zIndex: 1001, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', width: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.7)' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>┌─ {presetForm.id ? 'EDIT PRESET' : 'SAVE PRESET'} ──────────────────────┐</div>
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}><span style={{width: 100}}>Name:</span>
                  <input autoFocus value={presetForm.name} onChange={e=>setPresetForm({...presetForm, name: e.target.value})} style={{ flex: 1, background: '#0a0a0a', border: '1px solid #444', color: 'white', padding: '6px 12px', fontFamily: 'inherit', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}><span style={{width: 100}}>Description:</span>
                  <input value={presetForm.description} onChange={e=>setPresetForm({...presetForm, description: e.target.value})} style={{ flex: 1, background: '#0a0a0a', border: '1px solid #444', color: 'white', padding: '6px 12px', fontFamily: 'inherit', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={()=>setShowPresetModal(false)} style={{ background: 'transparent', border: '1px solid #555', color: '#ccc', padding: '6px 12px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={savePreset} disabled={!presetForm.name} style={{ background: '#e2e8f0', border: 'none', color: '#000', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold', opacity: presetForm.name ? 1 : 0.5 }}>Save</button>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>└────────────────────────────────────┘</div>
          </div>
          </>
      )}

      {contextMenu && (
        <ContextMenu 
            x={contextMenu.x} y={contextMenu.y} target={contextMenu.target as any}
            onClose={() => setContextMenu(null)}
            onDelete={() => {
                 if(contextMenu.target?.type==='node') {
                     const id = contextMenu.target.id;
                     setNodes(ns => ns.filter(n => n.id !== id));
                     setLinks(ls => ls.filter(l => l.from !== id && l.to !== id));
                 } else if (contextMenu.target?.type==='link') {
                     setLinks(ls => ls.filter(l => l.id !== contextMenu.target!.id));
                 }
                 setContextMenu(null);
            }}
            onRename={() => {
                if(contextMenu.target?.type==='node') {
                   setRenamingNodeId(contextMenu.target.id);
                   const n = nodes.find(x => x.id === contextMenu.target?.id);
                   if(n) setRenameInput(n.label);
                }
                setContextMenu(null);
            }}
        />
      )}
    </div>
  );
}

// ── SUBCOMPONENTS ───────────────────────────────────────────────────────────
function ToolbarTool({ type, icon, label, color, disabled }: { type: NodeType; icon: React.ReactNode; label: string; color: string; disabled: boolean }) {
  return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: disabled ? 0.3 : 0.9, transition: 'all 0.2s', padding: '4px 6px', width: 80 }}>
                <div
                    draggable={!disabled}
                    onDragStart={(e) => {
                        e.dataTransfer.setData('nodeType', type);
                        e.dataTransfer.effectAllowed = 'copy';
                    }}
                    style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--palette-tool-bg)', border: `1px solid ${disabled ? 'var(--panel-border)' : color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', cursor: disabled ? 'not-allowed' : 'grab' }}
                >
                    {icon}
                </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--palette-tool-label)' }}>{label}</div>
    </div>
  );
}

function PresetItem({ preset, isAdmin, onSelect, onEdit, onDelete }: any) {
    const [h, setH] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);

    return (
        <div 
            onClick={onSelect}
            onMouseEnter={()=>setH(true)} onMouseLeave={()=>{setH(false); setConfirmDel(false);}}
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s', background: h ? 'rgba(255,255,255,0.03)' : 'transparent' }}
        >
            {confirmDel ? (
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#f87171', display: 'flex', whiteSpace: 'nowrap', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                     Delete '{preset.name}'? 
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={onDelete} style={{ background: '#f87171', color: '#000', border: 'none', borderRadius: 3, padding: '2px 6px', fontSize: 9, cursor: 'pointer', fontWeight: 'bold' }}>Yes</button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDel(false); }} style={{ background: '#444', color: '#fff', border: 'none', borderRadius: 3, padding: '2px 6px', fontSize: 9, cursor: 'pointer' }}>No</button>
                    </div>
                </div>
            ) : (
                <>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#e2e8f0', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preset.name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#888', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preset.description || 'No description'}</div>
                </div>
                {isAdmin && h && (
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={onEdit} style={{ background:'transparent', border:'none', color:'#888', cursor:'pointer', padding: 4 }} title="Edit"><Edit2 size={12}/></button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDel(true); }} style={{ background:'transparent', border:'none', color:'#f87171', cursor:'pointer', padding: 4 }} title="Delete"><Trash2 size={12}/></button>
                    </div>
                )}
                </>
            )}
        </div>
    )
}

function ContextMenu({ x, y, target, onClose, onDelete, onRename }: any) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    return (
        <>
            <div style={{position:'fixed', inset:0, zIndex:99}} onPointerDown={onClose} onContextMenu={e=>{e.preventDefault(); onClose()}}/>
            <div style={{ position: 'fixed', left: Math.min(x, window.innerWidth - 160), top: Math.min(y, window.innerHeight - 120), width: 160, background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 4, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                {target.type === 'node' && <MenuBtn onClick={onRename}>Rename</MenuBtn>}
                <MenuBtn onClick={() => confirmDelete ? onDelete() : setConfirmDelete(true)} color={confirmDelete ? '#f87171' : '#e2e8f0'} >{confirmDelete ? 'Delete — are you sure?' : target.type === 'link' ? 'Delete Link' : 'Delete'}</MenuBtn>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <MenuBtn onClick={onClose} color="rgba(255,255,255,0.5)">Cancel</MenuBtn>
            </div>
        </>
    );
}

function MenuBtn({ children, onClick, color = '#e2e8f0' }: any) {
    const [h, setH] = useState(false);
    return (<button onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} onClick={onClick} style={{ width: '100%', background: h ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', padding: '6px 10px', borderRadius: 4, color, cursor: 'pointer', textAlign: 'left' }}>{children}</button>);
}
