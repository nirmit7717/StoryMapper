/**
 * StoryMapper — Rich Text Editor (TipTap)
 * 
 * Embedded screenplay-aware rich text editor for ScriptEditorNodes.
 * Supports industry-standard formatting with keyboard shortcuts.
 * 
 * Shortcuts use Alt+ prefix to avoid Chrome conflicts:
 *   Alt+1 = Scene Heading
 *   Alt+2 = Action
 *   Alt+3 = Dialogue
 *   Alt+4 = Transition
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Extension } from '@tiptap/core';

import { memo, useCallback, useEffect, useRef } from 'react';
import type { JSONContent } from '@tiptap/react';

interface RichTextEditorProps {
  content: JSONContent;
  onChange: (content: JSONContent) => void;
  placeholder?: string;
  editable?: boolean;
}

/**
 * Custom TipTap extension for screenplay keyboard shortcuts.
 * Uses Alt+ key combos to avoid conflicting with Chrome's Ctrl+1..4 (tab switching).
 */
const ScreenplayShortcuts = Extension.create({
  name: 'screenplayShortcuts',

  addKeyboardShortcuts() {
    return {
      // Alt+1 = Scene Heading
      'Alt-1': ({ editor }) => {
        editor.chain().focus().toggleHeading({ level: 1 }).setTextAlign('left').run();
        return true;
      },
      // Alt+2 = Action (plain paragraph, left-aligned)
      'Alt-2': ({ editor }) => {
        editor.chain().focus().setParagraph().setTextAlign('left').run();
        return true;
      },
      // Alt+3 = Dialogue (centered paragraph)
      'Alt-3': ({ editor }) => {
        editor.chain().focus().setParagraph().setTextAlign('center').run();
        return true;
      },
      // Alt+4 = Transition (right-aligned paragraph)
      'Alt-4': ({ editor }) => {
        editor.chain().focus().setParagraph().setTextAlign('right').run();
        return true;
      },
    };
  },
});

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
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder }),
      ScreenplayShortcuts,
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

  // Sync content from store when `content` prop changes (e.g. switching nodes)
  useEffect(() => {
    if (!editor) return;
    // Only update if the incoming content differs from the current editor content.
    // This prevents cursor-jumps while the user is actively typing.
    const currentJSON = JSON.stringify(editor.getJSON());
    const incomingJSON = JSON.stringify(content);
    if (currentJSON !== incomingJSON) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="node-script nowheel nodrag">
      <EditorToolbarCompact editor={editor} />
      <div className="script-panel__editor-scroll">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

/** Compact inline toolbar shown inside the script section — sticky */
function EditorToolbarCompact({ editor }: { editor: any }) {
  return (
    <div className="editor-toolbar editor-toolbar--sticky">
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
        <option value="scene">🎬 Scene Heading </option>
        <option value="action">📝 Action </option>
        <option value="dialogue">💬 Dialogue </option>
        <option value="transition">➡️ Transition </option>
      </select>
    </div>
  );
}
