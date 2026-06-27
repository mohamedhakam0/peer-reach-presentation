// ─── Types ─────────────────────────────────────────────────────────────────

export type NodeType = 'phone' | 'esp32' | 'esp32-lora';
export type NodeStatus = 'idle' | 'active' | 'receiver' | 'offline' | 'new' | 'out-of-range';

export interface SimNode {
  id: string;
  label: string;
  type: NodeType;
  x: number; // 0-1000 viewBox units
  y: number;
  status?: NodeStatus;
}

export type PacketType = 'ble' | 'lora' | 'ack' | 'hello' | 'duplicate-drop';

export interface PacketAnimation {
  id: string;
  from: string;  // node id
  to: string;    // node id
  type: PacketType;
  label?: string;
  delay?: number; // ms
  duration?: number; // base ms (before speed multiplier)
}

export interface RangeCircle {
  nodeId: string;
  type: 'ble' | 'lora';
  active?: boolean;
}

export interface LoraLink {
  from: string;
  to: string;
  active?: boolean;
}

export type NodeStateOverride = {
  nodeId: string;
  status: NodeStatus;
};

export interface StepState {
  activeNodes?: string[];           // nodes that glow/pulse
  pulseNodes?: string[];            // nodes that show ripple
  packets?: PacketAnimation[];      // packet animations to play
  rangeCircles?: RangeCircle[];     // which BLE ranges to highlight
  loraLinks?: LoraLink[];           // LoRa link states
  nodeOverrides?: NodeStateOverride[];
  logs: LogEntry[];
}

export interface LogEntry {
  time: string; // e.g. "00:01.200"
  fn: string;   // e.g. "BLE_ADVERTISE"
  msg: string;
  color: 'white' | 'cyan' | 'amber' | 'green' | 'red';
}

export interface ScenarioStep {
  title: string;
  description: string;
  state: StepState;
}

export interface Scenario {
  id: number;
  title: string;
  subtitle: string;
  nodes: SimNode[];
  steps: ScenarioStep[];
}

// ─── Helper ────────────────────────────────────────────────────────────────

let _pid = 0;
const pid = (prefix = 'p') => `${prefix}-${++_pid}`;

// ─── Scenario 1: BLE Mesh Delivery ─────────────────────────────────────────

const s1Nodes: SimNode[] = [
  { id: 'A', label: 'A', type: 'phone',  x: 130, y: 320 },
  { id: 'B', label: 'B', type: 'phone',  x: 380, y: 200 },
  { id: 'R', label: 'R', type: 'esp32',  x: 400, y: 440 },
  { id: 'C', label: 'C', type: 'phone',  x: 660, y: 320 },
];

