/**
 * StoryMapper — Script Panel (Side Editor)
 * 
 * Full editor that slides in from the right when a node is opened.
 * Renders different content depending on node type:
 *   - script-editor: Script + Metadata
 *   - branch: Choices/conditions editor
 * 
 * Uses key={editingNodeId} on the RichTextEditor to force a fresh
 * TipTap instance per-node, ensuring each node loads its own content.
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useStoryStore } from '../../store/useStoryStore';
import { useUIStore } from '../../store/useUIStore';
import { RichTextEditor } from '../editor/RichTextEditor';
import type { StoryNode } from '../../types/story';

export function ScriptPanel() {
  const editingNodeId = useUIStore((s) => s.editingNodeId);
  const closeNodeEditor = useUIStore((s) => s.closeNodeEditor);

  const activeGraphId = useStoryStore((s) => s.activeGraphId);
  const project = useStoryStore((s) => s.project);
  const updateNodeData = useStoryStore((s) => s.updateNodeData);
  const addLogicPort = useStoryStore((s) => s.addLogicPort);
  const removeLogicPort = useStoryStore((s) => s.removeLogicPort);
  const updateLogicPort = useStoryStore((s) => s.updateLogicPort);

  const graph = project.graphs[activeGraphId];
  const node: StoryNode | undefined = useMemo(() => {
    if (!editingNodeId || !graph) return undefined;
    return graph.nodes.find((n) => n.id === editingNodeId);
  }, [editingNodeId, graph]);

  const handleContentChange = useCallback((content: any) => {
    if (!editingNodeId) return;
    updateNodeData(activeGraphId, editingNodeId, { richTextContent: content });
  }, [activeGraphId, editingNodeId, updateNodeData]);

  const handleMetadataChange = useCallback((field: string, value: string) => {
    if (!editingNodeId || !node) return;
    updateNodeData(activeGraphId, editingNodeId, {
      metadata: { ...node.data.metadata, [field]: value },
    });
  }, [activeGraphId, editingNodeId, node, updateNodeData]);

  const handleTitleChange = useCallback((title: string) => {
    if (!editingNodeId) return;
    updateNodeData(activeGraphId, editingNodeId, { title });
  }, [activeGraphId, editingNodeId, updateNodeData]);

  if (!editingNodeId || !node) return null;

  const data = node.data;
  const isBranch = node.type === 'branch';

  // ── Panel resize logic ──
  const panelRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !panelRef.current) return;
      const containerRight = panelRef.current.parentElement?.getBoundingClientRect().right || window.innerWidth;
      const newWidth = containerRight - e.clientX;
      if (newWidth >= 320 && newWidth <= 800) {
        panelRef.current.style.width = `${newWidth}px`;
      }
    };
    const handleMouseUp = () => { isResizing.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, []);

  const startResize = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  return (
    <div className="script-panel" ref={panelRef}>
      {/* Resize Handle */}
      <div className="script-panel__resize-handle" onMouseDown={startResize} />
      {/* Panel Header */}
      <div className="script-panel__header">
        <div className="script-panel__header-left">
          <span style={{ fontSize: 'var(--text-lg)' }}>{isBranch ? '🔀' : '🎬'}</span>
          <input
            className="script-panel__title-input"
            value={data.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder={isBranch ? 'Decision title...' : 'Scene title...'}
          />
        </div>
        <button
          className="btn btn--ghost btn--icon"
          onClick={closeNodeEditor}
          title="Close (Esc)"
          style={{ fontSize: 'var(--text-lg)' }}
        >
          ✕
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="script-panel__body">
        {/* ── Branch Node: Choices Editor ── */}
        {isBranch && (
          <div className="script-panel__section">
            <div className="script-panel__section-header">
              <span>🔀</span> CHOICES
              <span className="badge badge--amber" style={{ marginLeft: 'auto' }}>
                {data.outputPorts.length}
              </span>
            </div>
            <div className="script-panel__section-content">
              <div className="logic-ports">
                {data.outputPorts.map((port) => (
                  <div key={port.id} className="logic-port" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="logic-port__dot" style={{ background: 'var(--accent-amber)' }} />
                      <input
                        style={{
                          background: 'transparent', border: 'none', outline: 'none',
                          color: 'var(--text-primary)', fontFamily: 'var(--font-ui)',
                          fontSize: 'var(--text-sm)', fontWeight: 600, flex: 1,
                        }}
                        value={port.label}
                        onChange={(e) => updateLogicPort(activeGraphId, editingNodeId, port.id, { label: e.target.value })}
                        placeholder="Choice label"
                      />
                      <button
                        type="button"
                        className="btn btn--ghost btn--icon"
                        onClick={() => removeLogicPort(activeGraphId, editingNodeId, port.id)}
                        style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      style={{
                        background: 'hsla(38, 92%, 58%, 0.06)', border: 'none', outline: 'none',
                        width: '100%', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)',
                        color: 'var(--text-secondary)', padding: '4px 8px 4px 20px', borderRadius: '4px',
                      }}
                      value={port.description || ''}
                      onChange={(e) => updateLogicPort(activeGraphId, editingNodeId, port.id, { description: e.target.value })}
                      placeholder="Short description of this choice..."
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="port-add-btn"
                  onClick={() => addLogicPort(activeGraphId, editingNodeId)}
                >
                  + Add Choice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Scene Node: Script + Metadata ── */}
        {!isBranch && (
          <div className="script-panel__body--scene">
            {/* Script Editor Section — grows to fill available space */}
            <div className="script-panel__section script-panel__section--grow">
              <div className="script-panel__section-header">
                <span>📝</span> SCRIPT
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-dim)',
                  fontWeight: 400,
                }}>
                  Alt+1..4 for format
                </span>
              </div>
              <div className="script-panel__section-content script-panel__section-content--editor">
                <RichTextEditor
                  key={editingNodeId}
                  content={data.richTextContent}
                  onChange={handleContentChange}
                  placeholder="INT. LOCATION - TIME OF DAY..."
                />
              </div>
            </div>

            {/* Metadata Section — fixed at bottom */}
            <div className="script-panel__section script-panel__section--fixed">
              <div className="script-panel__section-header">
                <span>📋</span> METADATA
              </div>
              <div className="script-panel__section-content">
                <div className="metadata-grid">
                  <div className="metadata-field">
                    <span className="metadata-field__icon">🌍</span>
                    <label className="metadata-field__label">Env</label>
                    <input
                      className="metadata-field__value"
                      value={data.metadata.environment}
                      onChange={(e) => handleMetadataChange('environment', e.target.value)}
                      placeholder="Environment..."
                    />
                  </div>
                  <div className="metadata-field">
                    <span className="metadata-field__icon">🎭</span>
                    <label className="metadata-field__label">Amb</label>
                    <input
                      className="metadata-field__value"
                      value={data.metadata.ambience}
                      onChange={(e) => handleMetadataChange('ambience', e.target.value)}
                      placeholder="Ambience..."
                    />
                  </div>
                  <div className="metadata-field">
                    <span className="metadata-field__icon">✨</span>
                    <label className="metadata-field__label">VFX</label>
                    <input
                      className="metadata-field__value"
                      value={data.metadata.visualEffects}
                      onChange={(e) => handleMetadataChange('visualEffects', e.target.value)}
                      placeholder="Visual Effects..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
