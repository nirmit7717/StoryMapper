/**
 * StoryMapper — Labeled Edge
 * 
 * Custom edge that uses smooth step paths. Edge description
 * editing is handled in the sidebar EdgePanel, not inline.
 * If a description exists, shows a small pill label at the midpoint.
 */

import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';

export const LabeledEdge = memo(function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  const label = (data as any)?.label || '';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? 'var(--accent-blue)' : 'var(--text-dim)',
        }}
      />
      {/* Show small pill label if label exists */}
      {label && (
        <EdgeLabelRenderer>
          <div
            className="edge-label"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
          >
            <span>{label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