const scenario1: Scenario = {
  id: 1,
  title: 'BLE Mesh Delivery',
  subtitle: 'End-to-end encrypted message with ACK',
  nodes: s1Nodes,
  steps: [
    {
      title: 'Sender broadcasts message',
      description:
        'Node A creates an encrypted message for C and broadcasts a BLE advertisement. The packet carries msg_id=0x1A, TTL=5, and receiver_id=C. No one has heard this message yet.',
      state: {
        activeNodes: ['A'],
        pulseNodes: ['A'],
        rangeCircles: [{ nodeId: 'A', type: 'ble', active: true }],
        packets: [
          { id: pid(), from: 'A', to: 'B', type: 'ble', label: '0x1A TTL=5', duration: 900 },
          { id: pid(), from: 'A', to: 'R', type: 'ble', label: '0x1A TTL=5', delay: 80, duration: 900 },
        ],
        logs: [
          { time: '00:00.000', fn: 'MSG_ENCRYPT', msg: 'Node A encrypts payload for receiver C (AES-128-CCM)', color: 'white' },
          { time: '00:00.120', fn: 'BLE_ADVERTISE', msg: 'Node A broadcasts msg_id=0x1A (TTL=5, receiver=C)', color: 'cyan' },
        ],
      },
    },
    {
      title: 'B and R relay the packet',
      description:
        'Both B and R receive the advertisement. Each checks its seen_msg_ids ring buffer — 0x1A is new, so both add it and re-advertise with TTL decremented to 4.',
      state: {
        activeNodes: ['B', 'R'],
        pulseNodes: ['B', 'R'],
        rangeCircles: [
          { nodeId: 'B', type: 'ble', active: true },
          { nodeId: 'R', type: 'ble', active: true },
        ],
        packets: [
          { id: pid(), from: 'B', to: 'C', type: 'ble', label: '0x1A TTL=4', duration: 900 },
          { id: pid(), from: 'R', to: 'C', type: 'ble', label: '0x1A TTL=4', delay: 150, duration: 900 },
        ],
        logs: [
          { time: '00:01.200', fn: 'SEEN_MSG_CHECK', msg: 'Node B checks seen_msg_ids — 0x1A not found, adding', color: 'white' },
          { time: '00:01.250', fn: 'SEEN_MSG_CHECK', msg: 'Node R checks seen_msg_ids — 0x1A not found, adding', color: 'white' },
          { time: '00:01.400', fn: 'BLE_RELAY', msg: 'Node B re-advertises msg_id=0x1A (TTL=4)', color: 'cyan' },
          { time: '00:01.500', fn: 'BLE_RELAY', msg: 'Node R re-advertises msg_id=0x1A (TTL=4)', color: 'cyan' },
        ],
      },
    },
    {
      title: 'C receives and decrypts',
      description:
        'C receives the advertisement from B first. It recognizes its own receiver_id and decrypts the message successfully. Node C is now highlighted as the active receiver.',
      state: {
        activeNodes: ['C'],
        pulseNodes: ['C'],
        nodeOverrides: [{ nodeId: 'C', status: 'receiver' }],
        logs: [
          { time: '00:02.100', fn: 'MSG_RECEIVE', msg: 'Node C receives msg_id=0x1A from B — receiver_id matches', color: 'white' },
          { time: '00:02.150', fn: 'MSG_DECRYPT', msg: 'Node C decrypts payload — success', color: 'green' },
        ],
      },
    },
    {
      title: 'C generates ACK',
      description:
        'C generates an ACK packet referencing msg_id=0x1A and floods it back into the mesh. The ACK travels back through the same relay nodes toward A.',
      state: {
        activeNodes: ['C'],
        pulseNodes: ['C'],
        packets: [
          { id: pid(), from: 'C', to: 'B', type: 'ack', label: 'ACK 0x1A', duration: 900 },
          { id: pid(), from: 'C', to: 'R', type: 'ack', label: 'ACK 0x1A', delay: 100, duration: 900 },
        ],
        logs: [
          { time: '00:03.000', fn: 'ACK_GENERATE', msg: 'Node C generates ACK for msg_id=0x1A', color: 'green' },
          { time: '00:03.100', fn: 'BLE_ADVERTISE', msg: 'Node C floods ACK packet (TTL=5)', color: 'cyan' },
        ],
      },
    },
    {
      title: 'ACK reaches A — Delivered',
      description:
        'The ACK propagates back through B and R to reach A. A matches the ACK to its pending msg_id=0x1A, clears its retry timer, and marks the message as Delivered.',
      state: {
        activeNodes: ['A'],
        pulseNodes: ['A'],
        packets: [
          { id: pid(), from: 'B', to: 'A', type: 'ack', label: 'ACK relay', duration: 900 },
          { id: pid(), from: 'R', to: 'A', type: 'ack', label: 'ACK relay', delay: 180, duration: 900 },
        ],
        nodeOverrides: [{ nodeId: 'A', status: 'active' }],
        logs: [
          { time: '00:04.100', fn: 'ACK_RELAY', msg: 'Node B relays ACK toward A', color: 'green' },
          { time: '00:04.200', fn: 'ACK_RELAY', msg: 'Node R relays ACK toward A', color: 'green' },
          { time: '00:04.500', fn: 'ACK_RECEIVE', msg: 'Node A receives ACK for msg_id=0x1A — DELIVERED ✓', color: 'green' },
          { time: '00:04.510', fn: 'TIMER_CLEAR', msg: 'Node A clears retry timer for msg_id=0x1A', color: 'white' },
        ],
      },
    },
  ],
};

// ─── Scenario 2: Out of Range / Undelivered ────────────────────────────────

const s2Nodes: SimNode[] = [
  { id: 'A', label: 'A', type: 'phone',  x: 130, y: 300 },
  { id: 'B', label: 'B', type: 'phone',  x: 380, y: 300 },
  { id: 'C', label: 'C', type: 'phone',  x: 800, y: 300, status: 'out-of-range' },
];

