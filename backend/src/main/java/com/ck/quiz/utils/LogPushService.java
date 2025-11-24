package com.ck.quiz.utils;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class LogPushService {

    private final SseEmitterManager emitterManager;

    private final Map<String, BlockingQueue<String>> logQueueMap = new ConcurrentHashMap<>();

    private final Map<SseEmitter, BlockingQueue<String>> emitterLogQueueMap = new ConcurrentHashMap<>();

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
            Iterator<Map.Entry<SseEmitter, BlockingQueue<String>>> it = emitterLogQueueMap.entrySet().iterator();
            while (it.hasNext()) {
                Map.Entry<SseEmitter, BlockingQueue<String>> e = it.next();
                SseEmitter emitter = e.getKey();
                BlockingQueue<String> queue = emitterLogQueueMap.get(emitter);
                List<String> batch = new ArrayList<>();
                queue.drainTo(batch, 100);
                if (!batch.isEmpty()) {
                    try {
                        emitter.send(batch);
                    } catch (IOException ex) {
                        log.error("推送sse消息异常：{}", ExceptionUtils.getStackTrace(ex));
                    }
                }
            }
        }, 0, 50, TimeUnit.MILLISECONDS);
    }

    @PreDestroy
    public void shutdown() {
        scheduler.shutdownNow();
    }

    public void appendEmitterLog(SseEmitter emitter, String log) {
        emitterLogQueueMap.computeIfAbsent(emitter, k -> new LinkedBlockingQueue<>(5000)).offer(log);
    }

    public void appendLog(String taskId, String log) {
        logQueueMap.computeIfAbsent(taskId, k -> new LinkedBlockingQueue<>(5000)).offer(log);
    }

    public void complete(String taskId) {
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            log.warn("线程睡眠异常：{}", ExceptionUtils.getStackTrace(e));
        }
        // 1. 最后一批日志 flush
        BlockingQueue<String> queue = logQueueMap.get(taskId);
        if (queue != null) {
            List<String> batch = new ArrayList<>();
            queue.drainTo(batch);
            if (!batch.isEmpty()) {
                emitterManager.send(taskId, batch); // 手动发最后一批
            }
        }

        // 2. 再去关闭订阅者
        List<SseEmitter> emitters = emitterManager.complete(taskId);

        // 3. 删除队列，释放内存
        logQueueMap.remove(taskId);

        if (emitters != null) {
            emitters.forEach(emitter -> emitterLogQueueMap.remove(emitter));
        }
    }
}
