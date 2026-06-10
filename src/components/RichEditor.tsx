'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import ImageExt from '@tiptap/extension-image';
import LinkExt from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { useRef, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Image as ImageIcon,
  Undo2, Redo2, Minus,
} from 'lucide-react';

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// ── Toolbar button helper ──────────────────────────────────────────────────
function Btn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`h-7 min-w-[28px] px-1.5 rounded text-sm flex items-center justify-center transition-colors
        ${active
          ? 'bg-[#213885] text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
        ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5 self-center" />;
}

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const imgInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      UnderlineExt,
      ImageExt.configure({ inline: false, allowBase64: false }),
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel:    'noopener noreferrer',
          target: '_blank',
          class:  'text-[#213885] underline',
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder ?? 'Write your article here…' }),
    ],
    content:   value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[320px] px-4 py-3 text-gray-800 text-sm leading-relaxed prose prose-sm max-w-none prose-headings:font-bold prose-a:text-[#213885]',
      },
    },
  });

  // Sync external value changes (e.g. when modal opens with existing post)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value ?? '', { emitUpdate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string ?? '';
    const url  = window.prompt('Enter URL:', prev);
    if (url === null) return; // cancelled
    if (url === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    const toastId = toast.loading('Uploading image…');
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await api.post('/admin/upload/image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      editor?.chain().focus().setImage({ src: res.data.url, alt: file.name.replace(/\.[^.]+$/, '') }).run();
      toast.success('Image inserted', { id: toastId });
    } catch {
      toast.error('Image upload failed', { id: toastId });
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#213885]/30">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-gray-50 sticky top-0 z-10">

        {/* Headings */}
        <Btn title="Heading 1" active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <span className="font-bold text-xs">H1</span>
        </Btn>
        <Btn title="Heading 2" active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <span className="font-bold text-xs">H2</span>
        </Btn>
        <Btn title="Heading 3" active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <span className="font-bold text-xs">H3</span>
        </Btn>

        <Divider />

        {/* Inline formatting */}
        <Btn title="Bold" active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={14} />
        </Btn>
        <Btn title="Italic" active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={14} />
        </Btn>
        <Btn title="Underline" active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline size={14} />
        </Btn>
        <Btn title="Strikethrough" active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={14} />
        </Btn>

        <Divider />

        {/* Lists & blockquote */}
        <Btn title="Bullet List" active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={14} />
        </Btn>
        <Btn title="Numbered List" active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={14} />
        </Btn>
        <Btn title="Blockquote" active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={14} />
        </Btn>
        <Btn title="Horizontal Rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={14} />
        </Btn>

        <Divider />

        {/* Alignment */}
        <Btn title="Align Left" active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft size={14} />
        </Btn>
        <Btn title="Align Center" active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter size={14} />
        </Btn>
        <Btn title="Align Right" active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight size={14} />
        </Btn>

        <Divider />

        {/* Link & Image */}
        <Btn title="Link" active={editor.isActive('link')} onClick={handleLink}>
          <LinkIcon size={14} />
        </Btn>
        <Btn title="Insert Image" onClick={() => imgInputRef.current?.click()}>
          <ImageIcon size={14} />
        </Btn>

        <Divider />

        {/* History */}
        <Btn title="Undo" disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={14} />
        </Btn>
        <Btn title="Redo" disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={14} />
        </Btn>
      </div>

      {/* ── Editor area ── */}
      <EditorContent editor={editor} className="bg-white" />

      {/* Hidden image file input */}
      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) { handleImageUpload(f); e.target.value = ''; } }}
      />
    </div>
  );
}
