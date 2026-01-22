package com.ck.quiz.knowledgeset.service;

import com.ck.quiz.knowledgeset.entity.KnowledgeChunk;
import com.ck.quiz.knowledgeset.dto.VectorSearchDto;
import com.ck.quiz.knowledgeset.dto.VectorSearchResultDto;

import com.ck.quiz.knowledgeset.dto.VectorSearchFilter;

import java.util.List;

public interface VectorService {

    /**
     * 批量切片入库（生成向量并保存）
     *
     * @param chunks    切片列表
     * @param modelName 嵌入模型名称（若为空则使用默认）
     */
    void embedAndStore(List<KnowledgeChunk> chunks, String modelName);

    /**
     * 向量检索
     *
     * @param queryText 查询文本
     * @param limit     返回数量
     * @param modelName 嵌入模型名称（若为空则使用默认）
     * @return 匹配的切片结果（包含相似度分值，如果支持计算）
     */
    List<VectorSearchResultDto> search(String queryText, int limit, String modelName);

    /**
     * 向量检索（带过滤）
     *
     * @param queryText 查询文本
     * @param limit     返回数量
     * @param modelName 嵌入模型名称（若为空则使用默认）
     * @param filter    过滤条件
     * @return 匹配的切片结果
     */
    List<VectorSearchResultDto> search(String queryText, int limit, String modelName, VectorSearchFilter filter);
    
    /**
     * 删除切片及其向量
     * @param chunkIds 切片ID列表
     */
    void deleteChunks(List<String> chunkIds);

    /**
     * 根据知识来源ID删除所有相关切片及向量
     * @param sourceId 知识来源ID
     */
    void deleteBySourceId(String sourceId);
}
