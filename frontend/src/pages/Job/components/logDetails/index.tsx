import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { streamLogs } from '../../api';
import qs from "qs";

interface LogDetailsProps {
  jobId: string;
}

const LogDetails = (props: LogDetailsProps) => {
  const { jobId } = props;
  const [value, setValue] = useState(''); // 初始内容
  const eventSourceRef = useRef<EventSource | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  // 初始化SSE连接
  useEffect(() => {
    // 建立SSE连接
    const eventSource = streamLogs(jobId);
    eventSourceRef.current = eventSource;

    // 监听SSE事件
    eventSource.onmessage = (event) => {
      try {
        const logs = JSON.parse(event.data);
        if (Array.isArray(logs)) {
          // 如果是字符串数组，逐行追加
          setValue((prev) => prev + logs.join('\n') + '\n');
        } else {
          // 否则，直接追加
          setValue((prev) => prev + logs + '\n');
        }
      } catch (error) {
        // 解析失败时，直接追加原始数据
        setValue((prev) => prev + event.data + '\n');
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE连接错误:', error);
      eventSource.close();
    };

    // 组件卸载时关闭连接
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [jobId]);

  return (
      <div
          ref={editorContainerRef}
          style={{
            height: '100%',
            overflowY: 'auto',
            border: '1px solid #ccc',
          }}
      >
        <CodeMirror
            value={value}
            height="100%"
            extensions={[javascript()]}
            editable={false} // 只读
        />
      </div>
  );
};

export default LogDetails;
