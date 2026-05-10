/**
 * StoryMapper — ScriptEditorNode
 * 
 * The primary node type. Has two visual states:
 * - Compact (minimized): Title + summary badges + port indicators
 * - Expanded (selected/opened): Full editor, dialogue, metadata, ports
 */

import { memo, useCallback, useState, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useStoryStore } from '../../store/useStoryStore';
import { RichTextEditor } from '../editor/RichTextEditor';
import { DialogueEditor } from '../editor/DialogueEditor';
import type { NodeData } from '../../types/story';

type ScriptEditorNodeProps = NodeProps & { data: NodeData };

export const ScriptEditorNode = memo(function ScriptEditorNode({ id, data, selected }: ScriptEditorNodeProps) {
  const activeGraphId = useStoryStore((s) => s.activeGraphId);
  const updateNodeData = useStoryStore((s) => s.updateNodeData);
  const toggleNodeExpanded = useStoryStore((s) => s.toggleNodeExpanded);
  const addLogicPort = useStoryStore((s) => s.addLogicPort);
  const removeLogicPort = useStoryStore((s) => s.removeLogicPort);
  const updateLogicPort = useStoryStore((s) => s.updateLogicPort);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(data.title);

  const isExpanded = data.expanded || selected;

  const handleToggle = useCallback(() => {
    toggleNodeExpanded(activeGraphId, id);
  }, [activeGraphId, id, toggleNodeExpanded]);

  const handleTitleSubmit = useCallback(() => {
    updateNodeData(activeGraphId, id, { title: titleDraft });
    setIsEditingTitle(false);
  }, [activeGraphId, id, titleDraft, updateNodeData]);

  const handleContentChange = useCallback((content: any) => {
    updateNodeData(activeGraphId, id, { richTextContent: content });
  }, [activeGraphId, id, updateNodeData]);

  const handleMetadataChange = useCallback((field: string, value: string) => {
    updateNodeData(activeGraphId, id, {
      metadata: { ...data.metadata, [field]: value },
    });
  }, [activeGraphId, id, data.metadata, updateNodeData]);

  // Port handles for React Flow
  const portHandles = useMemo(() => data.outputPorts.map((port) => (
    <Handle
      key={port.id}
      type="source"
      position={Position.Right}
      id={`port-${port.id}`}
      style={{ top: 'auto' }}
    />
  )), [data.outputPorts]);

  const nodeClasses = [
    'story-node',
    selected ? 'story-node--selected' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={nodeClasses} style={{ borderLeftColor: data.color || 'var(--accent-blue)' }}>
      {/* Input Handle */}
      <Handle type="target" position={Position.Left} id="in" />

      {/* Header */}
      <div className="node-header" onClick={handleToggle}>
        <div
          className="node-header__indicator"
          style={{ background: data.color || 'var(--accent-blue)' }}
        />
        <span className="node-header__icon">🎬</span>
        {isEditingTitle ? (
          <input
            className="node-header__title-input nodrag"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="node-header__title"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
              setTitleDraft(data.title);
            }}
          >
            {data.title}
          </span>
        )}
        <span className="node-header__toggle">
          {isExpanded ? '▾' : '▸'}
        </span>
      </div>

      {/* Compact View */}
      {!isExpanded && (
        <div className="node-compact">
          <div className="node-compact__summary">
            {data.outputPorts.length > 0 && (
              <span className="badge badge--blue">
                {data.outputPorts.length} choice{data.outputPorts.length !== 1 ? 's' : ''}
              </span>
            )}
            {data.dialogue.length > 0 && (
              <span className="badge badge--purple">
                {data.dialogue.length} line{data.dialogue.length !== 1 ? 's' : ''}
              </span>
            )}
            {data.metadata.environment && (
              <span className="badge">
                🌍 {data.metadata.environment}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <>
          {/* Script Editor Section */}
          <div className="node-section">
            <div className="node-section__header">
              <span className="node-section__icon">📝</span>
              SCRIPT
            </div>
            <div className="node-section__content">
              <RichTextEditor
                content={data.richTextContent}
                onChange={handleContentChange}
                placeholder="INT. LOCATION - TIME..."
              />
            </div>
          </div>

          {/* Dialogue Section */}
          <DialogueEditor
            graphId={activeGraphId}
            nodeId={id}
            dialogue={data.dialogue}
          />

          {/* Metadata Section */}
          <div className="node-section">
            <div className="node-section__header">
              <span className="node-section__icon">📋</span>
              METADATA
            </div>
            <div className="node-section__content">
              <div className="metadata-grid nodrag nowheel">
                <div className="metadata-field">
                  <span className="metadata-field__icon">🌍</span>
                  <input
                    className="metadata-field__value"
                    value={data.metadata.environment}
                    onChange={(e) => handleMetadataChange('environment', e.target.value)}
                    placeholder="Environment..."
                  />
                </div>
                <div className="metadata-field">
                  <span className="metadata-field__icon">🎭</span>
                  <input
                    className="metadata-field__value"
                    value={data.metadata.ambience}
                    onChange={(e) => handleMetadataChange('ambience', e.target.value)}
                    placeholder="Ambience..."
                  />
                </div>
                <div className="metadata-field">
                  <span className="metadata-field__icon">✨</span>
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

          {/* Logic Ports Section */}
          <div className="node-section">
            <div className="node-section__header">
              <span className="node-section__icon">🔀</span>
              PLAYER CHOICES
              <span className="badge badge--blue" style={{ marginLeft: 'auto' }}>
                {data.outputPorts.length}
              </span>
            </div>
            <div className="node-section__content nodrag nowheel">
              <div className="logic-ports">
                {data.outputPorts.map((port) => (
                  <div key={port.id} className="logic-port">
                    <span className="logic-port__dot" />
                    <input
                      className="logic-port__label"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        flex: 1,
                      }}
                      value={port.label}
                      onChange={(e) => updateLogicPort(activeGraphId, id, port.id, { label: e.target.value })}
                      placeholder="Choice label"
                    />
                    <input
                      className="logic-port__condition"
                      style={{
                        background: 'hsla(38, 92%, 58%, 0.1)',
                        border: 'none',
                        outline: 'none',
                        width: '80px',
                      }}
                      value={port.conditionFlag ? `${port.conditionFlag} ${port.conditionValue}` : ''}
                      onChange={(e) => {
                        const parts = e.target.value.split(' ');
                        updateLogicPort(activeGraphId, id, port.id, {
                          conditionFlag: parts[0] || '',
                          conditionValue: parts.slice(1).join(' '),
                        });
                      }}
                      placeholder="condition"
                    />
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      onClick={() => removeLogicPort(activeGraphId, id, port.id)}
                      style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)', flexShrink: 0 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="port-add-btn"
                  onClick={() => addLogicPort(activeGraphId, id)}
                >
                  + Add Choice
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Output Port Handles */}
      {data.outputPorts.length > 0 ? (
        portHandles
      ) : (
        <Handle type="source" position={Position.Right} id="out" />
      )}
    </div>
  );
});

export default ScriptEditorNode;
