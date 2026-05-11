/**
 * StoryMapper — Script Panel (Side Editor)
 * 
 * Full editor that slides in from the right when a node is opened.
 * Renders different content depending on node type:
 *   - script-editor: Script, Dialogue, Metadata
 *   - branch: Choices/conditions editor
 */

import { useCallback, useMemo } from 'react';
import { useStoryStore } from '../../store/useStoryStore';
import { useUIStore } from '../../store/useUIStore';
import { RichTextEditor } from '../editor/RichTextEditor';
import { DialogueEditor } from '../editor/DialogueEditor';
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

  return (
    <div className="script-panel">
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
                  <div key={port.id} className="logic-port">
                    <span className="logic-port__dot" style={{ background: 'var(--accent-amber)' }} />
                    <input
                      style={{
                        background: 'transparent', border: 'none', outline: 'none',
                        color: 'var(--text-primary)', fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--text-sm)', fontWeight: 500, flex: 1,
                      }}
                      value={port.label}
                      onChange={(e) => updateLogicPort(activeGraphId, editingNodeId, port.id, { label: e.target.value })}
                      placeholder="Choice label"
                    />
                    <input
                      style={{
                        background: 'hsla(38, 92%, 58%, 0.1)', border: 'none', outline: 'none',
                        width: '100px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
                        color: 'var(--accent-amber)', padding: '2px 8px', borderRadius: '4px',
                      }}
                      value={port.conditionFlag || ''}
                      onChange={(e) => updateLogicPort(activeGraphId, editingNodeId, port.id, { conditionFlag: e.target.value })}
                      placeholder="flag"
                    />
                    <input
                      style={{
                        background: 'hsla(38, 92%, 58%, 0.06)', border: 'none', outline: 'none',
                        width: '60px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
                        color: 'var(--accent-amber)', padding: '2px 6px', borderRadius: '4px',
                      }}
                      value={port.conditionValue || ''}
                      onChange={(e) => updateLogicPort(activeGraphId, editingNodeId, port.id, { conditionValue: e.target.value })}
                      placeholder="value"
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

        {/* ── Scene Node: Script + Dialogue + Metadata ── */}
        {!isBranch && (
          <>
            {/* Script Editor Section */}
            <div className="script-panel__section">
              <div className="script-panel__section-header">
                <span>📝</span> SCRIPT
              </div>
              <div className="script-panel__section-content">
                <RichTextEditor
                  content={data.richTextContent}
                  onChange={handleContentChange}
                  placeholder="INT. LOCATION - TIME OF DAY..."
                />
              </div>
            </div>

            {/* Dialogue Section */}
            <div className="script-panel__section">
              <DialogueEditor
                graphId={activeGraphId}
                nodeId={editingNodeId}
                dialogue={data.dialogue}
              />
            </div>

            {/* Metadata Section */}
            <div className="script-panel__section">
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
          </>
        )}
      </div>
    </div>
  );
}
