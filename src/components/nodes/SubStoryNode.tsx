/**
 * StoryMapper — SubStoryNode
 * 
 * Represents a collapsed sub-graph. Shows a preview and allows
 * drill-in navigation via double-click.
 */

import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useStoryStore } from '../../store/useStoryStore';
import type { NodeData } from '../../types/story';

type SubStoryNodeProps = NodeProps & { data: NodeData };

export const SubStoryNode = memo(function SubStoryNode({ id, data, selected }: SubStoryNodeProps) {
  const activeGraphId = useStoryStore((s) => s.activeGraphId);
  const expandSubStory = useStoryStore((s) => s.expandSubStory);
  const project = useStoryStore((s) => s.project);

  const subGraph = data.subGraphId ? project.graphs[data.subGraphId] : null;
  const nodeCount = subGraph?.nodes.length ?? 0;

  const handleDoubleClick = useCallback(() => {
    if (data.subGraphId) {
      expandSubStory(activeGraphId, id);
    }
  }, [activeGraphId, id, data.subGraphId, expandSubStory]);

  const nodeClasses = [
    'substory-node',
    selected ? 'substory-node--selected' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={nodeClasses} onDoubleClick={handleDoubleClick}>
      <Handle type="target" position={Position.Left} id="in" />

      {/* Header */}
      <div className="node-header">
        <div className="node-header__indicator" style={{ background: 'var(--accent-purple)' }} />
        <span className="node-header__icon">📦</span>
        <span className="node-header__title">{data.title}</span>
      </div>

      {/* Preview */}
      <div className="substory-preview">
        <div className="substory-preview__count">{nodeCount}</div>
        <div className="substory-preview__label">
          scene{nodeCount !== 1 ? 's' : ''} inside
        </div>
        <div className="substory-preview__hint">
          Double-click to open
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
});

export default SubStoryNode;
