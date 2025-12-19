import React, { useEffect, useRef } from 'react';
import { Button, Space } from '@arco-design/web-react';
import './RichTextEditor.less';

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const RichTextEditor: React.FC<Props> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="rte-container">
      <div className="rte-toolbar">
        <Space size="mini">
          <Button type="text" onClick={() => exec('bold')}>加粗</Button>
          <Button type="text" onClick={() => exec('italic')}>斜体</Button>
          <Button type="text" onClick={() => exec('underline')}>下划线</Button>
          <Button type="text" onClick={() => exec('insertUnorderedList')}>• 列表</Button>
          <Button type="text" onClick={() => exec('insertOrderedList')}>1. 列表</Button>
          <Button type="text" onClick={() => {
            const url = prompt('输入链接地址');
            if (url) exec('createLink', url);
          }}>插入链接</Button>
          <Button type="text" onClick={() => exec('removeFormat')}>清除格式</Button>
        </Space>
      </div>
      <div
        ref={editorRef}
        className="rte-editor"
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextEditor;
