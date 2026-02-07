package com.ck.quiz.tokenusage.service;

import com.ck.quiz.tokenusage.dto.TokenUsageQueryDto;
import com.ck.quiz.tokenusage.dto.TokenUsageRecordDto;
import com.ck.quiz.tokenusage.dto.TokenUsageStatDto;
import org.springframework.ai.chat.metadata.ChatResponseMetadata;

import java.util.List;

public interface TokenUsageService {

    /**
     * 记录token使用情况
     *
     * @param modelName      模型名称
     * @param modelProvider  模型提供商
     * @param metadata       响应元数据
     * @param businessType   业务类型
     * @param businessId     业务ID
     * @param sessionId      会话ID
     * @param requestContent 请求内容（可选）
     * @param responseContent响应内容（可选）
     * @param userId         用户ID
     */
    void recordUsage(String modelName, String modelProvider, ChatResponseMetadata metadata,
                    String businessType, String businessId, String sessionId,
                    String requestContent, String responseContent, String userId);

    /**
     * 记录token使用情况（简化版，从模型名自动查询价格）
     *
     * @param modelName       模型名称
     * @param promptTokens    输入token数
     * @param completionTokens输出token数
     * @param businessType    业务类型
     * @param businessId      业务ID
     * @param sessionId       会话ID
     * @param userId          用户ID
     */
    void recordUsage(String modelName, Integer promptTokens, Integer completionTokens,
                    String businessType, String businessId, String sessionId, String userId);

    /**
     * 记录错误
     *
     * @param modelName    模型名称
     * @param businessType 业务类型
     * @param businessId   业务ID
     * @param sessionId    会话ID
     * @param errorMessage 错误信息
     * @param userId       用户ID
     */
    void recordError(String modelName, String businessType, String businessId,
                    String sessionId, String errorMessage, String userId);

    /**
     * 查询token使用统计
     *
     * @param queryDto 查询条件
     * @return 统计结果列表
     */
    List<TokenUsageStatDto> queryStatistics(TokenUsageQueryDto queryDto);

    /**
     * 查询token使用记录列表
     *
     * @param queryDto 查询条件
     * @return 记录列表
     */
    List<TokenUsageRecordDto> queryRecords(TokenUsageQueryDto queryDto);

    /**
     * 根据会话ID查询token使用记录
     *
     * @param sessionId 会话ID
     * @return 记录列表
     */
    List<TokenUsageRecordDto> queryBySessionId(String sessionId);
}
