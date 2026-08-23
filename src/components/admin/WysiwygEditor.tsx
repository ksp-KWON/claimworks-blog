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
    <div className="mdxeditor w-full min-w-0" style={{ background: 'transparent', border: 'none', padding: 0 }}>
      <div 
        className="mdxeditor-toolbar w-full min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-1.5" 
        style={{ background: 'transparent', border: 'none', padding: 0 }}
      >
        {/* 1행 (모바일 1단 / 데스크톱 좌측): 서식 & 텍스트 기본 도구 */}
        <div className="flex items-center flex-wrap gap-0.5 sm:gap-1 min-w-0 w-full sm:w-auto">
          <UndoRedo />
          <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700 mx-0.5 shrink-0" />
          <BlockTypeSelect />
          <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700 mx-0.5 shrink-0" />
          <BoldItalicUnderlineToggles />
          <StrikeThroughSupSubToggles />
          <CodeToggle />
        </div>

        {/* 2행 (모바일 2단 / 데스크톱 우측): 리스트 토글 + 요소 삽입 + 소스 토글 */}
        <div className="flex items-center justify-between flex-wrap gap-0.5 sm:gap-1 min-w-0 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-zinc-800">
          <div className="flex items-center flex-wrap gap-0.5 sm:gap-1 min-w-0">
            <ListsToggle />
            <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700 mx-0.5 shrink-0" />
            <CreateLink />
            <InsertImage />
            <InsertTable />
            <InsertThematicBreak />
            <InsertAdmonition />
          </div>
          <div className="flex items-center pl-1 sm:pl-2 ml-auto shrink-0 border-l border-gray-200 dark:border-zinc-700">
            <DiffSourceToggleWrapper>{null}</DiffSourceToggleWrapper>
          </div>
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
        /* 상단 포탈 툴바 내부 최적화 */
        #custom-toolbar-portal .mdxeditor {
          width: 100% !important;
        }
        #custom-toolbar-portal .mdxeditor-toolbar {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          overflow: visible !important;
        }
        #custom-toolbar-portal button {
          min-width: 28px !important;
          height: 28px !important;
          padding: 2px 4px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 2px !important;
          font-size: 12px !important;
          transition: all 0.15s ease !important;
        }
        #custom-toolbar-portal select,
        #custom-toolbar-portal button[role="combobox"] {
          height: 28px !important;
          font-size: 12px !important;
          padding: 0 6px !important;
          max-width: 120px !important;
        }
        /* 모바일 팝업/다이얼로그 레이아웃 안전장치 */
        [data-radix-popper-content-wrapper],
        .mdxeditor-popup-container {
          z-index: 9999 !important;
          max-width: calc(100vw - 20px) !important;
        }
      `}</style>
    </div>
  );
});

WysiwygEditor.displayName = 'WysiwygEditor';

export default WysiwygEditor;
