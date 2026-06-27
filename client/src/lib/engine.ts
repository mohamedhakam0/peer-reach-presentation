import type { LogEntry } from './scenarios';

export type NodeType = 'phone' | 'esp32' | 'lora';

export interface NetworkNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label: string;
}

export interface LoRaLink {
  id: string;
  from: string;
  to: string;
}

export interface PacketEvent {
  id: string;
  from: string;
  to: string;
  status: 'moving' | 'delivered' | 'drop';
  type: 'flood' | 'ack';
}

const RADIUS = {
  phone: 120,
  esp32: 120,
  lora: 160
};

export function getRadius(type: NodeType) {
  return RADIUS[type];
}

// ── NODE MANAGEMENT ─────────────────────────────────────────────────────────

export const MAX_NODES = 12;

export function canAddNode(nodes: NetworkNode[]) {
    return nodes.length < MAX_NODES;
}

export function canSimulate(nodes: NetworkNode[]) {
    return nodes.filter(n => n.type === 'phone').length >= 2;
}

export function getNextLabel(nodes: NetworkNode[], type: NodeType) {
    if (type === 'phone') {
        const existingPhones = nodes.filter(n => n.type === 'phone');
        let highestIndex = -1;
        existingPhones.forEach(n => {
            const match = n.label.match(/Phone ([A-Z])/);
            if(match) {
                const idx = match[1].charCodeAt(0) - 65;
                highestIndex = Math.max(highestIndex, idx);
            }
        });
        const nextChar = String.fromCharCode(65 + highestIndex + 1);
        return `Phone ${nextChar}`;
    }
    if (type === 'esp32') {
        const espNodes = nodes.filter(n => n.type === 'esp32');
        let highest = 0;
        espNodes.forEach(n => {
            const match = n.label.match(/ESP32-(\d+)/);
            if(match) highest = Math.max(highest, parseInt(match[1]));
        });
        return `ESP32-${highest + 1}`;
    }
    // LoRa
    const loraNodes = nodes.filter(n => n.type === 'lora');
    let highest = 0;
    loraNodes.forEach(n => {
        const match = n.label.match(/LoRa-(\d+)/);
        if(match) highest = Math.max(highest, parseInt(match[1]));
    });
    return `LoRa-${highest + 1}`;
}

export function validateRename(currentLabel: string, newLabel: string): string {
    const trimmed = newLabel.trim();
    if (!trimmed) return currentLabel;
    if (trimmed.length > 12) return currentLabel;
    return trimmed;
}

export function addLoRaLink(links: LoRaLink[], fromId: string, toId: string): LoRaLink[] {
    if (fromId === toId) return links;
    if (links.find(l => (l.from === fromId && l.to === toId) || (l.from === toId && l.to === fromId))) return links;
    return [...links, { id: `link-${Date.now()}-${Math.random()}`, from: fromId, to: toId }];
}

export function deleteNode(nodes: NetworkNode[], links: LoRaLink[], id: string) {
    return {
        newNodes: nodes.filter(n => n.id !== id),
        newLinks: links.filter(l => l.from !== id && l.to !== id)
    };
}

// ── ADJACENCY ENGINE ────────────────────────────────────────────────────────

export function computeAdjacency(nodes: NetworkNode[], loraLinks: LoRaLink[]): Record<string, string[]> {
    const adj: Record<string, string[]> = {};
    if (!nodes) return adj;
    nodes.forEach(n => adj[n.id] = []);

    // Proximity
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            if (a.type === 'lora' && b.type === 'lora') continue; // two lora must use explicit links
            
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            const rA = getRadius(a.type);
            const rB = getRadius(b.type);
            if (dist <= rA + rB) {
                adj[a.id].push(b.id);
                adj[b.id].push(a.id);
            }
        }
    }

    // Explicit LoRa Links
    for (const l of loraLinks) {
        if (adj[l.from] && adj[l.to]) {
            if (!adj[l.from].includes(l.to)) adj[l.from].push(l.to);
            if (!adj[l.to].includes(l.from)) adj[l.to].push(l.from);
        }
    }

    return adj;
}

// ── SIMULATION ENGINE ───────────────────────────────────────────────────────

