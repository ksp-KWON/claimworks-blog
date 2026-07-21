import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
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
  BlockTypeSelect,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  jsxPlugin,
  GenericJsxEditor,
  frontmatterPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  StrikeThroughSupSubToggles,
  ListsToggle,
  InsertImage,
  InsertThematicBreak,
  CodeToggle,
  directivesPlugin,
  AdmonitionDirectiveDescriptor,
  InsertAdmonition
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

import { createPortal } from 'react-dom';

const PortalToolbar = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted) return null;
  const portalTarget = document.getElementById('custom-toolbar-portal');
  if (!portalTarget) return null;

  return createPortal(
    <div className="mdxeditor" style={{ background: 'transparent', border: 'none', padding: 0 }}>
      <div className="mdxeditor-toolbar flex items-center gap-1 border-r border-gray-200 dark:border-zinc-700 pr-3 shrink-0" style={{ background: 'transparent', border: 'none', padding: 0 }}>
        <UndoRedo />
        <BlockTypeSelect />
        <BoldItalicUnderlineToggles />
        <StrikeThroughSupSubToggles />
        <CodeToggle />
        <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1"></div>
        <ListsToggle />
        <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1"></div>
        <CreateLink />
        <InsertImage />
        <InsertTable />
        <InsertThematicBreak />
        <InsertAdmonition />
        <div className="ml-auto flex items-center border-l border-gray-200 dark:border-zinc-700 pl-2">
          <DiffSourceToggleWrapper>{null}</DiffSourceToggleWrapper>
        </div>
      </div>
    </div>,
    portalTarget
  );
};

const translateToKorean = (key: string, defaultValue: string) => {
  const dict: Record<string, string> = {
    'Bold': '굵게',
    'Italic': '기울임',
    'Underline': '밑줄',
    'Strikethrough': '취소선',
    'Superscript': '위첨자',
    'Subscript': '아래첨자',
    'Link': '링크',
    'Insert image': '이미지',
    'Insert table': '표',
    'Insert thematic break': '구분선',
    'Code block': '코드 블록',
    'Bullet list': '기호 목록',
    'Numbered list': '번호 목록',
    'Check list': '체크 목록',
    'Paragraph': '본문',
    'Heading 1': '제목 1 (가장 큼)',
    'Heading 2': '제목 2',
    'Heading 3': '제목 3',
    'Heading 4': '제목 4',
    'Heading 5': '제목 5',
    'Heading 6': '제목 6 (가장 작음)',
    'Quote': '인용구',
    'Insert admonition': '알림 박스',
    'Undo': '실행 취소',
    'Redo': '다시 실행',
    'Title': '제목',
    'URL': '주소(URL)',
    'Alt Text': '대체 텍스트',
    'Save': '저장',
    'Cancel': '취소',
    'Source': '소스 코드',
    'Rich Text': '서식 적용',
    'note': '노트',
    'tip': '팁',
    'danger': '위험',
    'info': '정보',
    'caution': '주의',
  };
  return dict[defaultValue] || defaultValue;
};

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
    if (editorRef.current && initialValue !== undefined) {
      const currentMd = editorRef.current.getMarkdown();
      if (currentMd !== (initialValue || '')) {
        editorRef.current.setMarkdown(initialValue || '');
      }
    }
  }, [initialValue]);

  return (
    <div className="mdx-editor-wrapper h-auto flex flex-col prose prose-sm max-w-none dark:prose-invert">
      <MDXEditor
        ref={editorRef}
        markdown={initialValue || ''}
        onChange={onChange}
        translation={translateToKorean}
        contentEditableClassName="prose max-w-none w-full h-auto p-4 outline-none min-h-[500px]"
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
          jsxPlugin({
            jsxComponentDescriptors: [
              {
                name: '*',
                kind: 'text',
                source: '',
                props: [],
                hasChildren: true,
                Editor: GenericJsxEditor
              }
            ]
          }),
          directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
          frontmatterPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'markdown' }),
          codeMirrorPlugin({ codeBlockLanguages: { markdown: 'Markdown', js: 'JavaScript', css: 'CSS', txt: 'Text' } }),
          diffSourcePlugin({ diffMarkdown: 'calc', viewMode: 'rich-text' }),
          toolbarPlugin({
            toolbarContents: () => <PortalToolbar />
          })
        ]}
      />
      <style>{`
        .mdx-editor-wrapper .mdxeditor-toolbar {
          display: none !important;
        }
      `}</style>
    </div>
  );
});

WysiwygEditor.displayName = 'WysiwygEditor';

export default WysiwygEditor;
