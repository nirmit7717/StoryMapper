/**
 * StoryMapper — Edge Panel (Side Editor)
 * 
 * Sidebar panel for editing edge/connection properties.
 * Opens when an edge is clicked on the canvas.
 * Allows editing description, label, and default path flag.
 */

import { useCallback, useMemo } from 'react';
import { useStoryStore } from '../../store/useStoryStore';
import { useUIStore } from '../../store/useUIStore';

export function EdgePanel() {
  const editingEdgeId = useUIStore((s) => s.editingEdgeId);
  const closeEdgeEditor = useUIStore((s) => s.closeEdgeEditor);

  const activeGraphId = useStoryStore((s) => s.activeGraphId);
  const project = useStoryStore((s) => s.project);
  const updateEdgeData = useStoryStore((s) => s.updateEdgeData);

  const graph = project.graphs[activeGraphId];

  const edge = useMemo(() => {
    if (!editingEdgeId || !graph) return undefined;
    return graph.edges.find((e) => e.id === editingEdgeId);
  }, [editingEdgeId, graph]);

  // Look up source and target node names
  const sourceNode = useMemo(() => {
    if (!edge || !graph) return null;
    return graph.nodes.find(n => n.id === edge.source);
  }, [edge, graph]);

  const targetNode = useMemo(() => {
    if (!edge || !graph) return null;
    return graph.nodes.find(n => n.id === edge.target);
  }, [edge, graph]);

  const handleDescriptionChange = useCallback((description: string) => {
    if (!editingEdgeId) return;
    updateEdgeData(activeGraphId, editingEdgeId, { description });
  }, [activeGraphId, editingEdgeId, updateEdgeData]);

  const handleLabelChange = useCallback((label: string) => {
    if (!editingEdgeId) return;
    updateEdgeData(activeGraphId, editingEdgeId, { label });
  }, [activeGraphId, editingEdgeId, updateEdgeData]);

  if (!editingEdgeId || !edge) return null;

  const data = edge.data || {};

  return (
    <div className="script-panel">
      {/* Panel Header */}
      <div className="script-panel__header">
        <div className="script-panel__header-left">
          <span style={{ fontSize: 'var(--text-lg)' }}>🔗</span>
          <span style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-md)',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            Connection
          </span>
        </div>
        <button
          className="btn btn--ghost btn--icon"
          onClick={closeEdgeEditor}
          title="Close (Esc)"
          style={{ fontSize: 'var(--text-lg)' }}
        >
          ✕
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="script-panel__body">
        {/* Flow Path */}
        <div className="script-panel__section">
          <div className="script-panel__section-header">
            <span>📍</span> FLOW PATH
          </div>
          <div className="script-panel__section-content">
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px',
              background: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
            }}>
              <span style={{
                padding: '2px 8px',
                background: 'hsla(215,92%,62%,0.12)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-blue)',
                fontWeight: 500,
              }}>
                {sourceNode?.data.title || edge.source}
              </span>
              <span style={{ color: 'var(--text-dim)' }}>→</span>
              <span style={{
                padding: '2px 8px',
                background: 'hsla(175,65%,50%,0.12)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-teal)',
                fontWeight: 500,
              }}>
                {targetNode?.data.title || edge.target}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="script-panel__section">
          <div className="script-panel__section-header">
            <span>📝</span> DESCRIPTION
          </div>
          <div className="script-panel__section-content">
            <textarea
              style={{
                width: '100%',
                minHeight: '100px',
                background: 'var(--bg-canvas)',
                border: '1px solid var(--node-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                padding: '8px 12px',
                resize: 'vertical',
                outline: 'none',
                lineHeight: 1.6,
                transition: 'border-color 120ms ease',
              }}
              value={data.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Describe the flow between these scenes...&#10;e.g. 'Player chooses to confront the suspect'"
              onFocus={(e) => {
                (e.target as HTMLElement).style.borderColor = 'var(--accent-blue)';
              }}
              onBlur={(e) => {
                (e.target as HTMLElement).style.borderColor = 'var(--node-border)';
              }}
            />
          </div>
        </div>

        {/* Label */}
        <div className="script-panel__section">
          <div className="script-panel__section-header">
            <span>🏷️</span> SHORT LABEL
          </div>
          <div className="script-panel__section-content">
            <input
              className="metadata-field__value"
              style={{
                width: '100%',
                background: 'var(--bg-canvas)',
                border: '1px solid var(--node-border)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                fontSize: 'var(--text-sm)',
              }}
              value={data.label || ''}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="Optional short label (shown on canvas)..."
            />
            <p style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
              marginTop: '6px',
              lineHeight: 1.4,
            }}>
              A short label displayed on the connection line. Keep it brief.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