const scenario2: Scenario = {
  id: 2,
  title: 'Out of Range',
  subtitle: 'Message flood dissipates before reaching C',
  nodes: s2Nodes,
  steps: [
    {
      title: 'A broadcasts message',
      description:
        'A broadcasts a BLE advertisement for C (msg_id=0x2B, TTL=5). The large gap between B and C represents the out-of-range condition — C is visually dimmed to indicate unreachability.',
      state: {
        activeNodes: ['A'],
        pulseNodes: ['A'],
        rangeCircles: [{ nodeId: 'A', type: 'ble', active: true }],
        packets: [
          { id: pid(), from: 'A', to: 'B', type: 'ble', label: '0x2B TTL=5', duration: 900 },
        ],
        logs: [
          { time: '00:00.000', fn: 'BLE_ADVERTISE', msg: 'Node A broadcasts msg_id=0x2B (TTL=5, receiver=C)', color: 'cyan' },
        ],
      },
    },
    {
      title: 'B relays — TTL=4',
      description:
        'B hears the advertisement and re-advertises with TTL=4. However, no further nodes are within BLE range. The flood has nowhere left to propagate.',
      state: {
        activeNodes: ['B'],
        pulseNodes: ['B'],
        rangeCircles: [{ nodeId: 'B', type: 'ble', active: true }],
        packets: [
          { id: pid(), from: 'B', to: 'C', type: 'ble', label: '0x2B TTL=4', duration: 1200 },
        ],
        logs: [
          { time: '00:01.100', fn: 'SEEN_MSG_CHECK', msg: 'Node B checks seen_msg_ids — 0x2B not found, adding', color: 'white' },
          { time: '00:01.200', fn: 'BLE_RELAY', msg: 'Node B re-advertises msg_id=0x2B (TTL=4)', color: 'cyan' },
        ],
      },
    },
    {
      title: 'Flood dissipates',
      description:
        'TTL reaches 0 with no further relays. The advertisement times out without reaching C. The mesh flood has been exhausted.',
      state: {
        activeNodes: [],
        logs: [
          { time: '00:02.300', fn: 'TTL_EXPIRE', msg: 'msg_id=0x2B: TTL exhausted, no further relays in range', color: 'red' },
          { time: '00:02.310', fn: 'FLOOD_DONE', msg: 'Mesh flood for 0x2B complete — 0 additional hops possible', color: 'white' },
        ],
      },
    },
    {
      title: 'A starts ACK timer',
      description:
        "A's ACK timer starts counting down from 30 seconds. During this window, a late ACK through a slow or alternative path could still arrive.",
      state: {
        activeNodes: ['A'],
        nodeOverrides: [{ nodeId: 'C', status: 'out-of-range' }],
        logs: [
          { time: '00:02.400', fn: 'TIMER_START', msg: 'Node A starts ACK wait timer (30s) for msg_id=0x2B', color: 'amber' },
        ],
      },
    },
    {
      title: 'Timer expires',
      description:
        'No ACK received within the timeout window. The timer expires.',
      state: {
        activeNodes: ['A'],
        logs: [
          { time: '00:32.400', fn: 'TIMER_EXPIRE', msg: 'ACK wait timer expired for msg_id=0x2B — no response', color: 'red' },
        ],
      },
    },
    {
      title: 'Status: Unconfirmed',
      description:
        'Message status changes from "sending" to "unconfirmed" — NOT "failed". The message may still be in transit through a slow path or stored relay. This distinction matters for user-facing UI.',
      state: {
        activeNodes: ['A'],
        nodeOverrides: [{ nodeId: 'C', status: 'out-of-range' }],
        logs: [
          { time: '00:32.410', fn: 'STATUS_UPDATE', msg: 'msg_id=0x2B status: sending → unconfirmed (not failed)', color: 'amber' },
          { time: '00:32.420', fn: 'UI_UPDATE', msg: 'Displaying "Unconfirmed" to user — message may still arrive', color: 'white' },
        ],
      },
    },
  ],
};

// ─── Scenario 3: LoRa Bridge Transparent Relay ─────────────────────────────

const s3Nodes: SimNode[] = [
  { id: 'A',  label: 'A',  type: 'phone',      x: 100, y: 300 },
  { id: 'B',  label: 'B',  type: 'phone',      x: 260, y: 200 },
  { id: 'L1', label: 'L1', type: 'esp32-lora', x: 300, y: 390 },
  { id: 'L2', label: 'L2', type: 'esp32-lora', x: 700, y: 390 },
  { id: 'D',  label: 'D',  type: 'phone',      x: 740, y: 200 },
  { id: 'C',  label: 'C',  type: 'phone',      x: 900, y: 300 },
];

