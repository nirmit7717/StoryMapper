/**
 * StoryMapper — ScriptEditorNode (Canvas Version)
 * 
 * Scene node on canvas: shows heading, summary badges, and simple
 * in/out handles. No branching logic — that's handled by BranchNode.
 * Double-click or click ✎ to open the Script Panel for editing.
 */

import { memo, useCallback, useState } from 'react';
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

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    openNodeEditor(id);
  }, [id, openNodeEditor]);

  const handleTitleSubmit = useCallback(() => {
    updateNodeData(activeGraphId, id, { title: titleDraft });
    setIsEditingTitle(false);
  }, [activeGraphId, id, titleDraft, updateNodeData]);

  const nodeClasses = [
    'story-node',
    selected ? 'story-node--selected' : '',
  ].filter(Boolean).join(' ');

  const accentColor = data.color || 'var(--accent-blue)';

  return (
    <div
      className={nodeClasses}
      onDoubleClick={handleDoubleClick}
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      {/* Input Handle */}
      <Handle type="target" position={Position.Left} id="in" />

      {/* Header */}
      <div className="node-header">
        <div className="node-header__indicator" style={{ background: accentColor }} />
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

      {/* Summary badges */}
      <div className="node-compact">
        <div className="node-compact__summary">
          {data.dialogue.length > 0 && (
            <span className="badge badge--purple">
              {data.dialogue.length} line{data.dialogue.length !== 1 ? 's' : ''}
            </span>
          )}
          {data.metadata.environment && (
            <span className="badge">🌍 {data.metadata.environment}</span>
          )}
        </div>
      </div>

      {/* Single output handle — branching is done by BranchNode */}
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
});

export default ScriptEditorNode;
