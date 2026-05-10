/**
 * StoryMapper — Core Story Store (Zustand + Immer)
 * 
 * Manages the entire project state: graphs, nodes, edges, navigation.
 * Uses Immer for immutable deep updates on nested graph structures.
 */

import { create } from 'zustand';
import { produce } from 'immer';
import type { Viewport } from '@xyflow/react';
import type {
  StoryProject, Graph, StoryNode, StoryEdge, NodeData,
  LogicPort, DialogueLine, NodeType
} from '../types/story';
import { createDefaultNodeData, createDefaultLogicPort, createDefaultDialogueLine } from '../types/story';

// ─── Store Interface ────────────────────────────────────────────

interface StoryState {
  /** The full project */
  project: StoryProject;
  /** Currently active graph ID (for canvas display) */
  activeGraphId: string;
  /** Breadcrumb trail of graph IDs for navigation */
  graphStack: string[];
  /** Selected node IDs in the active graph */
  selectedNodeIds: string[];
  /** Dirty flag for auto-save */
  isDirty: boolean;

  // ── Graph Actions ──
  getActiveGraph: () => Graph;
  navigateToGraph: (graphId: string) => void;
  navigateBack: () => void;
  updateViewport: (graphId: string, viewport: Viewport) => void;

  // ── Node Actions ──
  addNode: (graphId: string, type: NodeType, position: { x: number; y: number }) => string;
  removeNode: (graphId: string, nodeId: string) => void;
  updateNodeData: (graphId: string, nodeId: string, patch: Partial<NodeData>) => void;
  toggleNodeExpanded: (graphId: string, nodeId: string) => void;
  setSelectedNodes: (nodeIds: string[]) => void;

  // ── Edge Actions ──
  addEdge: (graphId: string, edge: StoryEdge) => void;
  removeEdge: (graphId: string, edgeId: string) => void;

  // ── Logic Port Actions ──
  addLogicPort: (graphId: string, nodeId: string, label?: string) => void;
  removeLogicPort: (graphId: string, nodeId: string, portId: string) => void;
  updateLogicPort: (graphId: string, nodeId: string, portId: string, patch: Partial<LogicPort>) => void;

  // ── Dialogue Actions ──
  addDialogueLine: (graphId: string, nodeId: string) => void;
  removeDialogueLine: (graphId: string, nodeId: string, lineId: string) => void;
  updateDialogueLine: (graphId: string, nodeId: string, lineId: string, patch: Partial<DialogueLine>) => void;

  // ── Sub-Story Actions ──
  collapseToSubStory: (graphId: string, selectedNodeIds: string[]) => void;
  expandSubStory: (graphId: string, subStoryNodeId: string) => void;

  // ── Serialization ──
  loadProject: (project: StoryProject) => void;
  updateProjectMeta: (title: string) => void;

  // ── React Flow Integration ──
  onNodesChange: (graphId: string, changes: any[]) => void;
  onEdgesChange: (graphId: string, changes: any[]) => void;
}

// ─── Initial Project ────────────────────────────────────────────

const ROOT_GRAPH_ID = 'root';