const scenario3: Scenario = {
  id: 3,
  title: 'LoRa Bridge Relay',
  subtitle: 'Transparent multi-cluster delivery via LoRa',
  nodes: s3Nodes,
  steps: [
    {
      title: 'A broadcasts BLE normally',
      description:
        "A broadcasts a BLE advertisement for C (msg_id=0x3C, TTL=5). A doesn't know about the LoRa infrastructure — it's just sending a normal mesh packet.",
      state: {
        activeNodes: ['A'],
        pulseNodes: ['A'],
        rangeCircles: [{ nodeId: 'A', type: 'ble', active: true }],
        packets: [
          { id: pid(), from: 'A', to: 'B', type: 'ble', label: '0x3C TTL=5', duration: 800 },
          { id: pid(), from: 'A', to: 'L1', type: 'ble', label: '0x3C TTL=5', delay: 60, duration: 800 },
        ],
        logs: [
          { time: '00:00.000', fn: 'BLE_ADVERTISE', msg: 'Node A broadcasts msg_id=0x3C (TTL=5, receiver=C)', color: 'cyan' },
          { time: '00:00.010', fn: 'NOTE', msg: 'A has no knowledge of LoRa infrastructure — standard flood', color: 'white' },
        ],
      },
    },
    {
      title: 'L1 checks neighborhood table',
      description:
        'L1 receives the BLE advertisement and checks its neighborhood table. It determines that C is not in the local BLE cluster — L1 knows C is only reachable via the LoRa link to L2.',
      state: {
        activeNodes: ['L1'],
        pulseNodes: ['L1'],
        logs: [
          { time: '00:01.000', fn: 'NEIGHBOR_LOOKUP', msg: 'L1 receives 0x3C — checking neighborhood table for receiver=C', color: 'white' },
          { time: '00:01.050', fn: 'NEIGHBOR_MISS', msg: 'C not found in local BLE cluster — routing via LoRa', color: 'amber' },
        ],
      },
    },
    {
      title: 'L1 → L2 via LoRa',
      description:
        'L1 encapsulates the BLE payload and transmits it over the long-range LoRa radio to L2. This link can span kilometers. The dashed amber line represents the active LoRa transmission.',
      state: {
        activeNodes: ['L1', 'L2'],
        pulseNodes: ['L1'],
        loraLinks: [{ from: 'L1', to: 'L2', active: true }],
        packets: [
          { id: pid(), from: 'L1', to: 'L2', type: 'lora', label: 'LoRa 0x3C', duration: 1400 },
        ],
        logs: [
          { time: '00:01.200', fn: 'LORA_TRANSMIT', msg: 'L1 encapsulates packet and transmits over LoRa to L2', color: 'amber' },
          { time: '00:01.210', fn: 'LORA_CHANNEL', msg: 'LoRa SF=9 BW=125kHz — estimated range 3km LOS', color: 'amber' },
        ],
      },
    },
    {
      title: 'L2 re-broadcasts as BLE',
      description:
        'L2 receives the LoRa packet, decapsulates it, and re-broadcasts it as a standard BLE advertisement into the remote cluster. Nodes D and C hear the advertisement.',
      state: {
        activeNodes: ['L2'],
        pulseNodes: ['L2'],
        rangeCircles: [{ nodeId: 'L2', type: 'ble', active: true }],
        packets: [
          { id: pid(), from: 'L2', to: 'D', type: 'ble', label: '0x3C TTL=3', duration: 800 },
          { id: pid(), from: 'L2', to: 'C', type: 'ble', label: '0x3C TTL=3', delay: 60, duration: 800 },
        ],
        logs: [
          { time: '00:02.600', fn: 'LORA_RECEIVE', msg: 'L2 receives LoRa packet — decapsulating', color: 'amber' },
          { time: '00:02.700', fn: 'BLE_ADVERTISE', msg: 'L2 re-broadcasts msg_id=0x3C as BLE (TTL=3)', color: 'cyan' },
        ],
      },
    },
    {
      title: 'C decrypts message',
      description:
        'C receives the BLE advertisement, recognizes its receiver_id, and decrypts the message. C has no idea it traversed a LoRa link — the bridge is completely transparent.',
      state: {
        activeNodes: ['C'],
        pulseNodes: ['C'],
        nodeOverrides: [{ nodeId: 'C', status: 'receiver' }],
        logs: [
          { time: '00:03.500', fn: 'MSG_RECEIVE', msg: 'Node C receives msg_id=0x3C — receiver_id matches', color: 'white' },
          { time: '00:03.550', fn: 'MSG_DECRYPT', msg: 'Node C decrypts payload — success (LoRa hop transparent)', color: 'green' },
        ],
      },
    },
    {
      title: 'ACK returns via LoRa',
      description:
        'The ACK travels back: C → L2 via BLE, L2 → L1 via LoRa, L1 → A via BLE. The originating phone never knew a LoRa hop was involved.',
      state: {
        activeNodes: ['C', 'L2', 'L1', 'A'],
        loraLinks: [{ from: 'L2', to: 'L1', active: true }],
        packets: [
          { id: pid(), from: 'C', to: 'L2', type: 'ack', label: 'ACK 0x3C', duration: 700 },
          { id: pid(), from: 'L2', to: 'L1', type: 'lora', label: 'ACK LoRa', delay: 800, duration: 1200 },
          { id: pid(), from: 'L1', to: 'A', type: 'ack', label: 'ACK 0x3C', delay: 2100, duration: 700 },
        ],
        logs: [
          { time: '00:04.200', fn: 'ACK_GENERATE', msg: 'Node C generates ACK for msg_id=0x3C', color: 'green' },
          { time: '00:04.300', fn: 'BLE_RELAY', msg: 'C → L2 (BLE ACK)', color: 'cyan' },
          { time: '00:05.100', fn: 'LORA_TRANSMIT', msg: 'L2 → L1 (LoRa ACK relay)', color: 'amber' },
          { time: '00:06.200', fn: 'ACK_RECEIVE', msg: 'Node A receives ACK — DELIVERED ✓ (LoRa bridge transparent)', color: 'green' },
        ],
      },
    },
  ],
};

