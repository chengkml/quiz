package com.ck.quiz.notification.controller;

import com.ck.quiz.notification.service.SystemMessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 系统消息管理接口
 */
@Tag(name = "系统消息", description = "系统消息的发送、查询、标记已读等接口")
@RestController
@RequestMapping("/api/system-message")
@RequiredArgsConstructor
public class SystemMessageController {

    private final SystemMessageService messageService;

    /**
     * 获取当前用户的消息列表
     */
    @Operation(summary = "获取用户消息列表", description = "分页获取当前用户的系统消息列表")
    @GetMapping("/list")
    public ResponseEntity<Page<?>> getMessages(
        @Parameter(description = "消息状态（all: 全部, read: 已读, unread: 未读）", example = "all") @RequestParam(value = "state", defaultValue = "all") String state,
        @Parameter(description = "页码，从0开始") @RequestParam(value = "page", defaultValue = "0") int page,
        @Parameter(description = "每页大小") @RequestParam(value = "size", defaultValue = "20") int size) {
        String userId = getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(messageService.getUserMessages(state, userId, pageable));
    }

    /**
     * 获取当前用户的未读消息列表
     */
    @Operation(summary = "获取未读消息列表", description = "分页获取当前用户的未读系统消息列表")
    @GetMapping("/unread")
    public ResponseEntity<Page<?>> getUnreadMessages(
        @Parameter(description = "页码，从0开始") @RequestParam(value = "page", defaultValue = "0") int page,
        @Parameter(description = "每页大小") @RequestParam(value = "size", defaultValue = "20") int size) {
        String userId = getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(messageService.getUserUnreadMessages(userId, pageable));
    }

    /**
     * 获取未读消息数
     */
    @Operation(summary = "获取未读消息数", description = "获取当前用户的未读消息总数")
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        String userId = getCurrentUserId();
        long count = messageService.getUnreadCount(userId);
        Map<String, Long> result = new HashMap<>();
        result.put("unreadCount", count);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取消息详情
     */
    @Operation(summary = "获取消息详情", description = "获取指定消息的详细信息")
    @GetMapping("/{messageId}")
    public ResponseEntity<?> getMessageDetail(
        @Parameter(description = "消息ID", required = true)
        @PathVariable("messageId") String messageId) {
        Object message = messageService.getMessageDetail(messageId);
        if (message == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(message);
    }

    /**
     * 标记消息为已读
     */
    @Operation(summary = "标记消息为已读", description = "标记指定消息为已读")
    @PutMapping("/{messageId}/read")
    public ResponseEntity<Void> markAsRead(
        @Parameter(description = "消息ID", required = true)
        @PathVariable("messageId") String messageId) {
        messageService.markAsRead(messageId);
        return ResponseEntity.ok().build();
    }

    /**
     * 标记所有消息为已读
     */
    @Operation(summary = "标记所有消息为已读", description = "标记当前用户的所有消息为已读")
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        String userId = getCurrentUserId();
        messageService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    /**
     * 删除消息
     */
    @Operation(summary = "删除消息", description = "删除指定的消息")
    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(
        @Parameter(description = "消息ID", required = true)
        @PathVariable("messageId") String messageId) {
        messageService.deleteMessage(messageId);
        return ResponseEntity.ok().build();
    }

    /**
     * 删除所有消息
     */
    @Operation(summary = "删除所有消息", description = "删除当前用户的所有消息")
    @DeleteMapping("/delete-all")
    public ResponseEntity<Void> deleteAllMessages() {
        String userId = getCurrentUserId();
        messageService.deleteAllMessages(userId);
        return ResponseEntity.ok().build();
    }

    /**
     * 获取当前登录用户的ID
     */
    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        throw new RuntimeException("用户未登录");
    }
}
