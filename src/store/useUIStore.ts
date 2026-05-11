/**
 * StoryMapper — UI Store
 * 
 * Manages transient UI state: view routing, active panels, 
 * node/edge editor panels, validation display, project list.
 */

import { create } from 'zustand';

export interface ProjectListItem {
  id: string;
  title: string;
  updatedAt: string;
  /** JSON string of the full project for localStorage persistence */
  data: string;
}

interface UIState {
  /** Current application view */
  currentView: 'project-manager' | 'editor';
  /** The node currently open in the script editor panel (null = panel closed) */
  editingNodeId: string | null;
  /** The edge currently open in the edge editor panel (null = panel closed) */
  editingEdgeId: string | null;
  /** Whether the validation bar is visible */
  showValidationBar: boolean;
  /** Current validation status */
  validationStatus: 'ok' | 'warn' | 'error' | 'idle';
  validationMessage: string;
  /** Context menu */
  contextMenu: { x: number; y: number; nodeId?: string } | null;
  /** Saved project list (persisted to localStorage) */
  projectList: ProjectListItem[];

  // ── View Actions ──
  setView: (view: 'project-manager' | 'editor') => void;

  // ── Node Editor Panel ──
  openNodeEditor: (nodeId: string) => void;
  closeNodeEditor: () => void;

  // ── Edge Editor Panel ──
  openEdgeEditor: (edgeId: string) => void;
  closeEdgeEditor: () => void;

  // ── Close any panel ──
  closeAllPanels: () => void;

  // ── Validation ──
  setValidation: (status: 'ok' | 'warn' | 'error' | 'idle', message: string) => void;

  // ── Context Menu ──
  openContextMenu: (x: number, y: number, nodeId?: string) => void;
  closeContextMenu: () => void;

  // ── Project List ──
  loadProjectList: () => void;
  saveProjectToList: (item: ProjectListItem) => void;
  removeProjectFromList: (id: string) => void;
}

// Load from localStorage
function getStoredProjectList(): ProjectListItem[] {
  try {
    const raw = localStorage.getItem('storymapper-projects');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function persistProjectList(list: ProjectListItem[]) {
  try {
    localStorage.setItem('storymapper-projects', JSON.stringify(list));
  } catch { /* ignore */ }
}

export const useUIStore = create<UIState>((set, get) => ({
  currentView: 'project-manager',
  editingNodeId: null,
  editingEdgeId: null,
  showValidationBar: true,
  validationStatus: 'idle',
  validationMessage: 'Ready',
  contextMenu: null,
  projectList: getStoredProjectList(),

  setView: (view) => set({ currentView: view, editingNodeId: null, editingEdgeId: null }),

  openNodeEditor: (nodeId) => set({ editingNodeId: nodeId, editingEdgeId: null }),
  closeNodeEditor: () => set({ editingNodeId: null }),

  openEdgeEditor: (edgeId) => set({ editingEdgeId: edgeId, editingNodeId: null }),
  closeEdgeEditor: () => set({ editingEdgeId: null }),

  closeAllPanels: () => set({ editingNodeId: null, editingEdgeId: null }),

  setValidation: (status, message) => set({ validationStatus: status, validationMessage: message }),

  openContextMenu: (x, y, nodeId) => set({ contextMenu: { x, y, nodeId } }),
  closeContextMenu: () => set({ contextMenu: null }),

  loadProjectList: () => set({ projectList: getStoredProjectList() }),

  saveProjectToList: (item) => {
    const list = get().projectList.filter(p => p.id !== item.id);
    list.unshift(item);
    persistProjectList(list);
    set({ projectList: list });
  },

  removeProjectFromList: (id) => {
    const list = get().projectList.filter(p => p.id !== id);
    persistProjectList(list);
    set({ projectList: list });
  },
}));
