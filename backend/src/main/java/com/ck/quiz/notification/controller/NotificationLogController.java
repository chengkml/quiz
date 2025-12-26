package com.ck.quiz.notification.controller;

import com.ck.quiz.notification.service.NotificationLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/notification/log")
public class NotificationLogController {
    @Autowired
    private NotificationLogService notificationLogService;

    // 查询所有异常日志，支持分页和关键字
    @GetMapping("/error")
    public Object getErrorLogs(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "keyWord", required = false) String keyWord) {
        return notificationLogService.getErrorLogs(page, size, keyWord);
    }

    // 根据ID重试发送
    @PostMapping("/retry/{id}")
    public String retrySend(@PathVariable(name="id") Long id) {
        boolean success = notificationLogService.retrySend(id);
        return success ? "重试成功" : "重试失败，日志不存在或非异常日志";
    }
}
