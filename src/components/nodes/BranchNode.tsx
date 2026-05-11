/**
 * StoryMapper — Branch Node
 * 
 * A decision-point node with an amber accent. Shows labeled
 * output ports for player choices / conditions. Each port
 * generates its own React Flow handle on the right side.
 */

import { memo, useCallback, useMemo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useStoryStore } from '../../store/useStoryStore';
import { useUIStore } from '../../store/useUIStore';
import type { NodeData } from '../../types/story';

type BranchNodeProps = NodeProps & { data: NodeData };

export const BranchNode = memo(function BranchNode({ id, data, selected }: BranchNodeProps) {
  const activeGraphId = useStoryStore((s) => s.activeGraphId);
  const updateNodeData = useStoryStore((s) => s.updateNodeData);
  const addLogicPort = useStoryStore((s) => s.addLogicPort);
  const openNodeEditor = useUIStore((s) => s.openNodeEditor);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(data.title);

  const handleTitleSubmit = useCallback(() => {
    updateNodeData(activeGraphId, id, { title: titleDraft });
    setIsEditingTitle(false);
  }, [activeGraphId, id, titleDraft, updateNodeData]);

  // Render output handles for each choice
  const portHandles = useMemo(() => data.outputPorts.map((port, index) => (
    <Handle
      key={port.id}
      type="source"
      position={Position.Right}
      id={`port-${port.id}`}
      style={{
        top: `${((index + 1) / (data.outputPorts.length + 1)) * 100}%`,
        background: 'var(--accent-amber)',
        borderColor: 'var(--bg-surface)',
      }}
    />
  )), [data.outputPorts]);

  const nodeClasses = [
    'branch-node',
    selected ? 'branch-node--selected' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={nodeClasses}
      onDoubleClick={(e) => {
        e.stopPropagation();
        openNodeEditor(id);
      }}
    >
      {/* Input Handle */}
      <Handle type="target" position={Position.Left} id="in" />

      {/* Header */}
      <div className="branch-node__header">
        <span>🔀</span>
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
            style={{ flex: 1, cursor: 'text' }}
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
          title="Edit Choices"
          style={{ color: 'var(--accent-amber)' }}
        >
          ✎
        </span>
      </div>

      {/* Choice list */}
      <div className="branch-node__body">
        {data.outputPorts.map(port => (
          <div key={port.id} className="branch-node__choice">
            <span className="branch-node__choice-dot" />
            <span className="branch-node__choice-label">{port.label}</span>
            {port.conditionFlag && (
              <span className="branch-node__choice-cond">[{port.conditionFlag}]</span>
            )}
          </div>
        ))}
        <button
          type="button"
          className="branch-node__add nodrag"
          onClick={(e) => {
            e.stopPropagation();
            addLogicPort(activeGraphId, id);
          }}
        >
          + choice
        </button>
      </div>

      {/* Output handles for each port */}
      {data.outputPorts.length > 0 ? (
        portHandles
      ) : (
        <Handle type="source" position={Position.Right} id="out" />
      )}
    </div>
  );
});