function createInitialProject(): StoryProject {
  const startNode: StoryNode = {
    id: 'start-1',
    type: 'start',
    position: { x: 250, y: 50 },
    data: { ...createDefaultNodeData('Start'), expanded: false },
  };

  const sceneNode: StoryNode = {
    id: 'scene-1',
    type: 'script-editor',
    position: { x: 200, y: 200 },
    data: {
      ...createDefaultNodeData('Opening Scene'),
      outputPorts: [createDefaultLogicPort('Continue')],
      expanded: false,
    },
  };

  const endNode: StoryNode = {
    id: 'end-1',
    type: 'end',
    position: { x: 250, y: 450 },
    data: { ...createDefaultNodeData('End'), expanded: false },
  };

  const rootGraph: Graph = {
    id: ROOT_GRAPH_ID,
    label: 'Root Story',
    parentGraphId: null,
    parentNodeId: null,
    nodes: [startNode, sceneNode, endNode],
    edges: [
      { id: 'e-start-scene', source: 'start-1', sourceHandle: 'out', target: 'scene-1', targetHandle: 'in' },
      { id: 'e-scene-end', source: 'scene-1', sourceHandle: 'port-' + sceneNode.data.outputPorts[0].id, target: 'end-1', targetHandle: 'in' },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  return {
    id: crypto.randomUUID(),
    title: 'Untitled Story',
    metadata: { author: '', description: '', genre: '', tags: [] },
    rootGraphId: ROOT_GRAPH_ID,
    graphs: { [ROOT_GRAPH_ID]: rootGraph },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Store ──────────────────────────────────────────────────────

export const useStoryStore = create<StoryState>((set, get) => ({
  project: createInitialProject(),
  activeGraphId: ROOT_GRAPH_ID,
  graphStack: [ROOT_GRAPH_ID],
  selectedNodeIds: [],
  isDirty: false,

  getActiveGraph: () => {
    const { project, activeGraphId } = get();
    return project.graphs[activeGraphId];
  },

  navigateToGraph: (graphId) => set(produce((state: StoryState) => {
    if (state.project.graphs[graphId]) {
      state.activeGraphId = graphId;
      if (!state.graphStack.includes(graphId)) {
        state.graphStack.push(graphId);
      }
      state.selectedNodeIds = [];
    }
  })),

  navigateBack: () => set(produce((state: StoryState) => {
    if (state.graphStack.length > 1) {
      state.graphStack.pop();
      state.activeGraphId = state.graphStack[state.graphStack.length - 1];
      state.selectedNodeIds = [];
    }
  })),

  updateViewport: (graphId, viewport) => set(produce((state: StoryState) => {
    if (state.project.graphs[graphId]) {
      state.project.graphs[graphId].viewport = viewport;
    }
  })),

  addNode: (graphId, type, position) => {
    const nodeId = `${type}-${crypto.randomUUID().slice(0, 8)}`;
    set(produce((state: StoryState) => {
      const graph = state.project.graphs[graphId];
      if (!graph) return;
      // Enforce single start node per graph
      if (type === 'start' && graph.nodes.some(n => n.type === 'start')) {
        return; // Already has a start node
      }
      const node: StoryNode = {
        id: nodeId,
        type,
        position,
        data: createDefaultNodeData(type === 'start' ? 'Start' : type === 'end' ? 'End' : 'New Scene'),
      };
      graph.nodes.push(node);
      state.isDirty = true;
      state.project.updatedAt = new Date().toISOString();
    }));
    return nodeId;
  },

  removeNode: (graphId, nodeId) => set(produce((state: StoryState) => {
    const graph = state.project.graphs[graphId];
    if (!graph) return;
    graph.nodes = graph.nodes.filter(n => n.id !== nodeId);
    graph.edges = graph.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    state.selectedNodeIds = state.selectedNodeIds.filter(id => id !== nodeId);
    state.isDirty = true;
  })),

  updateNodeData: (graphId, nodeId, patch) => set(produce((state: StoryState) => {
    const graph = state.project.graphs[graphId];
    if (!graph) return;
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;
    Object.assign(node.data, patch);
    state.isDirty = true;
    state.project.updatedAt = new Date().toISOString();
  })),

  toggleNodeExpanded: (graphId, nodeId) => set(produce((state: StoryState) => {
    const graph = state.project.graphs[graphId];
    if (!graph) return;
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;
    node.data.expanded = !node.data.expanded;
  })),

  setSelectedNodes: (nodeIds) => set({ selectedNodeIds: nodeIds }),

  addEdge: (graphId, edge) => set(produce((state: StoryState) => {
    const graph = state.project.graphs[graphId];
    if (!graph) return;
    // Prevent duplicates
    const exists = graph.edges.some(e => e.source === edge.source && e.sourceHandle === edge.sourceHandle && e.target === edge.target);
    if (!exists) {
      graph.edges.push(edge);
      state.isDirty = true;
    }
  })),

  removeEdge: (graphId, edgeId) => set(produce((state: StoryState) => {
    const graph = state.project.graphs[graphId];
    if (!graph) return;
    graph.edges = graph.edges.filter(e => e.id !== edgeId);
    state.isDirty = true;
  })),

  addLogicPort: (graphId, nodeId, label) => set(produce((state: StoryState) => {
    const graph = state.project.graphs[graphId];
    if (!graph) return;
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;
    node.data.outputPorts.push(createDefaultLogicPort(label || `Choice ${node.data.outputPorts.length + 1}`));
    state.isDirty = true;
  })),

  removeLogicPort: (graphId, nodeId, portId) => set(produce((state: StoryState) => {
    const graph = state.project.graphs[graphId];
    if (!graph) return;
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;
    node.data.outputPorts = node.data.outputPorts.filter(p => p.id !== portId);
    // Remove edges connected to this port
    graph.edges = graph.edges.filter(e => e.sourceHandle !== `port-${portId}`);
    state.isDirty = true;
  })),

  updateLogicPort: (graphId, nodeId, portId, patch) => set(produce((state: StoryState) => {
    const graph = state.project.graphs[graphId];
    if (!graph) return;
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const port = node.data.outputPorts.find(p => p.id === portId);
    if (port) Object.assign(port, patch);
    state.isDirty = true;
  })),

  addDialogueLine: (graphId, nodeId) => set(produce((state: StoryState) => {
    const graph = state.project.graphs[graphId];
    if (!graph) return;
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;
    node.data.dialogue.push(createDefaultDialogueLine());
    state.isDirty = true;
  })),

  removeDialogueLine: (graphId, nodeId, lineId) => set(produce((state: StoryState) => {
    const graph = state.project.graphs[graphId];
    if (!graph) return;
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;
    node.data.dialogue = node.data.dialogue.filter(d => d.id !== lineId);
    state.isDirty = true;
  })),

  updateDialogueLine: (graphId, nodeId, lineId, patch) => set(produce((state: StoryState) => {
    const graph = state.project.graphs[graphId];
    if (!graph) return;
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const line = node.data.dialogue.find(d => d.id === lineId);
    if (line) Object.assign(line, patch);
    state.isDirty = true;
  })),

  collapseToSubStory: (graphId, selectedNodeIds) => set(produce((state: StoryState) => {
    const graph = state.project.graphs[graphId];
    if (!graph || selectedNodeIds.length < 2) return;

    // Create a new sub-graph
    const subGraphId = `sub-${crypto.randomUUID().slice(0, 8)}`;
    const selectedNodes = graph.nodes.filter(n => selectedNodeIds.includes(n.id));
    const selectedEdges = graph.edges.filter(e =>
      selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)
    );

    // Calculate center position for the sub-story node
    const avgX = selectedNodes.reduce((sum, n) => sum + n.position.x, 0) / selectedNodes.length;
    const avgY = selectedNodes.reduce((sum, n) => sum + n.position.y, 0) / selectedNodes.length;

    // Create sub-graph
    const subGraph: Graph = {
      id: subGraphId,
      label: 'Sub-Story',
      parentGraphId: graphId,
      parentNodeId: `substory-${subGraphId}`,
      nodes: selectedNodes.map(n => ({ ...n, position: { x: n.position.x - avgX + 200, y: n.position.y - avgY + 100 } })),
      edges: selectedEdges,
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    state.project.graphs[subGraphId] = subGraph;

    // Create sub-story node in parent graph
    const subStoryNode: StoryNode = {
      id: `substory-${subGraphId}`,
      type: 'sub-story',
      position: { x: avgX, y: avgY },
      data: {
        ...createDefaultNodeData('Sub-Story'),
        subGraphId,
        expanded: false,
      },
    };

    // Remove selected nodes and internal edges
    graph.nodes = graph.nodes.filter(n => !selectedNodeIds.includes(n.id));
    graph.edges = graph.edges.filter(e =>
      !selectedNodeIds.includes(e.source) || !selectedNodeIds.includes(e.target)
    );

    // Re-route external edges to the sub-story node
    graph.edges = graph.edges.map(e => {
      if (selectedNodeIds.includes(e.target)) {
        return { ...e, target: subStoryNode.id, targetHandle: 'in' };
      }
      if (selectedNodeIds.includes(e.source)) {
        return { ...e, source: subStoryNode.id, sourceHandle: 'out' };
      }
      return e;
    });

    graph.nodes.push(subStoryNode);
    state.isDirty = true;
  })),

  expandSubStory: (graphId, subStoryNodeId) => {
    const state = get();
    const graph = state.project.graphs[graphId];
    if (!graph) return;
    const node = graph.nodes.find(n => n.id === subStoryNodeId);
    if (!node?.data.subGraphId) return;
    get().navigateToGraph(node.data.subGraphId);
  },

  loadProject: (project) => set({
    project,
    activeGraphId: project.rootGraphId,
    graphStack: [project.rootGraphId],
    selectedNodeIds: [],
    isDirty: false,
  }),

  updateProjectMeta: (title) => set(produce((state: StoryState) => {
    state.project.title = title;
    state.isDirty = true;
  })),

  onNodesChange: (graphId, changes) => set(produce((state: StoryState) => {
    const graph = state.project.graphs[graphId];
    if (!graph) return;
    for (const change of changes) {
      if (change.type === 'position' && change.position) {
        const node = graph.nodes.find(n => n.id === change.id);
        if (node) {
          node.position = change.position;
        }
      } else if (change.type === 'remove') {
        graph.nodes = graph.nodes.filter(n => n.id !== change.id);
        graph.edges = graph.edges.filter(e => e.source !== change.id && e.target !== change.id);
      } else if (change.type === 'select') {
        const node = graph.nodes.find(n => n.id === change.id);
        if (node) node.selected = change.selected;
      } else if (change.type === 'dimensions' && change.dimensions) {
        const node = graph.nodes.find(n => n.id === change.id);
        if (node) node.measured = change.dimensions;
      }
    }
  })),

  onEdgesChange: (graphId, changes) => set(produce((state: StoryState) => {
    const graph = state.project.graphs[graphId];
    if (!graph) return;
    for (const change of changes) {
      if (change.type === 'remove') {
        graph.edges = graph.edges.filter(e => e.id !== change.id);
      }
    }
  })),
}));
