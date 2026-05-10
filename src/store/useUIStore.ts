/**
 * StoryMapper — UI Store
 * 
 * Manages transient UI state: active panels, theme, validation display.
 */

import { create } from 'zustand';

interface UIState {
  /** Whether the metadata panel is open */
  showMetadataPanel: boolean;
  /** Whether the validation bar is visible */
  showValidationBar: boolean;
  /** Current validation status */
  validationStatus: 'ok' | 'warn' | 'error' | 'idle';
  validationMessage: string;
  /** Context menu */
  contextMenu: { x: number; y: number; nodeId?: string } | null;

  // Actions
  toggleMetadataPanel: () => void;
  setValidation: (status: 'ok' | 'warn' | 'error' | 'idle', message: string) => void;
  openContextMenu: (x: number, y: number, nodeId?: string) => void;
  closeContextMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  showMetadataPanel: false,
  showValidationBar: true,
  validationStatus: 'idle',
  validationMessage: 'Ready',
  contextMenu: null,

  toggleMetadataPanel: () => set((s) => ({ showMetadataPanel: !s.showMetadataPanel })),

  setValidation: (status, message) => set({ validationStatus: status, validationMessage: message }),

  openContextMenu: (x, y, nodeId) => set({ contextMenu: { x, y, nodeId } }),
  closeContextMenu: () => set({ contextMenu: null }),
}));
