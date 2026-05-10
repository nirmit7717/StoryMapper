/**
 * StoryMapper — Rich Text Editor (TipTap)
 * 
 * Embedded screenplay-aware rich text editor for ScriptEditorNodes.
 * Supports industry-standard formatting with keyboard shortcuts.
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';

import { memo, useCallback, useRef } from 'react';
import type { JSONContent } from '@tiptap/react';

interface RichTextEditorProps {
  content: JSONContent;
  onChange: (content: JSONContent) => void;
  placeholder?: string;
  editable?: boolean;
}

export const RichTextEditor = memo(function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write your scene here...',
  editable = true,
}: RichTextEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleUpdate = useCallback(({ editor }: any) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(editor.getJSON());
    }, 300);
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable,
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="node-script nowheel nodrag">
      <EditorToolbarCompact editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
});

/** Compact inline toolbar shown inside the node */
function EditorToolbarCompact({ editor }: { editor: any }) {
  return (
    <div className="editor-toolbar">
      <button
        type="button"
        className={`editor-toolbar__btn ${editor.isActive('bold') ? 'editor-toolbar__btn--active' : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        className={`editor-toolbar__btn ${editor.isActive('italic') ? 'editor-toolbar__btn--active' : ''}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        className={`editor-toolbar__btn ${editor.isActive('underline') ? 'editor-toolbar__btn--active' : ''}`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      >
        <u>U</u>
      </button>
      <div className="editor-toolbar__separator" />
      <select
        className="editor-toolbar__select"
        value={
          editor.isActive('heading', { level: 1 }) ? 'scene' :
          editor.isActive({ textAlign: 'center' }) ? 'dialogue' :
          editor.isActive({ textAlign: 'right' }) ? 'transition' :
          'action'
        }
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'scene') {
            editor.chain().focus().toggleHeading({ level: 1 }).setTextAlign('left').run();
          } else if (val === 'action') {
            editor.chain().focus().setParagraph().setTextAlign('left').run();
          } else if (val === 'dialogue') {
            editor.chain().focus().setParagraph().setTextAlign('center').run();
          } else if (val === 'transition') {
            editor.chain().focus().setParagraph().setTextAlign('right').run();
          }
        }}
      >
        <option value="scene">🎬 Scene Heading</option>
        <option value="action">📝 Action</option>
        <option value="dialogue">💬 Dialogue</option>
        <option value="transition">➡️ Transition</option>
      </select>
    </div>
  );
}
