package com.ck.quiz.notification.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;

import com.ck.quiz.cron.dto.JobDto;
import com.ck.quiz.notification.dto.SendNotificationDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;

import com.ck.quiz.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "通知管理", description = "系统消息的发送接口")
@RestController
@RequestMapping("/api/notification")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;
    
    /**
     * 管理员接口：发送系统消息
     */
    @Operation(summary = "发送系统消息", description = "管理员发送系统消息给指定用户或所有用户")
    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @Parameter(description = "发送消息请求体", required = true)
            @Valid @RequestBody SendNotificationDto dto) {
        List<JobDto> jobs;
        
        if (dto.getUserIds() == null || dto.getUserIds().isEmpty()) {
            // 发送给所有用户
            jobs = notificationService.sendMessageToAll(
                    dto.getTitle(),
                    dto.getContent(),
                    dto.getType(),
                    dto.getChannel()
            );
        } else {
            // 发送给指定用户
            jobs = notificationService.sendMessageBatch(
                    dto.getUserIds(),
                    dto.getTitle(),
                    dto.getContent(),
                    dto.getType(),
                    dto.getChannel()
            );
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("jobs", jobs);
        result.put("count", jobs.size());
        return ResponseEntity.ok(result);
    }
}
