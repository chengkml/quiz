package com.ck.quiz.chat.controller;

import com.ck.quiz.chat.dto.ChatCompletionRequest;
import com.ck.quiz.chat.dto.ChatCompletionResponse;
import com.ck.quiz.chat.dto.ChatMessageDto;
import com.ck.quiz.chat.dto.ChatSessionDto;
import com.ck.quiz.chat.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import reactor.core.scheduler.Schedulers;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "大模型聊天", description = "通用大模型聊天相关API")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/completions")
    @Operation(summary = "发送消息并获取回复")
    public ResponseEntity<ChatCompletionResponse> completions(
            @Valid @RequestBody ChatCompletionRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(chatService.chat(userId, request));
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "发送消息并获取流式回复")
    public SseEmitter streamCompletions(
            @Valid @RequestBody ChatCompletionRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication != null ? authentication.getName() : null;

        // Default timeout 0 means no timeout; SSE stays open while downstream emits.
        SseEmitter emitter = new SseEmitter(0L);

        emitter.onTimeout(emitter::complete);
        emitter.onCompletion(() -> {});

        chatService.streamChat(userId, request)
                .publishOn(Schedulers.boundedElastic())
                .doOnError(emitter::completeWithError)
                .doOnComplete(emitter::complete)
                .subscribe(response -> {
                    try {
                        emitter.send(SseEmitter.event()
                                .id(String.valueOf(System.nanoTime()))
                                .data(response));
                    } catch (Exception e) {
                        emitter.completeWithError(e);
                    }
                });

        return emitter;
    }

    @GetMapping("/sessions")
    @Operation(summary = "获取会话列表")
    public ResponseEntity<Page<ChatSessionDto>> sessions(
            @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "20") int size) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(chatService.listSessions(userId, page, size));
    }

    @GetMapping("/sessions/{sessionId}/messages")
    @Operation(summary = "获取会话消息")
    public ResponseEntity<List<ChatMessageDto>> messages(
            @Parameter(description = "会话ID") @PathVariable("sessionId") String sessionId,
            @Parameter(description = "最大返回条数") @RequestParam(defaultValue = "50") int limit) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(chatService.listMessages(userId, sessionId, limit));
    }
}

