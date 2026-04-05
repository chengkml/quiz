import React, { memo } from "react";
import BaseNode from "./BaseNode";
import { NODE_META_MAP } from "../nodeMeta";

export const StartNode = memo((props: any) => (
  <BaseNode {...props} meta={NODE_META_MAP.start} hasInput={false} />
));

export const EndNode = memo((props: any) => (
  <BaseNode {...props} meta={NODE_META_MAP.end} hasOutput={false} />
));

export const LLMNode = memo((props: any) => (
  <BaseNode {...props} meta={NODE_META_MAP.llm} />
));

export const KnowledgeNode = memo((props: any) => (
  <BaseNode {...props} meta={NODE_META_MAP.knowledge} />
));

export const SkillNode = memo((props: any) => (
  <BaseNode {...props} meta={NODE_META_MAP.skill} />
));

export const ConditionNode = memo((props: any) => (
  <BaseNode {...props} meta={NODE_META_MAP.condition} />
));
