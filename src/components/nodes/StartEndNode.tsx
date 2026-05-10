/**
 * StoryMapper — Start/End Nodes
 * 
 * Simple terminal nodes marking story entry and exit points.
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeData } from '../../types/story';

type StartEndNodeProps = NodeProps & { data: NodeData };

export const StartNode = memo(function StartNode({ data }: StartEndNodeProps) {
  return (
    <div className="start-node">
      <span>▶ {data.title || 'Start'}</span>
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
});

export const EndNode = memo(function EndNode({ data }: StartEndNodeProps) {
  return (
    <div className="end-node">
      <Handle type="target" position={Position.Left} id="in" />
      <span>■ {data.title || 'End'}</span>
    </div>
  );
});