// ─── Scenario 4: HELLO Beacon / Node Join ──────────────────────────────────

const s4Nodes: SimNode[] = [
  { id: 'A', label: 'A', type: 'phone',  x: 300, y: 200 },
  { id: 'B', label: 'B', type: 'phone',  x: 500, y: 350 },
  { id: 'C', label: 'C', type: 'phone',  x: 300, y: 450 },
  { id: 'E', label: 'E', type: 'phone',  x: 750, y: 350, status: 'new' },
];

const scenario4: Scenario = {
  id: 4,
  title: 'HELLO Beacon / Node Join',
  subtitle: 'New node E discovers and joins the mesh',
  nodes: s4Nodes,
  steps: [
    {
      title: 'Network idle',
      description:
        'A, B, and C form an established mesh. They each know about one another through previous HELLO exchanges and have up-to-date peer tables. E does not yet exist in the network.',
      state: {
        activeNodes: ['A', 'B', 'C'],
        logs: [
          { time: '00:00.000', fn: 'NETWORK_IDLE', msg: 'Nodes A, B, C active — peer tables current', color: 'white' },
          { time: '00:00.010', fn: 'PEER_TABLE', msg: 'A knows: [B, C] | B knows: [A, C] | C knows: [A, B]', color: 'white' },
        ],
      },
    },
    {
      title: 'E powers on — broadcasts HELLO',
      description:
        'Node E powers on and begins broadcasting HELLO beacons. Each HELLO contains E\'s node_id and public_key. E listens for responses to discover existing peers.',
      state: {
        activeNodes: ['E'],
        pulseNodes: ['E'],
        rangeCircles: [{ nodeId: 'E', type: 'ble', active: true }],
        nodeOverrides: [{ nodeId: 'E', status: 'new' }],
        packets: [
          { id: pid(), from: 'E', to: 'B', type: 'hello', label: 'HELLO', duration: 900 },
        ],
        logs: [
          { time: '00:01.000', fn: 'NODE_BOOT', msg: 'Node E powers on — starting HELLO broadcast sequence', color: 'white' },
          { time: '00:01.100', fn: 'HELLO_BROADCAST', msg: 'Node E broadcasts HELLO (node_id=E, pubkey=...)', color: 'cyan' },
        ],
      },
    },
    {
      title: 'B hears E',
      description:
        'B is within BLE range of E. B receives the HELLO packet, validates the public key, and adds E to its local peer table.',
      state: {
        activeNodes: ['B'],
        pulseNodes: ['B'],
        nodeOverrides: [{ nodeId: 'E', status: 'new' }],
        logs: [
          { time: '00:02.000', fn: 'HELLO_RECEIVE', msg: 'Node B receives HELLO from E — validating pubkey', color: 'white' },
          { time: '00:02.100', fn: 'PEER_ADD', msg: 'Node B adds E to peer table — B now knows: [A, C, E]', color: 'green' },
        ],
      },
    },
    {
      title: "B's next heartbeat",
      description:
        "B's scheduled HELLO heartbeat fires. This heartbeat now includes E in B's updated neighbor info, which will propagate E's existence to A and C.",
      state: {
        activeNodes: ['B'],
        pulseNodes: ['B'],
        rangeCircles: [{ nodeId: 'B', type: 'ble', active: true }],
        packets: [
          { id: pid(), from: 'B', to: 'A', type: 'hello', label: 'HELLO+E', duration: 900 },
          { id: pid(), from: 'B', to: 'C', type: 'hello', label: 'HELLO+E', delay: 80, duration: 900 },
        ],
        logs: [
          { time: '00:05.000', fn: 'HELLO_HEARTBEAT', msg: 'Node B heartbeat fires — neighbor list includes E', color: 'white' },
          { time: '00:05.100', fn: 'BLE_ADVERTISE', msg: 'Node B broadcasts updated HELLO (neighbors: A, C, E)', color: 'cyan' },
        ],
      },
    },
    {
      title: 'A and C learn about E',
      description:
        'A and C receive B\'s heartbeat and see E in the neighbor list. Both update their own peer tables to include E as an indirectly reachable node.',
      state: {
        activeNodes: ['A', 'C'],
        pulseNodes: ['A', 'C'],
        nodeOverrides: [{ nodeId: 'E', status: 'new' }],
        logs: [
          { time: '00:06.000', fn: 'PEER_UPDATE', msg: 'Node A learns about E via B\'s heartbeat', color: 'white' },
          { time: '00:06.050', fn: 'PEER_UPDATE', msg: 'Node C learns about E via B\'s heartbeat', color: 'white' },
        ],
      },
    },
    {
      title: 'E is fully discoverable',
      description:
        'E is now known across the mesh. A, B, and C have all updated their peer tables. Messages addressed to E will be routed correctly through B as the nearest relay.',
      state: {
        activeNodes: ['A', 'B', 'C', 'E'],
        nodeOverrides: [{ nodeId: 'E', status: 'active' }],
        logs: [
          { time: '00:06.100', fn: 'PEER_TABLE', msg: 'A knows: [B, C, E] | B knows: [A, C, E] | C knows: [A, B, E]', color: 'green' },
          { time: '00:06.110', fn: 'JOIN_COMPLETE', msg: 'Node E fully discoverable — mesh join complete', color: 'green' },
        ],
      },
    },
  ],
};

