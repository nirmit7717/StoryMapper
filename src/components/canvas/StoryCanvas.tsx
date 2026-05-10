/**
 * StoryMapper — Story Canvas
 * 
 * React Flow canvas wrapper with custom node types,
 * breadcrumb navigation, toolbar, and dark theme.
 */

import { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Connection,
  type Edge,
  type Node,
  addEdge as rfAddEdge,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStoryStore } from '../../store/useStoryStore';
import { useUIStore } from '../../store/useUIStore';
import { ScriptEditorNode } from '../nodes/ScriptEditorNode';
import { SubStoryNode } from '../nodes/SubStoryNode';
import { StartNode, EndNode } from '../nodes/StartEndNode';
import type { NodeType } from '../../types/story';

// Register custom node types
const nodeTypes = {
  'script-editor': ScriptEditorNode,
  'sub-story': SubStoryNode,
  'start': StartNode,
  'end': EndNode,
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

  const setValidation = useUIStore((s) => s.setValidation);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const graph = project.graphs[activeGraphId];
  if (!graph) return <div>No graph loaded</div>;

  // Convert StoryNodes to React Flow nodes
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

  // Convert StoryEdges to React Flow edges
  const rfEdges: Edge[] = useMemo(() =>
    graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle,
      target: e.target,
      targetHandle: e.targetHandle,
      animated: true,
      style: { strokeWidth: 2 },
    })),
    [graph.edges]
  );

  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(activeGraphId, changes);
    // Track selection
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
    const edge = {
      id: `e-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source,
      sourceHandle: connection.sourceHandle || 'out',
      target: connection.target,
      targetHandle: connection.targetHandle || 'in',
    };
    addEdge(activeGraphId, edge);
  }, [activeGraphId, addEdge]);

  // Double-click canvas to add a node
  const handlePaneDoubleClick = useCallback((event: React.MouseEvent) => {
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!bounds) return;
    // Use a simple position calculation
    const position = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    addNode(activeGraphId, 'script-editor', position);
  }, [activeGraphId, addNode]);

  // Breadcrumb items
  const breadcrumbs = useMemo(() =>
    graphStack.map((gId) => ({
      id: gId,
      label: project.graphs[gId]?.label || gId,
    })),
    [graphStack, project.graphs]
  );

  // Group selected nodes into sub-story
  const handleGroupSelected = useCallback(() => {
    if (selectedNodeIds.length >= 2) {
      collapseToSubStory(activeGraphId, selectedNodeIds);
    }
  }, [activeGraphId, selectedNodeIds, collapseToSubStory]);

  // Add node from toolbar
  const handleAddFromToolbar = useCallback((type: NodeType) => {
    addNode(activeGraphId, type, { x: 300 + Math.random() * 100, y: 200 + Math.random() * 100 });
  }, [activeGraphId, addNode]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 16px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--node-border)',
        flexShrink: 0,
      }}>
        <button className="btn btn--ghost" onClick={() => handleAddFromToolbar('script-editor')} title="Add Scene Node">
          🎬 Scene
        </button>
        <button className="btn btn--ghost" onClick={() => handleAddFromToolbar('start')} title="Add Start Node">
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
          style={{ opacity: selectedNodeIds.length < 2 ? 0.4 : 1 }}
          title="Group selected nodes into a Sub-Story"
        >
          📦 Group ({selectedNodeIds.length})
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
          Double-click canvas to add scene
        </span>
      </div>

      {/* Canvas */}
      <div ref={reactFlowWrapper} style={{ flex: 1 }}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onDoubleClick={handlePaneDoubleClick}
          fitView
          snapToGrid
          snapGrid={[16, 16]}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: 'var(--text-dim)', strokeWidth: 2 },
          }}
          minZoom={0.1}
          maxZoom={3}
          multiSelectionKeyCode="Shift"
          deleteKeyCode="Delete"
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="var(--text-dim)"
          />
          <Controls
            showInteractive={false}
            position="bottom-left"
          />
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
    </div>
  );
}
