import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  MDXEditor, 
  MDXEditorMethods,
  headingsPlugin, 
  quotePlugin, 
  listsPlugin, 
  thematicBreakPlugin, 
  markdownShortcutPlugin, 
  toolbarPlugin, 
  UndoRedo, 
  BoldItalicUnderlineToggles, 
  linkPlugin, 
  linkDialogPlugin,
  CreateLink, 
  imagePlugin, 
  tablePlugin,
  InsertTable,
  BlockTypeSelect
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

interface WysiwygEditorProps {
  initialValue: string;
  onChange: (markdown: string) => void;
}

export interface WysiwygEditorRef {
  insertText: (text: string) => void;
  setMarkdown: (markdown: string) => void;
  getMarkdown: () => string;
}

const WysiwygEditor = forwardRef<WysiwygEditorRef, WysiwygEditorProps>(({ initialValue, onChange }, ref) => {
  const editorRef = useRef<MDXEditorMethods>(null);

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      editorRef.current?.insertMarkdown(text);
      editorRef.current?.focus();
    },
    setMarkdown: (markdown: string) => {
      editorRef.current?.setMarkdown(markdown);
    },
    getMarkdown: () => {
      return editorRef.current?.getMarkdown() || '';
    }
  }));

  // 외부 데이터 로딩 등으로 initialValue가 크게 변할 때
  useEffect(() => {
    if (editorRef.current && initialValue) {
      const currentMd = editorRef.current.getMarkdown();
      if (currentMd !== initialValue) {
        editorRef.current.setMarkdown(initialValue);
      }
    }
  }, [initialValue]);

  return (
    <div className="mdx-editor-wrapper h-full flex flex-col prose prose-sm max-w-none dark:prose-invert">
      <MDXEditor
        ref={editorRef}
        markdown={initialValue || ''}
        onChange={onChange}
        contentEditableClassName="prose max-w-none w-full h-full p-4 outline-none min-h-[500px]"
        plugins={[
          headingsPlugin(),
          quotePlugin(),
          listsPlugin(),
          thematicBreakPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin(),
          tablePlugin(),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <div className="flex items-center gap-2 flex-wrap">
                <UndoRedo />
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                <CreateLink />
                <InsertTable />
              </div>
            )
          })
        ]}
      />
      <style>{`
        .mdx-editor-wrapper .mdxeditor {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .mdx-editor-wrapper .mdxeditor-toolbar {
          flex-shrink: 0;
          background: transparent !important;
          border-bottom: none !important;
          padding: 8px 24px !important;
        }
        .mdx-editor-wrapper [data-lexical-editor] {
          flex: 1;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
});

WysiwygEditor.displayName = 'WysiwygEditor';

export default WysiwygEditor;
