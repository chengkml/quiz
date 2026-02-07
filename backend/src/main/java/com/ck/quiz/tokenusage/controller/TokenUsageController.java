package com.ck.quiz.tokenusage.controller;

import com.ck.quiz.tokenusage.dto.TokenUsageQueryDto;
import com.ck.quiz.tokenusage.dto.TokenUsageRecordDto;
import com.ck.quiz.tokenusage.dto.TokenUsageStatDto;
import com.ck.quiz.tokenusage.service.TokenUsageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/token-usage")
@RequiredArgsConstructor
public class TokenUsageController {

    private final TokenUsageService tokenUsageService;

    /**
     * 查询token使用统计
     *
     * @param queryDto 查询条件
     * @param authentication 认证信息
     * @return 统计结果
     */
    @PostMapping("/statistics")
    public ResponseEntity<List<TokenUsageStatDto>> queryStatistics(
            @RequestBody TokenUsageQueryDto queryDto,
            Authentication authentication) {
        
        // 如果不是管理员，只能查询自己的数据
        if (authentication != null && queryDto.getUserId() == null) {
            queryDto.setUserId(authentication.getName());
        }
        
        List<TokenUsageStatDto> stats = tokenUsageService.queryStatistics(queryDto);
        return ResponseEntity.ok(stats);
    }

    /**
     * 查询token使用记录列表
     *
     * @param queryDto 查询条件
     * @param authentication 认证信息
     * @return 记录列表
     */
    @PostMapping("/records")
    public ResponseEntity<List<TokenUsageRecordDto>> queryRecords(
            @RequestBody TokenUsageQueryDto queryDto,
            Authentication authentication) {
        
        // 如果不是管理员，只能查询自己的数据
        if (authentication != null && queryDto.getUserId() == null) {
            queryDto.setUserId(authentication.getName());
        }
        
        List<TokenUsageRecordDto> records = tokenUsageService.queryRecords(queryDto);
        return ResponseEntity.ok(records);
    }

    /**
     * 根据会话ID查询token使用记录
     *
     * @param sessionId 会话ID
     * @return 记录列表
     */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<TokenUsageRecordDto>> queryBySessionId(@PathVariable String sessionId) {
        List<TokenUsageRecordDto> records = tokenUsageService.queryBySessionId(sessionId);
        return ResponseEntity.ok(records);
    }

    /**
     * 获取自己的token使用统计（按模型）
     *
     * @param authentication 认证信息
     * @return 统计结果
     */
    @GetMapping("/my-statistics/by-model")
    public ResponseEntity<List<TokenUsageStatDto>> getMyStatisticsByModel(Authentication authentication) {
        TokenUsageQueryDto queryDto = new TokenUsageQueryDto();
        queryDto.setStatType("model");
        if (authentication != null) {
            queryDto.setUserId(authentication.getName());
        }
        List<TokenUsageStatDto> stats = tokenUsageService.queryStatistics(queryDto);
        return ResponseEntity.ok(stats);
    }

    /**
     * 获取自己的token使用统计（按业务类型）
     *
     * @param authentication 认证信息
     * @return 统计结果
     */
    @GetMapping("/my-statistics/by-business")
    public ResponseEntity<List<TokenUsageStatDto>> getMyStatisticsByBusiness(Authentication authentication) {
        TokenUsageQueryDto queryDto = new TokenUsageQueryDto();
        queryDto.setStatType("business");
        if (authentication != null) {
            queryDto.setUserId(authentication.getName());
        }
        List<TokenUsageStatDto> stats = tokenUsageService.queryStatistics(queryDto);
        return ResponseEntity.ok(stats);
    }

    /**
     * 获取自己的token使用统计（按日期）
     *
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @param modelName 模型名称（可选）
     * @param authentication 认证信息
     * @return 统计结果
     */
    @GetMapping("/my-statistics/by-date")
    public ResponseEntity<List<TokenUsageStatDto>> getMyStatisticsByDate(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String modelName,
            Authentication authentication) {
        TokenUsageQueryDto queryDto = new TokenUsageQueryDto();
        queryDto.setStatType("date");
        queryDto.setStartDate(startDate);
        queryDto.setEndDate(endDate);
        queryDto.setModelName(modelName);
        if (authentication != null) {
            queryDto.setUserId(authentication.getName());
        }
        List<TokenUsageStatDto> stats = tokenUsageService.queryStatistics(queryDto);
        return ResponseEntity.ok(stats);
    }
}