// ─── Scenario 5: Duplicate Suppression ─────────────────────────────────────

const s5Nodes: SimNode[] = [
  { id: 'A', label: 'A', type: 'phone',  x: 130, y: 320 },
  { id: 'B', label: 'B', type: 'phone',  x: 420, y: 160 },
  { id: 'R', label: 'R', type: 'esp32',  x: 420, y: 480 },
  { id: 'C', label: 'C', type: 'phone',  x: 720, y: 320 },
];

const scenario5: Scenario = {
  id: 5,
  title: 'Duplicate Suppression',
  subtitle: 'seen_msg_ids ring buffer prevents re-delivery',
  nodes: s5Nodes,
  steps: [
    {
      title: 'A broadcasts message',
      description:
        'A broadcasts msg_id=0x5E (TTL=5). Both B and R are equidistant from A and will hear the advertisement nearly simultaneously — a classic diamond topology duplication scenario.',
      state: {
        activeNodes: ['A'],
        pulseNodes: ['A'],
        rangeCircles: [{ nodeId: 'A', type: 'ble', active: true }],
        packets: [
          { id: pid(), from: 'A', to: 'B', type: 'ble', label: '0x5E TTL=5', duration: 900 },
          { id: pid(), from: 'A', to: 'R', type: 'ble', label: '0x5E TTL=5', delay: 50, duration: 900 },
        ],
        logs: [
          { time: '00:00.000', fn: 'BLE_ADVERTISE', msg: 'Node A broadcasts msg_id=0x5E (TTL=5, receiver=C)', color: 'cyan' },
        ],
      },
    },
    {
      title: 'B and R both hear A — simultaneously',
      description:
        'B and R both receive the advertisement from A at nearly the same time. Both store msg_id=0x5E in their seen_msg_ids ring buffers and prepare to relay.',
      state: {
        activeNodes: ['B', 'R'],
        pulseNodes: ['B', 'R'],
        logs: [
          { time: '00:01.000', fn: 'SEEN_MSG_CHECK', msg: 'Node B: 0x5E not in seen_msg_ids — adding, will relay', color: 'white' },
          { time: '00:01.010', fn: 'SEEN_MSG_CHECK', msg: 'Node R: 0x5E not in seen_msg_ids — adding, will relay', color: 'white' },
        ],
      },
    },
    {
      title: 'B relays first — C receives copy 1',
      description:
        'B re-advertises first. C receives copy 1 of msg_id=0x5E, processes it, stores it in its seen_msg_ids buffer, and delivers the message.',
      state: {
        activeNodes: ['B', 'C'],
        pulseNodes: ['B', 'C'],
        packets: [
          { id: pid(), from: 'B', to: 'C', type: 'ble', label: '0x5E TTL=4', duration: 900 },
        ],
        nodeOverrides: [{ nodeId: 'C', status: 'receiver' }],
        logs: [
          { time: '00:01.200', fn: 'BLE_RELAY', msg: 'Node B re-advertises 0x5E (TTL=4)', color: 'cyan' },
          { time: '00:01.800', fn: 'MSG_RECEIVE', msg: 'Node C receives 0x5E from B — first delivery, storing in seen_msg_ids', color: 'white' },
          { time: '00:01.850', fn: 'MSG_DELIVER', msg: 'Node C delivers message to application layer', color: 'green' },
        ],
      },
    },
    {
      title: "R relays — duplicate reaches C",
      description:
        'Shortly after, R also re-advertises msg_id=0x5E (TTL=4). This duplicate packet travels to C as well. Without suppression, this would cause double-delivery.',
      state: {
        activeNodes: ['R'],
        pulseNodes: ['R'],
        packets: [
          { id: pid(), from: 'R', to: 'C', type: 'ble', label: '0x5E TTL=4', duration: 900 },
        ],
        logs: [
          { time: '00:01.950', fn: 'BLE_RELAY', msg: 'Node R re-advertises 0x5E (TTL=4) — duplicate incoming', color: 'cyan' },
        ],
      },
    },
    {
      title: 'C silently drops the duplicate',
      description:
        'C checks its seen_msg_ids ring buffer — 0x5E is already there. C drops the packet silently without re-advertising or delivering. No double-delivery occurs.',
      state: {
        activeNodes: ['C'],
        pulseNodes: ['C'],
        packets: [
          { id: pid(), from: 'R', to: 'C', type: 'duplicate-drop', label: 'DUP DROP', duration: 700 },
        ],
        logs: [
          { time: '00:02.500', fn: 'SEEN_MSG_CHECK', msg: 'Node C checks seen_msg_ids — 0x5E FOUND (already delivered)', color: 'red' },
          { time: '00:02.510', fn: 'PKT_DROP', msg: 'Node C silently drops duplicate msg_id=0x5E from R', color: 'red' },
        ],
      },
    },
    {
      title: 'One delivery — safe flooding',
      description:
        'Result: exactly one message delivery to C, despite two relay paths. TTL prevents infinite loops, seen_msg_ids prevents duplicate delivery. This is the core safety mechanism of the mesh protocol.',
      state: {
        activeNodes: ['A', 'C'],
        nodeOverrides: [{ nodeId: 'C', status: 'receiver' }],
        logs: [
          { time: '00:02.600', fn: 'SUMMARY', msg: 'Deliveries: 1 | Duplicates dropped: 1 | Protocol: safe', color: 'green' },
          { time: '00:02.610', fn: 'RING_BUFFER', msg: 'seen_msg_ids ring buffer capacity: 32 entries (FIFO eviction)', color: 'white' },
        ],
      },
    },
  ],
};

