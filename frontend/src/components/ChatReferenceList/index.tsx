import React from 'react';
import { Tag, Typography } from '@arco-design/web-react';

export interface ChatReference {
  knowledgeSetId?: string;
  knowledgeSetName?: string;
  knowledgeSourceId?: string;
  knowledgeSourceName?: string;
  chunkIndex?: number;
  distance?: number;
}

const ChatReferenceList = ({ references }: { references?: ChatReference[] }) => {
  if (!references || references.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 10 }}>
      <Typography.Text
        type="secondary"
        style={{ display: 'block', marginBottom: 6, fontSize: 12 }}
      >
        参考来源
      </Typography.Text>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {references.map((reference, index) => {
          const labelParts = [
            reference.knowledgeSetName,
            reference.knowledgeSourceName,
            reference.chunkIndex !== undefined && reference.chunkIndex !== null
              ? `片段#${reference.chunkIndex}`
              : null,
          ].filter(Boolean);

          const distanceLabel =
            reference.distance !== undefined && reference.distance !== null
              ? ` · Dist ${reference.distance.toFixed(4)}`
              : '';

          return (
            <Tag
              key={`${reference.knowledgeSourceId || 'source'}-${index}`}
              size="small"
              bordered
              style={{ maxWidth: '100%', whiteSpace: 'normal', wordBreak: 'break-all' }}
            >
              {labelParts.join(' / ')}
              {distanceLabel}
            </Tag>
          );
        })}
      </div>
    </div>
  );
};

export default ChatReferenceList;
