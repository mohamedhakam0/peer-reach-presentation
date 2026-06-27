import { describe, it, expect } from 'vitest';
import { computeAdjacency, NetworkNode, LoRaLink } from '../lib/engine';

describe('ADJACENCY COMPUTATION', () => {
    
    it('two phones within range → both appear in each other\'s adjacency list', () => {
        const nodes: NetworkNode[] = [
            { id: '1', type: 'phone', x: 0, y: 0, label: 'A' },
            { id: '2', type: 'phone', x: 100, y: 0, label: 'B' }
        ];
        const adj = computeAdjacency(nodes, []);
        expect(adj['1']).toContain('2');
        expect(adj['2']).toContain('1');
    });

    it('two phones out of range → neither appears in each other\'s list', () => {
        const nodes: NetworkNode[] = [
            { id: '1', type: 'phone', x: 0, y: 0, label: 'A' },
            { id: '2', type: 'phone', x: 250, y: 0, label: 'B' } // 250 > 120+120
        ];
        const adj = computeAdjacency(nodes, []);
        expect(adj['1']).not.toContain('2');
        expect(adj['2']).not.toContain('1');
    });

    it('phone exactly at range boundary (distance == radiusA + radiusB) → connected', () => {
        const nodes: NetworkNode[] = [
            { id: '1', type: 'phone', x: 0, y: 0, label: 'A' },
            { id: '2', type: 'phone', x: 240, y: 0, label: 'B' } // exactly 240
        ];
        const adj = computeAdjacency(nodes, []);
        expect(adj['1']).toContain('2');
        expect(adj['2']).toContain('1');
    });

    it('phone 1px beyond boundary → not connected', () => {
        const nodes: NetworkNode[] = [
            { id: '1', type: 'phone', x: 0, y: 0, label: 'A' },
            { id: '2', type: 'phone', x: 241, y: 0, label: 'B' }
        ];
        const adj = computeAdjacency(nodes, []);
        expect(adj['1']).not.toContain('2');
    });

    it('three phones in a line: A-B connected, B-C connected, A-C not → correct partial mesh', () => {
        const nodes: NetworkNode[] = [
            { id: 'A', type: 'phone', x: 0, y: 0, label: 'A' },
            { id: 'B', type: 'phone', x: 200, y: 0, label: 'B' },
            { id: 'C', type: 'phone', x: 400, y: 0, label: 'C' }
        ];
        const adj = computeAdjacency(nodes, []);
        expect(adj['A']).toContain('B');
        expect(adj['B']).toContain('A');
        expect(adj['B']).toContain('C');
        expect(adj['C']).toContain('B');
        expect(adj['A']).not.toContain('C');
        expect(adj['C']).not.toContain('A');
    });

    it('ESP32 connects to phones within its range ring same as phones do', () => {
        const nodes: NetworkNode[] = [
            { id: '1', type: 'esp32', x: 0, y: 0, label: 'E' },
            { id: '2', type: 'phone', x: 200, y: 0, label: 'P' }
        ];
        const adj = computeAdjacency(nodes, []);
        expect(adj['1']).toContain('2');
        expect(adj['2']).toContain('1');
    });

    it('two LoRa nodes without explicit link → NOT in each other\'s adjacency', () => {
        const nodes: NetworkNode[] = [
            { id: 'L1', type: 'lora', x: 0, y: 0, label: 'L1' },
            { id: 'L2', type: 'lora', x: 10, y: 0, label: 'L2' } // extremely close
        ];
        const adj = computeAdjacency(nodes, []);
        expect(adj['L1']).not.toContain('L2');
        expect(adj['L2']).not.toContain('L1');
    });

    it('two LoRa nodes WITH explicit drawn link → connected regardless of distance', () => {
        const nodes: NetworkNode[] = [
            { id: 'L1', type: 'lora', x: 0, y: 0, label: 'L1' },
            { id: 'L2', type: 'lora', x: 1000, y: 0, label: 'L2' }
        ];
        const links: LoRaLink[] = [{ id: '1', from: 'L1', to: 'L2' }];
        const adj = computeAdjacency(nodes, links);
        expect(adj['L1']).toContain('L2');
        expect(adj['L2']).toContain('L1');
    });

    it('LoRa node connects to nearby phones via BLE range (it has a BLE range ring too)', () => {
        const nodes: NetworkNode[] = [
            { id: 'L1', type: 'lora', x: 0, y: 0, label: 'L1' },
            { id: 'P1', type: 'phone', x: 100, y: 0, label: 'P1' }
        ];
        // LoRa range is 160 + phone 120 = 280
        const adj = computeAdjacency(nodes, []);
        expect(adj['L1']).toContain('P1');
        expect(adj['P1']).toContain('L1');
    });

    it('empty node list → returns empty adjacency map', () => {
        const adj = computeAdjacency([], []);
        expect(adj).toEqual({});
    });

    it('single node → adjacency map has that node with empty neighbor list', () => {
        const nodes: NetworkNode[] = [{ id: '1', type: 'phone', x: 0, y: 0, label: 'A' }];
        const adj = computeAdjacency(nodes, []);
        expect(adj['1']).toEqual([]);
    });

    it('12 nodes all overlapping → every node adjacent to every other node', () => {
        const nodes: NetworkNode[] = Array.from({length: 12}).map((_, i) => ({
            id: String(i), type: 'phone', x: 0, y: 0, label: String(i)
        }));
        const adj = computeAdjacency(nodes, []);
        for (let i = 0; i < 12; i++) {
            expect(adj[String(i)].length).toBe(11);
        }
    });
});
