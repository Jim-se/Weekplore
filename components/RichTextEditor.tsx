import { Image as ImageIcon } from 'lucide-react';
import ImageExtension from '@tiptap/extension-image';
import React, { useEffect, useId, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color, FontFamily, TextStyle } from '@tiptap/extension-text-style';
import { Placeholder } from '@tiptap/extensions';
import { Bold, Eye, Italic, Palette, Type as TypeIcon, X } from 'lucide-react';
import { normalizeRichTextForEditor } from '../lib/richText';
import RichTextContent from './RichTextContent';

const SANS_SERIF_FONT = 'Inter, sans-serif';
const BLACK_TEXT = '#111111';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  onImageUpload?: (file: File) => Promise<string>;
  imageLabel?: string;
}

const getEditorValue = (editor: NonNullable<ReturnType<typeof useEditor>>) =>
  editor.isEmpty ? '' : editor.getHTML();

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = 'Detailed experience description...',
  minHeight = 150,
  onImageUpload,
  imageLabel = 'Insert image',
}) => {
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState('');
  const imageInput = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const previewCloseButtonRef = useRef<HTMLButtonElement>(null);
  const previewTitleId = useId();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [, refreshToolbar] = useReducer((count) => count + 1, 0);

  useEffect(() => {
    onChangeRef.current = onChange;
    onBlurRef.current = onBlur;
  }, [onChange, onBlur]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        link: false,
        listItem: false,
        listKeymap: false,
        orderedList: false,
        strike: false,
        trailingNode: false,
        underline: false,
      }),
      ...(onImageUpload ? [ImageExtension.configure({ allowBase64: false, resize: { enabled: true, directions: ['bottom-left', 'bottom-right', 'top-left', 'top-right'], minWidth: 60, minHeight: 40, alwaysPreserveAspectRatio: true }, HTMLAttributes: { style: 'max-width:100%;height:auto;display:block;margin:16px auto' } })] : []),
      TextStyle,
      Color,
      FontFamily,
      Placeholder.configure({ placeholder }),
    ],
    content: normalizeRichTextForEditor(value),
    editorProps: {
      attributes: {
        class: 'rich-text-editor__content',
        'aria-label': 'Full event description',
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChangeRef.current(getEditorValue(updatedEditor));
      refreshToolbar();
    },
    onSelectionUpdate: refreshToolbar,
    onTransaction: refreshToolbar,
  });

  useEffect(() => {
    if (!editor || editor.isFocused) return;

    const nextContent = normalizeRichTextForEditor(value);
    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!isPreviewOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    previewCloseButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPreviewOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPreviewOpen]);

  const selectedFont = editor?.getAttributes('textStyle').fontFamily?.toLowerCase().includes('inter')
    ? 'sans'
    : 'current';
  const selectedColor = editor?.getAttributes('textStyle').color?.toLowerCase() === BLACK_TEXT
    ? 'black'
    : 'current';

  const keepSelection = (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault();
  const previewValue = editor ? getEditorValue(editor) : value;

  const runEditorCommand = (command: () => void) => {
    command();
    refreshToolbar();
  };

  return (
    <div
      className="rich-text-editor"
      style={{ '--rich-text-min-height': `${minHeight}px` } as React.CSSProperties}
      onBlur={(event) => {
        if (!editor || event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        onBlurRef.current?.(getEditorValue(editor));
        refreshToolbar();
      }}
    >
      <style>{`
        .rich-text-editor__content [data-resize-handle] { width: 12px; height: 12px; border: 2px solid white; border-radius: 3px; background: #c6a046; box-shadow: 0 0 0 1px #4b3d2e55; z-index: 5; touch-action: none; }
        .rich-text-editor__content [data-resize-handle="top-left"], .rich-text-editor__content [data-resize-handle="bottom-right"] { cursor: nwse-resize; }
        .rich-text-editor__content [data-resize-handle="top-right"], .rich-text-editor__content [data-resize-handle="bottom-left"] { cursor: nesw-resize; }
      `}</style>
      <div className="rich-text-editor__toolbar" role="toolbar" aria-label="Description formatting">
        {onImageUpload && <><button type="button" className="rich-text-editor__button" disabled={imageBusy || !editor} title={imageLabel} aria-label={imageLabel} onMouseDown={keepSelection} onClick={() => imageInput.current?.click()}>{imageBusy ? '…' : <ImageIcon size={18} aria-hidden="true" />}</button><input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async event => {
          const file = event.target.files?.[0]; event.target.value = '';
          if (!file || !editor) return;
          const position = editor.state.selection.from;
          setImageBusy(true); setImageError('');
          try { const src = await onImageUpload(file); editor.chain().focus().insertContentAt(Math.min(position, editor.state.doc.content.size), [{ type: 'image', attrs: { src, alt: file.name.replace(/\.[^.]+$/, '') } }, { type: 'paragraph' }]).run(); }
          catch (error) { setImageError(error instanceof Error ? error.message : 'Image upload failed'); }
          finally { setImageBusy(false); }
        }} /></>}
        {imageError && <span role="alert" className="text-xs text-red-700">{imageError}</span>}
        <div className="rich-text-editor__button-group" aria-label="Text style">
          <button
            type="button"
            className="rich-text-editor__button"
            data-active={editor?.isActive('bold') || undefined}
            aria-label="Bold"
            aria-pressed={editor?.isActive('bold') || false}
            disabled={!editor}
            onMouseDown={keepSelection}
            onClick={() => runEditorCommand(() => {
              editor?.chain().focus().toggleBold().run();
            })}
          >
            <Bold aria-hidden="true" size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="rich-text-editor__button"
            data-active={editor?.isActive('italic') || undefined}
            aria-label="Italic"
            aria-pressed={editor?.isActive('italic') || false}
            disabled={!editor}
            onMouseDown={keepSelection}
            onClick={() => runEditorCommand(() => {
              editor?.chain().focus().toggleItalic().run();
            })}
          >
            <Italic aria-hidden="true" size={18} strokeWidth={2} />
          </button>
        </div>

        <label className="rich-text-editor__select-control">
          <TypeIcon aria-hidden="true" size={17} strokeWidth={2} />
          <span className="sr-only">Font</span>
          <select
            aria-label="Font"
            value={selectedFont}
            disabled={!editor}
            onChange={(event) => {
              runEditorCommand(() => {
                if (event.target.value === 'sans') {
                  editor?.chain().focus().setFontFamily(SANS_SERIF_FONT).run();
                } else {
                  editor?.chain().focus().unsetFontFamily().removeEmptyTextStyle().run();
                }
              });
            }}
          >
            <option value="current">Current</option>
            <option value="sans">Sans serif</option>
          </select>
        </label>

        <label className="rich-text-editor__select-control">
          <Palette aria-hidden="true" size={17} strokeWidth={2} />
          <span className="sr-only">Text color</span>
          <select
            aria-label="Text color"
            value={selectedColor}
            disabled={!editor}
            onChange={(event) => {
              runEditorCommand(() => {
                if (event.target.value === 'black') {
                  editor?.chain().focus().setColor(BLACK_TEXT).run();
                } else {
                  editor?.chain().focus().unsetColor().removeEmptyTextStyle().run();
                }
              });
            }}
          >
            <option value="current">Brown</option>
            <option value="black">Black</option>
          </select>
        </label>

        <button
          type="button"
          className="rich-text-editor__button rich-text-editor__preview-button"
          aria-haspopup="dialog"
          onMouseDown={keepSelection}
          onClick={() => setIsPreviewOpen(true)}
        >
          <Eye aria-hidden="true" size={17} strokeWidth={2} />
          <span>Preview</span>
        </button>
      </div>

      <EditorContent editor={editor} />

      {isPreviewOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="rich-text-preview__backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsPreviewOpen(false);
          }}
        >
          <section
            className="rich-text-preview__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={previewTitleId}
          >
            <header className="rich-text-preview__header">
              <h2 id={previewTitleId}>Description preview</h2>
              <button
                ref={previewCloseButtonRef}
                type="button"
                className="rich-text-preview__close"
                aria-label="Close preview"
                onClick={() => setIsPreviewOpen(false)}
              >
                <X aria-hidden="true" size={20} strokeWidth={2} />
              </button>
            </header>

            <div className="rich-text-preview__body">
              {previewValue ? (
                <RichTextContent
                  value={previewValue}
                  className="event-description-font text-xl font-light leading-relaxed text-brand-text/80 sm:text-2xl md:text-3xl"
                />
              ) : (
                <p className="rich-text-preview__empty">Nothing to preview yet.</p>
              )}
            </div>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default RichTextEditor;