export function runFloodSimulation(
    nodes: NetworkNode[], 
    adjacency: Record<string, string[]>, 
    sourceId: string, 
    destId: string, 
    ttl: number
) {
    let logs: LogEntry[] = [];
    let allPackets: PacketEvent[] = [];
    let frames: { packets: PacketEvent[], logs: LogEntry[], delivered: boolean }[] = [];

    if (!nodes.length || !sourceId || !destId || sourceId === destId) {
        logs.push({ time: '00.00', fn: 'ERROR', msg: 'Invalid simulation parameters.', color: 'red' });
        return { delivered: false, path: [], hops: 0, packets: [], logs, frames };
    }

    const sourceNode = nodes.find(n => n.id === sourceId);
    if (!sourceNode) return { delivered: false, path: [], hops: 0, packets: [], logs, frames };

    if (adjacency[sourceId].length === 0) {
        logs.push({ time: '00.00', fn: 'TOPOLOGY_ERROR', msg: `Source node ${sourceNode.label} has no neighbors.`, color: 'red' });
        return { delivered: false, path: [], hops: 0, packets: [], logs, frames };
    }

    const phoneCount = nodes.filter(n => n.type === 'phone').length;
    const espCount = nodes.filter(n => n.type === 'esp32').length;

    let initialLogs: LogEntry[] = [
        { time: '00.00', fn: 'TOPOLOGY', msg: `Canvas: ${nodes.length} nodes — ${phoneCount} phones, ${espCount} ESP32`, color: 'white' },
        { time: '00.00', fn: 'SIM_START', msg: `Source=${nodes.find(n=>n.id===sourceId)?.label}  Destination=${nodes.find(n=>n.id===destId)?.label}  TTL=${ttl}  msg_id=0x3F`, color: 'white' }
    ];

    frames.push({ packets: [], logs: initialLogs, delivered: false });
    logs.push(...initialLogs);

    if (ttl <= 0) {
        return { delivered: false, path: [], hops: 0, packets: [], logs, frames };
    }

    let queue = [sourceId];
    let visited = new Set([sourceId]);
    let hop = 0;
    let targetFound = false;
    let pathMap = new Map<string, string>();

    // Phase 1: Flood out
    while(queue.length > 0 && hop < ttl && !targetFound) {
        let nxtQueue: string[] = [];
        let curPkts: PacketEvent[] = [];
        let curLogs: LogEntry[] = [];

        // For duplicate suppression exact logic test
        // Let's sort queue so traversal is deterministic based on distance or id? 
        // We ensure a deterministic processing if needed by queue iteration

        for(const curr of queue) {
            const neighbors = adjacency[curr] || [];
            const currNode = nodes.find(n=>n.id===curr);
            
            for(const nbr of neighbors) {
                const nbrNode = nodes.find(n=>n.id===nbr);
                if (nbr === pathMap.get(curr)) { continue; }
                const isTarget = nbr === destId;

                const isLoraTx = currNode?.type === 'lora' && nbrNode?.type === 'lora';

                if(!visited.has(nbr)) {
                    visited.add(nbr);
                    pathMap.set(nbr, curr);
                    curPkts.push({ id: `pkt-${Date.now()}-${Math.random()}`, from: curr, to: nbr, status: isTarget ? 'delivered' : 'moving', type: 'flood' });
                    
                    if (isLoraTx) {
                         curLogs.push({ time: `00.0${hop+1}`, fn: `LORA_TRANSMIT`, msg: `${currNode?.label}→${nbrNode?.label} LoRa hop transparent`, color: 'violet' });
                    } else {
                         curLogs.push({ time: `00.0${hop+1}`, fn: `HOP_${hop+1}`, msg: `${currNode?.label}→${nbrNode?.label} BLE in-range ✓`, color: 'cyan' });
                    }
                    
                    if(isTarget) {
                        targetFound = true;
                    } else {
                        nxtQueue.push(nbr);
                    }
                } else {
                    curLogs.push({ time: `00.0${hop+1}`, fn: `RANGE_CHECK`, msg: `${nbrNode?.label} evaluating 0x3F...`, color: 'amber' });
                    curPkts.push({ id: `pkt-${Date.now()}-${Math.random()}`, from: curr, to: nbr, status: 'drop', type: 'flood' });
                    curLogs.push({ time: `00.0${hop+1}`, fn: `DUP_DROP`, msg: `${nbrNode?.label} already received 0x3F — dropping copy`, color: 'red' });
                }
            }
        }
        if (curPkts.length > 0 || curLogs.length > 0) {
            frames.push({ packets: curPkts, logs: curLogs, delivered: targetFound });
            logs.push(...curLogs);
            allPackets.push(...curPkts);
        }
        
        queue = nxtQueue;
        hop++;
    }

    let ackPath: string[] = [];

    if (targetFound) {
        let curr = destId;
        while(curr !== sourceId) {
            ackPath.push(curr);
            curr = pathMap.get(curr)!;
        }
        ackPath.push(sourceId);
        ackPath.reverse(); 
        
        let ackGenLogs = [{ time: `00.0${hop+1}`, fn: 'ACK_GEN', msg: `${nodes.find(n=>n.id===destId)?.label} generates ACK for 0x3F`, color: 'white' }];
        frames.push({ packets: [], logs: ackGenLogs, delivered: true });
        logs.push(...ackGenLogs);

        for (let i = ackPath.length - 1; i > 0; i--) {
            const sender = ackPath[i];
            const receiver = ackPath[i-1];
            
            let curPkts: PacketEvent[] = [{ id: `ack-${Date.now()}-${Math.random()}`, from: sender, to: receiver, status: 'delivered', type: 'ack' }];
            let curLogs: LogEntry[] = [{ time: `00.0${hop+2}`, fn: 'ACK_HOP', msg: `${nodes.find(n=>n.id===sender)?.label}→${nodes.find(n=>n.id===receiver)?.label} ✓`, color: 'green' }];
            
            frames.push({ packets: curPkts, logs: curLogs, delivered: true });
            logs.push(...curLogs);
            allPackets.push(...curPkts);
        }
        
        const pathStr = ackPath.map(id => nodes.find(n=>n.id===id)?.label).join('→');
        let deliveredLogs = [{ time: `00.0${hop+3}`, fn: 'DELIVERED', msg: `msg_id=0x3F hops=${ackPath.length - 1} path=${pathStr}`, color: 'green' }];
        frames.push({ packets: [], logs: deliveredLogs, delivered: true });
        logs.push(...deliveredLogs);
        
        return {
            delivered: true,
            path: ackPath,
            hops: ackPath.length - 1,
            packets: allPackets,
            logs,
            frames
        };
    } else {
        if (queue.length > 0 && hop >= ttl) {
            let log = { time: `00.0${hop+1}`, fn: 'TTL_EXPIRE', msg: `Destination never reached. TTL exhausted.`, color: 'red' };
            frames.push({ packets: [], logs: [log], delivered: false });
            logs.push(log);
        } else {
            let log = { time: `00.0${hop+1}`, fn: 'UNCONFIRMED', msg: `Destination never reached. Timer started.`, color: 'red' };
            frames.push({ packets: [], logs: [log], delivered: false });
            logs.push(log);
        }

        return {
            delivered: false,
            path: [],
            hops: 0,
            packets: allPackets,
            logs,
            frames
        };
    }
}
