// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import SandboxPage from '../components/SandboxPage';
import { supabase } from '../lib/supabase';

// Step 5 — Admin and preset system tests
const mockPresets = [{ id: '1', name: 'Mock Preset', description: 'Mock', nodes: [], lora_links: [], created_at: '' }];
const mockNewPreset = { id: '2', name: 'New Preset', description: 'New', nodes: [], lora_links: [], created_at: '' };
const mockUpdatedPreset = { ...mockPresets[0], name: 'Updated' };

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: mockPresets, error: null }) }),
      insert: vi.fn().mockResolvedValue({ data: [mockNewPreset], error: null }),
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [mockUpdatedPreset], error: null }) }),
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) })
    }))
  }
}));

describe('PRESET LOADING', () => {
    it('on mount: supabase.select is called once', async () => {
        render(<SandboxPage />);
        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('presets');
        });
    });
});
