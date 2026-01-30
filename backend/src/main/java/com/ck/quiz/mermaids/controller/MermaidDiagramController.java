package com.ck.quiz.mermaids.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.mermaids.dto.MermaidDiagramCreateDto;
import com.ck.quiz.mermaids.dto.MermaidDiagramDto;
import com.ck.quiz.mermaids.dto.MermaidDiagramQueryDto;
import com.ck.quiz.mermaids.dto.MermaidDiagramUpdateDto;
import com.ck.quiz.mermaids.service.MermaidDiagramService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@Tag(name = "Mermaid图表管理", description = "Mermaid图表的创建、更新、删除、查询等接口")
@RestController
@RequestMapping("/api/mermaids/diagrams")
@RequiredArgsConstructor
public class MermaidDiagramController extends
        BaseController<MermaidDiagramCreateDto, MermaidDiagramUpdateDto, MermaidDiagramQueryDto, MermaidDiagramDto> {

    private final MermaidDiagramService service;

    @Override
    protected BaseService<MermaidDiagramCreateDto, MermaidDiagramUpdateDto, MermaidDiagramQueryDto, MermaidDiagramDto, ?> getService() {
        return service;
    }

    @Operation(summary = "仅更新Mermaid文本", description = "更新图表数据的快捷接口")
    @PatchMapping("/{id}/data")
    public ResponseEntity<MermaidDiagramDto> updateDiagramData(@PathVariable("id") String id,
            @RequestBody Map<String, String> payload) {
        String diagramData = payload == null ? null : payload.get("diagramData");
        MermaidDiagramDto updated = service.updateDiagramData(id, diagramData);
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "流式生成Mermaid", description = "AI流式生成或修改Mermaid代码")
    @GetMapping(path = "/generate/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> streamGenerate(@RequestParam("advice") String advice,
            @RequestParam(value = "diagramData", required = false) String diagramData,
            @RequestParam(value = "modelName", required = false) String modelName) {
        SseEmitter emitter = service.streamGenerateDiagram(advice, diagramData, modelName);
        return ResponseEntity.ok()
                .header("X-Accel-Buffering", "no")
                .header("Cache-Control", "no-cache")
                .header("Connection", "keep-alive")
                .body(emitter);
    }

    @Operation(summary = "多轮对话流式生成", description = "支持上下文的AI生成接口")
    @PostMapping(path = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> streamChat(@RequestBody com.ck.quiz.mermaids.dto.MermaidChatRequest request) {
        SseEmitter emitter = service.streamChat(request);
        return ResponseEntity.ok()
                .header("X-Accel-Buffering", "no")
                .header("Cache-Control", "no-cache")
                .header("Connection", "keep-alive")
                .body(emitter);
    }
}
