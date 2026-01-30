package com.ck.quiz.mermaids.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.mermaids.dto.MermaidDiagramCreateDto;
import com.ck.quiz.mermaids.dto.MermaidDiagramDto;
import com.ck.quiz.mermaids.dto.MermaidDiagramQueryDto;
import com.ck.quiz.mermaids.dto.MermaidDiagramUpdateDto;
import com.ck.quiz.mermaids.entity.MermaidDiagram;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 服务接口：用于管理 Mermaid 思维图。
 */
public interface MermaidDiagramService extends
        BaseService<MermaidDiagramCreateDto, MermaidDiagramUpdateDto, MermaidDiagramQueryDto, MermaidDiagramDto, MermaidDiagram> {

    /**
     * 仅更新 diagramData 字段
     * 
     * @param id          图表 ID
     * @param diagramData Mermaid 源码文本
     * @return 更新后的 DTO
     */
    MermaidDiagramDto updateDiagramData(String id, String diagramData);

    /**
     * 流式生成 Mermaid 图文本（SSE）
     * 
     * @param advice      用户输入的生成描述
     * @param diagramData Mermaid 源码文本
     * @param modelName   可选模型名称
     * @return SseEmitter 用于流式推送结果
     */
    SseEmitter streamGenerateDiagram(String advice, String diagramData, String modelName);
}
