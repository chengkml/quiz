package com.ck.quiz.utils;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
public class LogPushService {

    private final SseEmitterManager emitterManager;

    private final Map<String, BlockingQueue<String>> logQueueMap = new ConcurrentHashMap<>();

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    @PostConstruct
    public void init() {
        // 定时任务批量发送日志，每 50ms
        scheduler.scheduleAtFixedRate(() -> {
            for (String taskId : logQueueMap.keySet()) {
                BlockingQueue<String> queue = logQueueMap.get(taskId);
                List<String> batch = new ArrayList<>();
                queue.drainTo(batch, 100);
                if (!batch.isEmpty()) {
                    emitterManager.send(taskId, batch);
                }
            }
        }, 0, 50, TimeUnit.MILLISECONDS);
    }

    public void appendLog(String taskId, String log) {
        logQueueMap.computeIfAbsent(taskId, k -> new LinkedBlockingQueue<>(5000)).offer(log);
    }

    public void complete(String taskId) {
        emitterManager.complete(taskId);
        logQueueMap.remove(taskId);
    }
}
