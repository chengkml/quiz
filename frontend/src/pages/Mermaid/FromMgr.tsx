import React, { useEffect, useState } from 'react';
import { Spin, Message } from '@arco-design/web-react';
import { useParams } from 'react-router-dom';
import MermaidEditor from './index';
import { getMermaidDiagram } from '@/pages/MermaidMgr/api';

const MermaidFromMgr: React.FC = () => {
  const { id } = useParams();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await getMermaidDiagram(id);
        if (res?.data) {
          setCode(res.data.diagramData || '');
        }
      } catch (err) {
        Message.error('获取思维图失败');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <div style={{padding: 40, textAlign: 'center'}}><Spin /></div>;

  return <MermaidEditor initialCode={code} />;
};

export default MermaidFromMgr;
