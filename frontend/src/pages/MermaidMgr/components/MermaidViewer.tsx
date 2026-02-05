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
    <div className="mermaid-viewer-wrapper" style={{ 
      padding: '24px', 
      textAlign: 'center', 
      minHeight: '300px', 
      overflow: 'auto',
      background: '#f8f9fa',
      backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      borderRadius: '12px',
      border: '1px solid #f0f0f0',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
       {loading && (
         <div style={{ position: 'absolute', zIndex: 10 }}>
           <Spin size={32} tip="正在渲染流程图..." />
         </div>
       )}
       {error && (
         <div style={{ 
           color: '#f53f3f', 
           background: '#fff2f0', 
           padding: '12px 20px', 
           borderRadius: '8px',
           border: '1px solid #ffccc7',
           fontSize: '14px'
         }}>
           <strong>渲染失败:</strong> {error}
         </div>
       )}
       <div 
         ref={containerRef} 
         style={{ 
           maxWidth: '100%', 
           opacity: loading ? 0.3 : 1,
           transition: 'opacity 0.3s ease'
         }} 
       />
    </div>
  );
};
export default MermaidViewer;
