import { describe, it, expect } from 'vitest';
import { runFloodSimulation, computeAdjacency, NetworkNode } from '../lib/engine';

describe('INTEGRATION: Full Simulation Run', () => {

    it('Test 1 — Happy path BLE delivery', () => {
        const nodes: NetworkNode[] = [
    { id: 'A', type: 'phone', x: 0, y: 0, label: 'A' },
    { id: 'B', type: 'phone', x: 240, y: 0, label: 'B' },
    { id: 'C', type: 'phone', x: 480, y: 0, label: 'C' }
];
        
        const adj = computeAdjacency(nodes, []);
        const res = runFloodSimulation(nodes, adj, 'A', 'C', 5);
        
        expect(res.delivered).toBe(true);
        expect(res.hops).toBe(2);
        expect(res.logs.some(l => l.fn === 'DELIVERED')).toBe(true);
        expect(res.logs.some(l => l.msg.includes('B→C'))).toBe(true);
    });

    it('Test 2 — Out of range', () => {
        const nodes: NetworkNode[] = [
            { id: 'A', type: 'phone', x: 200, y: 300, label: 'A' },
            { id: 'C', type: 'phone', x: 900, y: 300, label: 'C' }
        ];
        const adj = computeAdjacency(nodes, []);
        const res = runFloodSimulation(nodes, adj, 'A', 'C', 5);
        expect(res.delivered).toBe(false);
        
        
    });

    it('Test 3 — LoRa bridge delivery', () => {
        const nodes: NetworkNode[] = [
            { id: 'A', type: 'phone', x: 150, y: 300, label: 'A' },
            { id: 'L', type: 'lora', x: 350, y: 300, label: 'L' },
            { id: 'R', type: 'lora', x: 650, y: 300, label: 'R' },
            { id: 'C', type: 'phone', x: 850, y: 300, label: 'C' }
        ];
        const adj = computeAdjacency(nodes, [{ id: 'link', from: 'L', to: 'R' }]);
        const res = runFloodSimulation(nodes, adj, 'A', 'C', 5);
        expect(res.delivered).toBe(true);
        expect(res.logs.some(l => l.fn === 'LORA_TRANSMIT')).toBe(true);
    });
});
