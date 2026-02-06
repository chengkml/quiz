import React, { memo } from 'react';
import BaseNode from './BaseNode';

export const StartNode = memo((props: any) => (
  <BaseNode {...props} title="开始" icon="🚀" color="#52c41a" hasInput={false} />
));

export const EndNode = memo((props: any) => (
  <BaseNode {...props} title="结束" icon="🏁" color="#f5222d" hasOutput={false} />
));

export const LLMNode = memo((props: any) => (
  <BaseNode {...props} title="大模型" icon="🤖" color="#165dff" />
));

export const KnowledgeNode = memo((props: any) => (
  <BaseNode {...props} title="知识库" icon="📚" color="#722ed1" />
));

export const SkillNode = memo((props: any) => (
  <BaseNode {...props} title="技能" icon="🛠️" color="#faad14" />
));

export const ConditionNode = memo((props: any) => (
  <BaseNode {...props} title="条件判断" icon="🔀" color="#eb2f96" />
));
