package com.ck.quiz.knowledgeset.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceCreateDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceQueryDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceUpdateDto;
import com.ck.quiz.knowledgeset.entity.KnowledgeSource;

public interface KnowledgeSourceService extends
        BaseService<KnowledgeSourceCreateDto, KnowledgeSourceUpdateDto, KnowledgeSourceQueryDto, KnowledgeSourceDto, KnowledgeSource> {
    void testConnection(String type, String content) throws Exception;

    /**
     * 删除指定知识集下全部来源（包含向量/切片清理）
     *
     * @param userId          当前用户
     * @param knowledgeSetId  知识集ID
     */
    void deleteByKnowledgeSetId(String userId, String knowledgeSetId);
}