// ─── Scenario 7: Node Leaves Mid-Delivery ──────────────────────────────────

const s7Nodes: SimNode[] = [
  { id: 'A', label: 'A', type: 'phone',  x: 150, y: 300 },
  { id: 'B', label: 'B', type: 'phone',  x: 430, y: 300 },
  { id: 'C', label: 'C', type: 'phone',  x: 710, y: 300 },
];

const scenario7: Scenario = {
  id: 7,
  title: 'Node Leaves Mid-Delivery',
  subtitle: 'C goes offline before packet arrives',
  nodes: s7Nodes,
  steps: [
    {
      title: 'A sends message to C',
      description:
        'A broadcasts msg_id=0x7F (TTL=5) addressed to C. The message begins propagating through the mesh.',
      state: {
        activeNodes: ['A'],
        pulseNodes: ['A'],
        rangeCircles: [{ nodeId: 'A', type: 'ble', active: true }],
        packets: [
          { id: pid(), from: 'A', to: 'B', type: 'ble', label: '0x7F TTL=5', duration: 900 },
        ],
        logs: [
          { time: '00:00.000', fn: 'BLE_ADVERTISE', msg: 'Node A broadcasts msg_id=0x7F (TTL=5, receiver=C)', color: 'cyan' },
        ],
      },
    },
    {
      title: 'B relays the packet',
      description:
        'B receives the advertisement and re-advertises (TTL=4). The packet is now in transit toward C.',
      state: {
        activeNodes: ['B'],
        pulseNodes: ['B'],
        packets: [
          { id: pid(), from: 'B', to: 'C', type: 'ble', label: '0x7F TTL=4', duration: 900 },
        ],
        logs: [
          { time: '00:01.100', fn: 'BLE_RELAY', msg: 'Node B re-advertises msg_id=0x7F (TTL=4)', color: 'cyan' },
        ],
      },
    },
    {
      title: 'C powers off mid-delivery',
      description:
        "C's device goes offline while the packet is still in transit. The node fades to indicate it has left the mesh. There is no store-and-forward mechanism — this is explicitly out of thesis scope.",
      state: {
        activeNodes: [],
        nodeOverrides: [{ nodeId: 'C', status: 'offline' }],
        logs: [
          { time: '00:01.800', fn: 'NODE_OFFLINE', msg: 'Node C disconnected — BLE advertisement timeout', color: 'red' },
          { time: '00:01.810', fn: 'MESH_UPDATE', msg: 'C removed from peer tables (B detects after heartbeat miss)', color: 'white' },
        ],
      },
    },
    {
      title: 'Packet reaches empty space',
      description:
        "The in-flight advertisement reaches C's last known position, but C is no longer there to receive it. The flood dissipates with no further hops.",
      state: {
        activeNodes: [],
        nodeOverrides: [{ nodeId: 'C', status: 'offline' }],
        logs: [
          { time: '00:02.100', fn: 'FLOOD_MISS', msg: 'BLE advertisement 0x7F reached C last-position — no receiver', color: 'red' },
          { time: '00:02.110', fn: 'TTL_EXPIRE', msg: 'Flood dissipated — no ACK will be generated', color: 'red' },
        ],
      },
    },
    {
      title: "A's timer counts down",
      description:
        "No ACK is returned. A's retry timer counts down.",
      state: {
        activeNodes: ['A'],
        nodeOverrides: [{ nodeId: 'C', status: 'offline' }],
        logs: [
          { time: '00:02.200', fn: 'TIMER_START', msg: 'Node A starts ACK wait timer (30s) for msg_id=0x7F', color: 'amber' },
          { time: '00:32.200', fn: 'TIMER_EXPIRE', msg: 'ACK wait timer expired — no response from C', color: 'red' },
        ],
      },
    },
    {
      title: 'Status: Unconfirmed — no DTN',
      description:
        'Message status changes to "unconfirmed". Importantly, this protocol does NOT implement store-and-forward Delay-Tolerant Networking (DTN). When C reconnects, it will not automatically receive the missed message. This is an explicit design boundary of this thesis.',
      state: {
        activeNodes: ['A'],
        nodeOverrides: [{ nodeId: 'C', status: 'offline' }],
        logs: [
          { time: '00:32.210', fn: 'STATUS_UPDATE', msg: 'msg_id=0x7F status: sending → unconfirmed', color: 'amber' },
          { time: '00:32.220', fn: 'SCOPE_NOTE', msg: 'Store-and-forward DTN: out of thesis scope — no replay on reconnect', color: 'white' },
        ],
      },
    },
  ],
};

// ─── Export ─────────────────────────────────────────────────────────────────

export const SCENARIOS: Scenario[] = [
  scenario1,
  scenario2,
  scenario3,
  scenario4,
  scenario5,
  scenario7,
];
