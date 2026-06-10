'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { useEffect } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Link2,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Heading1, Heading2, Heading3,
  Undo, Redo, Minus,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing page content…',
  minHeight = 320,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-[#213885] underline' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  });

  // Sync external value changes (e.g. when switching pages in the modal)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value ?? '', { emitUpdate: false });
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;

  const Btn = ({
    active,
    onClick,
    title,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-[#213885] text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );

  const Divider = () => <span className="w-px h-5 bg-gray-200 mx-0.5 self-center inline-block" />;

  const handleLink = () => {
    const prev = editor.getAttributes('link').href ?? '';
    const url = window.prompt('Enter URL:', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="border border-[#cccacc] rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-[#ecdfd2] border-b border-[#cccacc]">
        <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="w-4 h-4" />
        </Btn>
        <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="w-4 h-4" />
        </Btn>
        <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <UnderlineIcon className="w-4 h-4" />
        </Btn>

        <Divider />

        <Btn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
          <Heading1 className="w-4 h-4" />
        </Btn>
        <Btn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
          <Heading2 className="w-4 h-4" />
        </Btn>
        <Btn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
          <Heading3 className="w-4 h-4" />
        </Btn>

        <Divider />

        <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
          <List className="w-4 h-4" />
        </Btn>
        <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
          <ListOrdered className="w-4 h-4" />
        </Btn>

        <Divider />

        <Btn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align left">
          <AlignLeft className="w-4 h-4" />
        </Btn>
        <Btn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align center">
          <AlignCenter className="w-4 h-4" />
        </Btn>
        <Btn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align right">
          <AlignRight className="w-4 h-4" />
        </Btn>

        <Divider />

        <Btn active={editor.isActive('link')} onClick={handleLink} title="Insert / edit link">
          <Link2 className="w-4 h-4" />
        </Btn>
        <Btn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
          <Minus className="w-4 h-4" />
        </Btn>

        <Divider />

        <Btn active={false} onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo className="w-4 h-4" />
        </Btn>
        <Btn active={false} onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo className="w-4 h-4" />
        </Btn>
      </div>

      {/* Content area */}
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="
          p-4 text-sm leading-relaxed overflow-y-auto
          prose-policy
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror]:min-h-[inherit]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0
        "
      />
    </div>
  );
}
