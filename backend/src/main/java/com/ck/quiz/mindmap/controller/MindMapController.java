package com.ck.quiz.mindmap.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.mindmap.dto.*;
import com.ck.quiz.mindmap.service.MindMapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "思维导图管理", description = "思维导图相关的API接口")
@RestController
@RequestMapping("/api/mindmap")
public class MindMapController extends BaseController<MindMapCreateDto, MindMapUpdateDto, MindMapQueryDto, MindMapDto> {

    @Autowired
    private MindMapService mindMapService;

    @Operation(summary = "更新思维导图基本信息", description = "更新思维导图的名称、描述等基本信息")
    @PutMapping("/update-basic-info")
    public ResponseEntity<MindMapDto> updateMindMapBasicInfo(
            @Parameter(description = "思维导图基本信息更新", required = true) @Valid @RequestBody MindMapBasicInfoUpdateDto mindMapBasicInfoUpdateDto) {
        return ResponseEntity.ok(mindMapService.updateMindMapBasicInfo(mindMapBasicInfoUpdateDto));
    }

    @Operation(summary = "更新思维导图数据", description = "更新思维导图的实际数据内容")
    @PutMapping("/update-data")
    public ResponseEntity<MindMapDto> updateMindMapData(
            @Parameter(description = "思维导图数据更新", required = true) @Valid @RequestBody MindMapDataUpdateDto mindMapDataUpdateDto) {
        return ResponseEntity.ok(mindMapService.updateMindMapData(mindMapDataUpdateDto));
    }

    @Operation(summary = "流式生成思维导图（SSE）", description = "根据描述调用大模型流式生成思维导图数据")
    @GetMapping(path = "/generate/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter streamGenerateMindMap(
            @Parameter(description = "思维导图描述") @RequestParam("descr") String descr) {
        return mindMapService.streamGenerateMindMap(descr);
    }

    @Override
    protected BaseService<MindMapCreateDto, MindMapUpdateDto, MindMapQueryDto, MindMapDto, ?> getService() {
        return mindMapService;
    }
}