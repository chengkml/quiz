import {
  getMyCreatedKnowledgeSets,
  getMyJoinedKnowledgeSets,
} from '@/pages/KnowledgeSet/api';

export const ALL_SCOPE_VALUE = '__ALL_ACCESSIBLE__';

export interface KnowledgeSetOption {
  id: string;
  name: string;
}

export const getAccessibleKnowledgeSetOptions = async (): Promise<KnowledgeSetOption[]> => {
  const params = {
    pageNum: 0,
    pageSize: 200,
    status: 'ENABLED',
  };

  const [createdRes, joinedRes] = await Promise.all([
    getMyCreatedKnowledgeSets(params),
    getMyJoinedKnowledgeSets(params),
  ]);

  const merged = new Map<string, KnowledgeSetOption>();
  const appendOptions = (items: any[] = []) => {
    items.forEach((item) => {
      if (item?.id && item?.name && !merged.has(item.id)) {
        merged.set(item.id, {
          id: item.id,
          name: item.name,
        });
      }
    });
  };

  appendOptions(createdRes.data?.content || []);
  appendOptions(joinedRes.data?.content || []);

  return Array.from(merged.values());
};

export const getKnowledgeScopeLabel = (
  scopeValue: string,
  knowledgeSetOptions: KnowledgeSetOption[]
) => {
  if (scopeValue === ALL_SCOPE_VALUE) {
    return '全部知识集';
  }
  return knowledgeSetOptions.find((item) => item.id === scopeValue)?.name || '指定知识集';
};

export const buildKnowledgeScopePayload = (scopeValue: string) => ({
  knowledgeScopeType: scopeValue === ALL_SCOPE_VALUE ? 'ALL_ACCESSIBLE' : 'KNOWLEDGE_SET',
  knowledgeSetId: scopeValue === ALL_SCOPE_VALUE ? undefined : scopeValue,
});
