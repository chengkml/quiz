import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { getTrainningLog } from './api';
import qs from "qs";

interface LogDetailsProps {
  jobId: string;
}

const LogDetails = (props: LogDetailsProps) => {
  const { jobId } = props;
  const [value, setValue] = useState(''); // 初始内容
  const [pageNum, setPageNum] = useState(1);
  const [isEnd, setIsEnd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  const pageSize = 100; // 每次请求的日志条数

  // 请求日志
  const fetchLogs = async (page: number) => {
    if (isLoading || isEnd) return ''; // 如果正在加载或已结束，直接返回
    setIsLoading(true);
    try {
      const params = {
        jobId,
        offset: (page - 1) * pageSize,
        limit: pageSize,
      };

      const res = await getTrainningLog(params);
      let targetLog = '';
      res.data?.forEach((row: string) => {
        targetLog += row + '\n';
      });

      if (!targetLog) {
        setIsEnd(true);
        return '';
      }
      return targetLog;
    } catch (err) {
      console.error('加载日志失败:', err);
      return '';
    } finally {
      setIsLoading(false); // 请求完成时释放锁
    }
  };

  // 首次加载第一页日志
  useEffect(() => {
    (async () => {
      const firstLogs = await fetchLogs(1);
      if (firstLogs) {
        setValue(firstLogs);
      }
    })();
  }, []);

  // 监听滚动事件
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const handleScroll = async (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollBottom =
          target.scrollHeight - target.scrollTop - target.clientHeight;

      if (scrollBottom <= 1 && !isEnd && !isLoading) {
        const nextPage = pageNum + 1;
        const newLogs = await fetchLogs(nextPage);
        if (newLogs) {
          setValue((prev) => prev + newLogs);
          setPageNum(nextPage);
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [pageNum, isEnd, isLoading]);

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
