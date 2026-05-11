/**
 * StoryMapper — Story Canvas
 * 
 * React Flow canvas with custom nodes, edges, connection drop menu,
 * and edge click handler for sidebar editing.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnConnectStartParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStoryStore } from '../../store/useStoryStore';
import { useUIStore } from '../../store/useUIStore';
import { ScriptEditorNode } from '../nodes/ScriptEditorNode';
import { SubStoryNode } from '../nodes/SubStoryNode';
import { StartNode, EndNode } from '../nodes/StartEndNode';
import { BranchNode } from '../nodes/BranchNode';
import { LabeledEdge } from '../edges/LabeledEdge';
import { ConnectionDropMenu } from './ConnectionDropMenu';
import type { NodeType } from '../../types/story';

const nodeTypes = {
  'script-editor': ScriptEditorNode,
  'sub-story': SubStoryNode,
  'start': StartNode,
  'end': EndNode,
  'branch': BranchNode,
};

const edgeTypes = {
  'labeled': LabeledEdge,
};

export function StoryCanvas() {
  const project = useStoryStore((s) => s.project);
  const activeGraphId = useStoryStore((s) => s.activeGraphId);
  const graphStack = useStoryStore((s) => s.graphStack);
  const onNodesChange = useStoryStore((s) => s.onNodesChange);
  const onEdgesChange = useStoryStore((s) => s.onEdgesChange);
  const addEdge = useStoryStore((s) => s.addEdge);
  const addNode = useStoryStore((s) => s.addNode);
  const navigateToGraph = useStoryStore((s) => s.navigateToGraph);
  const navigateBack = useStoryStore((s) => s.navigateBack);
  const setSelectedNodes = useStoryStore((s) => s.setSelectedNodes);
  const collapseToSubStory = useStoryStore((s) => s.collapseToSubStory);
  const selectedNodeIds = useStoryStore((s) => s.selectedNodeIds);

  const openEdgeEditor = useUIStore((s) => s.openEdgeEditor);

  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // ── Track connection source for drop menu ──
  const connectingFrom = useRef<{ nodeId: string; handleId: string } | null>(null);

  // ── Drop menu state ──
  const [dropMenu, setDropMenu] = useState<{
    screenX: number;
    screenY: number;
    flowX: number;
    flowY: number;
    sourceNodeId: string;
    sourceHandleId: string;
  } | null>(null);

  const graph = project.graphs[activeGraphId];
  if (!graph) return <div>No graph loaded</div>;

  const hasStartNode = useMemo(() =>
    graph.nodes.some(n => n.type === 'start'),
    [graph.nodes]
  );

  const rfNodes: Node[] = useMemo(() =>
    graph.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data,
      selected: n.selected,
      measured: n.measured,
    })),
    [graph.nodes]
  );

  const rfEdges: Edge[] = useMemo(() =>
    graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle,
      target: e.target,
      targetHandle: e.targetHandle,
      type: 'labeled',
      data: e.data || {},
      animated: true,
      style: { strokeWidth: 2 },
    })),
    [graph.edges]
  );

  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(activeGraphId, changes);
    const selectChanges = changes.filter((c: any) => c.type === 'select');
    if (selectChanges.length > 0) {
      const currentNodes = graph.nodes;
      const newSelected = currentNodes
        .filter(n => {
          const change = selectChanges.find((c: any) => c.id === n.id);
          return change ? change.selected : n.selected;
        })
        .map(n => n.id);
      setSelectedNodes(newSelected);
    }
  }, [activeGraphId, onNodesChange, graph.nodes, setSelectedNodes]);

  const handleEdgesChange = useCallback((changes: any[]) => {
    onEdgesChange(activeGraphId, changes);
  }, [activeGraphId, onEdgesChange]);

  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;

    // Enforce single outgoing connection for non-branch nodes
    const sourceNode = graph.nodes.find(n => n.id === connection.source);
    if (sourceNode && sourceNode.type !== 'branch') {
      const handleId = connection.sourceHandle || 'out';
      const alreadyConnected = graph.edges.some(
        e => e.source === connection.source && e.sourceHandle === handleId
      );
      if (alreadyConnected) return; // Block — already has a connection from this handle
    }

    const edge = {
      id: `e-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source,
      sourceHandle: connection.sourceHandle || 'out',
      target: connection.target,
      targetHandle: connection.targetHandle || 'in',
    };
    addEdge(activeGraphId, edge);
    // Clear the ref since connection was successful
    connectingFrom.current = null;
  }, [activeGraphId, addEdge, graph.nodes, graph.edges]);

  // ── Capture source info when connection starts ──
  const handleConnectStart = useCallback((_event: MouseEvent | TouchEvent, params: OnConnectStartParams) => {
    if (params.nodeId && params.handleId) {
      connectingFrom.current = {
        nodeId: params.nodeId,
        handleId: params.handleId,
      };
    }
  }, []);

  // ── Connection dropped on empty space → show drop menu ──
  const handleConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    const source = connectingFrom.current;
    if (!source) return;

    // Check if the drop was on the pane (empty space) vs on a node handle
    const target = (event as MouseEvent).target as HTMLElement;
    if (!target) return;

    // If dropped on a handle or node, the onConnect callback handles it
    const isOnHandle = target.closest('.react-flow__handle');
    if (isOnHandle) {
      connectingFrom.current = null;
      return;
    }

    // Get mouse position
    let clientX: number, clientY: number;
    if ('changedTouches' in event) {
      clientX = (event as TouchEvent).changedTouches[0].clientX;
      clientY = (event as TouchEvent).changedTouches[0].clientY;
    } else {
      clientX = (event as MouseEvent).clientX;
      clientY = (event as MouseEvent).clientY;
    }

    // Convert to flow coordinates for node placement
    const flowPos = screenToFlowPosition({ x: clientX, y: clientY });

    setDropMenu({
      screenX: clientX,
      screenY: clientY,
      flowX: flowPos.x,
      flowY: flowPos.y,
      sourceNodeId: source.nodeId,
      sourceHandleId: source.handleId,
    });

    connectingFrom.current = null;
  }, [screenToFlowPosition]);

  // ── Handle drop menu selection ──
  const handleDropMenuSelect = useCallback((type: string) => {
    if (!dropMenu) return;

    // Enforce single outgoing connection for non-branch nodes
    const sourceNode = graph.nodes.find(n => n.id === dropMenu.sourceNodeId);
    if (sourceNode && sourceNode.type !== 'branch') {
      const alreadyConnected = graph.edges.some(
        e => e.source === dropMenu.sourceNodeId && e.sourceHandle === dropMenu.sourceHandleId
      );
      if (alreadyConnected) {
        setDropMenu(null);
        return;
      }
    }

    // Create the new node at the drop position
    const newNodeId = addNode(activeGraphId, type as NodeType, {
      x: dropMenu.flowX,
      y: dropMenu.flowY,
    });

    // Create an edge from source to the new node
    const edge = {
      id: `e-${dropMenu.sourceNodeId}-${newNodeId}-${Date.now()}`,
      source: dropMenu.sourceNodeId,
      sourceHandle: dropMenu.sourceHandleId,
      target: newNodeId,
      targetHandle: 'in',
    };
    addEdge(activeGraphId, edge);

    setDropMenu(null);
  }, [dropMenu, activeGraphId, addNode, addEdge, graph.nodes, graph.edges]);

  // ── Edge click → open edge panel ──
  const handleEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    openEdgeEditor(edge.id);
  }, [openEdgeEditor]);

  // Double-click canvas = add new scene node
  const handlePaneDoubleClick = useCallback((event: React.MouseEvent) => {
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    addNode(activeGraphId, 'script-editor', position);
  }, [activeGraphId, addNode, screenToFlowPosition]);

  const breadcrumbs = useMemo(() =>
    graphStack.map((gId) => ({
      id: gId,
      label: project.graphs[gId]?.label || gId,
    })),
    [graphStack, project.graphs]
  );

  const handleGroupSelected = useCallback(() => {
    if (selectedNodeIds.length >= 2) {
      collapseToSubStory(activeGraphId, selectedNodeIds);
    }
  }, [activeGraphId, selectedNodeIds, collapseToSubStory]);

  const handleAddFromToolbar = useCallback((type: NodeType) => {
    addNode(activeGraphId, type, { x: 300 + Math.random() * 100, y: 200 + Math.random() * 100 });
  }, [activeGraphId, addNode]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Breadcrumb */}
      {graphStack.length > 1 && (
        <div className="breadcrumb">
          {breadcrumbs.map((bc, i) => (
            <span key={bc.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {i > 0 && <span className="breadcrumb__separator">›</span>}
              <span
                className={`breadcrumb__item ${i === breadcrumbs.length - 1 ? 'breadcrumb__item--active' : ''}`}
                onClick={() => navigateToGraph(bc.id)}
              >
                {bc.label}
              </span>
            </span>
          ))}
          <button
            className="btn btn--ghost"
            onClick={navigateBack}
            style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)' }}
          >
            ← Back
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 16px', background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--node-border)', flexShrink: 0,
      }}>
        <button className="btn btn--ghost" onClick={() => handleAddFromToolbar('script-editor')} title="Add Scene Node">
          🎬 Scene
        </button>
        <button className="btn btn--ghost" onClick={() => handleAddFromToolbar('branch')} title="Add Branch/Decision Node">
          🔀 Branch
        </button>
        <button
          className="btn btn--ghost"
          onClick={() => handleAddFromToolbar('start')}
          title={hasStartNode ? 'Only one Start node allowed' : 'Add Start Node'}
          disabled={hasStartNode}
          style={{ opacity: hasStartNode ? 0.35 : 1 }}
        >
          ▶ Start
        </button>
        <button className="btn btn--ghost" onClick={() => handleAddFromToolbar('end')} title="Add End Node">
          ■ End
        </button>
        <div style={{ width: '1px', height: '20px', background: 'var(--node-border)' }} />
        <button
          className="btn btn--ghost"
          onClick={handleGroupSelected}
          disabled={selectedNodeIds.length < 2}
          style={{ opacity: selectedNodeIds.length < 2 ? 0.35 : 1 }}
          title="Group selected nodes into a Sub-Story"
        >
          📦 Group ({selectedNodeIds.length})
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
          Drag to select · Middle-click to pan · Double-click to add scene
        </span>
      </div>

      {/* Canvas */}
      <div ref={reactFlowWrapper} style={{ flex: 1 }}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onConnectStart={handleConnectStart}
          onConnectEnd={handleConnectEnd}
          onEdgeClick={handleEdgeClick}
          onDoubleClick={handlePaneDoubleClick}
          fitView
          snapToGrid
          snapGrid={[16, 16]}
          defaultEdgeOptions={{
            type: 'labeled',
            animated: true,
            style: { stroke: 'var(--text-dim)', strokeWidth: 2 },
          }}
          minZoom={0.1}
          maxZoom={3}
          selectionOnDrag
          panOnDrag={[1, 2]}
          selectionKeyCode={null}
          multiSelectionKeyCode="Shift"
          deleteKeyCode="Delete"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--text-dim)" />
          <Controls showInteractive={false} position="bottom-left" />
          <MiniMap
            position="bottom-right"
            nodeStrokeWidth={3}
            pannable
            zoomable
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--node-border)',
              borderRadius: '10px',
            }}
          />
        </ReactFlow>
      </div>

      {/* Connection Drop Menu */}
      {dropMenu && (
        <ConnectionDropMenu
          x={dropMenu.screenX}
          y={dropMenu.screenY}
          onSelect={handleDropMenuSelect}
          onClose={() => setDropMenu(null)}
        />
      )}
    </div>
  );
}
