/**
 * StoryMapper — ScriptEditorNode (Canvas Version)
 * 
 * On the canvas, this node shows ONLY its heading, summary badges,
 * and port handles. The full script editor opens in a separate
 * side panel when the node is double-clicked.
 */

import { memo, useCallback, useState, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useStoryStore } from '../../store/useStoryStore';
import { useUIStore } from '../../store/useUIStore';
import type { NodeData } from '../../types/story';

type ScriptEditorNodeProps = NodeProps & { data: NodeData };

export const ScriptEditorNode = memo(function ScriptEditorNode({ id, data, selected }: ScriptEditorNodeProps) {
  const activeGraphId = useStoryStore((s) => s.activeGraphId);
  const updateNodeData = useStoryStore((s) => s.updateNodeData);
  const openNodeEditor = useUIStore((s) => s.openNodeEditor);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(data.title);

  // Double-click opens the script editor panel
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    openNodeEditor(id);
  }, [id, openNodeEditor]);

  const handleTitleSubmit = useCallback(() => {
    updateNodeData(activeGraphId, id, { title: titleDraft });
    setIsEditingTitle(false);
  }, [activeGraphId, id, titleDraft, updateNodeData]);

  // Port handles for React Flow
  const portHandles = useMemo(() => data.outputPorts.map((port, index) => (
    <Handle
      key={port.id}
      type="source"
      position={Position.Right}
      id={`port-${port.id}`}
      style={{
        top: `${((index + 1) / (data.outputPorts.length + 1)) * 100}%`,
        background: 'var(--accent-teal)',
      }}
    />
  )), [data.outputPorts]);

  const nodeClasses = [
    'story-node',
    selected ? 'story-node--selected' : '',
  ].filter(Boolean).join(' ');

  // Color bar on the left
  const accentColor = data.color || 'var(--accent-blue)';

  return (
    <div
      className={nodeClasses}
      onDoubleClick={handleDoubleClick}
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      {/* Input Handle */}
      <Handle type="target" position={Position.Left} id="in" />

      {/* Header — always visible */}
      <div className="node-header">
        <div
          className="node-header__indicator"
          style={{ background: accentColor }}
        />
        <span className="node-header__icon">🎬</span>
        {isEditingTitle ? (
          <input
            className="node-header__title-input nodrag"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') setIsEditingTitle(false);
            }}
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
        <span
          className="node-header__menu"
          onClick={(e) => {
            e.stopPropagation();
            openNodeEditor(id);
          }}
          title="Open Script Editor"
        >
          ✎
        </span>
      </div>

      {/* Summary badges — always visible */}
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
        {/* Port labels preview */}
        {data.outputPorts.length > 0 && (
          <div className="node-compact__port-labels">
            {data.outputPorts.map(port => (
              <div key={port.id} className="node-compact__port-label">
                <span className="logic-port__dot" style={{ width: 5, height: 5 }} />
                <span>{port.label}</span>
                {port.conditionFlag && (
                  <span className="node-compact__port-cond">[{port.conditionFlag}]</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
