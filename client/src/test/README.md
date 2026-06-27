# Sandbox Simulation Test Suite

This directory contains the unit and integration tests for the Sandbox Canvas network interaction module.
Vitest is utilized as the test runner with the React Testing Library (+ JSDOM env) for UI components.

## Running tests
  - \`npm run test\` - standard run
  - \`npm run test:ui\` - opens Vitest graphical UI in browser
  - \`npm run test:coverage\` - triggers v8 test coverage
  - \`npm run test:all\` - runs all suites with verbose reporter

## Structure
- \`adjacency.test.ts\` - Validates the computation logic between BLE proximity rings and LoRa hardcoded logic
- \`nodeManager.test.ts\` - Evaluates Node/Link creation and constraints cleanly across array contexts 
- \`simulation.test.ts\` - Tests the deterministic simulation outcome of the FLOOD/ACK algorithm without UI mounting
- \`presets.test.ts\` - Evaluates the mock Supabase implementation against the state of the React app layout
- \`SandboxCanvas.test.tsx\` - Component rendering validation check for node tool availability
- \`integration.test.tsx\` - Executes end-to-end simulated scenarios across adjacency logic into the final simulation routing output and evaluates logs generated
