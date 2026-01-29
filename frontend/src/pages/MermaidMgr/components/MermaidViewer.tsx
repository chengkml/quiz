import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Spin } from '@arco-design/web-react';

interface MermaidViewerProps {
  code: string;
}

const MermaidViewer: React.FC<MermaidViewerProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  useEffect(() => {
    const render = async () => {
      if (!containerRef.current || !code) return;
      setLoading(true);
      setError(null);
      containerRef.current.innerHTML = '';
      try {
        const id = `mermaid-view-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        if (containerRef.current) {
            containerRef.current.innerHTML = svg;
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Render failed');
      } finally {
        setLoading(false);
      }
    };
    // Delay slightly to ensure container is ready and prevent potential race conditions
    const timer = setTimeout(render, 100);
    return () => clearTimeout(timer);
  }, [code]);

  return (
    <div style={{ padding: 20, textAlign: 'center', minHeight: 200, overflow: 'auto' }}>
       {loading && <Spin />}
       {error && <div style={{color: 'red'}}>{error}</div>}
       <div ref={containerRef} />
    </div>
  );
};
export default MermaidViewer;
