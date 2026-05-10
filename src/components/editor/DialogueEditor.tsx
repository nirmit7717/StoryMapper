/**
 * StoryMapper — Dialogue Editor
 * 
 * Structured dialogue subsection within ScriptEditorNodes.
 * Each line has Character, Parenthetical, and Line Content.
 */

import { memo, useCallback } from 'react';
import type { DialogueLine } from '../../types/story';
import { useStoryStore } from '../../store/useStoryStore';

interface DialogueEditorProps {
  graphId: string;
  nodeId: string;
  dialogue: DialogueLine[];
}

export const DialogueEditor = memo(function DialogueEditor({
  graphId,
  nodeId,
  dialogue,
}: DialogueEditorProps) {
  const addDialogueLine = useStoryStore((s) => s.addDialogueLine);
  const removeDialogueLine = useStoryStore((s) => s.removeDialogueLine);
  const updateDialogueLine = useStoryStore((s) => s.updateDialogueLine);

  const handleAdd = useCallback(() => {
    addDialogueLine(graphId, nodeId);
  }, [graphId, nodeId, addDialogueLine]);

  return (
    <div className="node-section">
      <div className="node-section__header">
        <span className="node-section__icon">💬</span>
        DIALOGUE
        <span className="badge badge--purple" style={{ marginLeft: 'auto' }}>
          {dialogue.length}
        </span>
      </div>
      <div className="node-section__content nowheel nodrag">
        <div className="dialogue-list">
          {dialogue.map((line) => (
            <DialogueLineItem
              key={line.id}
              line={line}
              graphId={graphId}
              nodeId={nodeId}
              onUpdate={updateDialogueLine}
              onRemove={removeDialogueLine}
            />
          ))}
          <button type="button" className="dialogue-add-btn" onClick={handleAdd}>
            + Add Dialogue Line (Ctrl+D)
          </button>
        </div>
      </div>
    </div>
  );
});

interface DialogueLineItemProps {
  line: DialogueLine;
  graphId: string;
  nodeId: string;
  onUpdate: (graphId: string, nodeId: string, lineId: string, patch: Partial<DialogueLine>) => void;
  onRemove: (graphId: string, nodeId: string, lineId: string) => void;
}

function DialogueLineItem({ line, graphId, nodeId, onUpdate, onRemove }: DialogueLineItemProps) {
  return (
    <div className="dialogue-line">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <input
          className="dialogue-line__character"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            width: '100%',
            fontFamily: 'var(--font-screenplay)',
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            color: 'var(--accent-amber)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
          value={line.character}
          onChange={(e) => onUpdate(graphId, nodeId, line.id, { character: e.target.value.toUpperCase() })}
          placeholder="CHARACTER NAME"
        />
        <button
          type="button"
          className="btn btn--ghost btn--icon"
          onClick={() => onRemove(graphId, nodeId, line.id)}
          title="Remove line"
          style={{ flexShrink: 0, fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}
        >
          ✕
        </button>
      </div>
      <input
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          width: '100%',
          fontFamily: 'var(--font-screenplay)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          marginBottom: '2px',
        }}
        value={line.parenthetical}
        onChange={(e) => {
          let val = e.target.value;
          // Auto-wrap in parentheses
          if (val && !val.startsWith('(')) val = '(' + val;
          if (val && !val.endsWith(')') && val.length > 1) val = val + ')';
          onUpdate(graphId, nodeId, line.id, { parenthetical: val });
        }}
        placeholder="(parenthetical)"
      />
      <input
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          width: '100%',
          fontFamily: 'var(--font-screenplay)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-primary)',
          lineHeight: 1.6,
        }}
        value={typeof line.lineContent === 'string' ? line.lineContent : ''}
        onChange={(e) => onUpdate(graphId, nodeId, line.id, { lineContent: e.target.value as any })}
        placeholder="Dialogue line..."
      />
    </div>
  );
}
