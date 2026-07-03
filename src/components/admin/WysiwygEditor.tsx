import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';

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
  const editorRef = useRef<Editor>(null);

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      editorRef.current?.getInstance().insertText(text);
    },
    setMarkdown: (markdown: string) => {
      editorRef.current?.getInstance().setMarkdown(markdown);
    },
    getMarkdown: () => {
      return editorRef.current?.getInstance().getMarkdown() || '';
    }
  }));

  // 외부(AI 생성, 파일 불러오기 등)에서 initialValue가 통째로 바뀌면 에디터 내용도 업데이트
  useEffect(() => {
    if (editorRef.current && initialValue) {
      const currentMd = editorRef.current.getInstance().getMarkdown();
      if (currentMd !== initialValue) {
        editorRef.current.getInstance().setMarkdown(initialValue);
      }
    }
  }, [initialValue]);

  return (
    <Editor
      ref={editorRef}
      initialValue={initialValue}
      previewStyle="vertical"
      height="100%"
      initialEditType="wysiwyg"
      useCommandShortcut={true}
      onChange={() => {
        if (editorRef.current) {
          onChange(editorRef.current.getInstance().getMarkdown());
        }
      }}
      toolbarItems={[
        ['heading', 'bold', 'italic', 'strike'],
        ['hr', 'quote'],
        ['ul', 'ol', 'task', 'indent', 'outdent'],
        ['table', 'image', 'link'],
        ['code', 'codeblock']
      ]}
    />
  );
});

WysiwygEditor.displayName = 'WysiwygEditor';

export default WysiwygEditor;
