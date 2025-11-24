package com.ck.quiz.utils;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
public class SseEmitterManager {

    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emitterMap = new ConcurrentHashMap<>();

    public SseEmitter create(String taskId) {
        SseEmitter emitter = new SseEmitter(300_000L);

        emitter.onCompletion(() -> removeEmitter(taskId, emitter));
        emitter.onTimeout(() -> removeEmitter(taskId, emitter));
        emitter.onError((e) -> removeEmitter(taskId, emitter));

        emitterMap.computeIfAbsent(taskId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        return emitter;
    }

    private void removeEmitter(String taskId, SseEmitter emitter) {
        List<SseEmitter> list = emitterMap.get(taskId);
        if (list != null) {
            list.remove(emitter);
        }
    }

    public void send(String taskId, Object msg) {
        List<SseEmitter> list = emitterMap.get(taskId);
        if (list != null) {
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(msg);
                } catch (Exception e) {
                    removeEmitter(taskId, emitter);
                }
            }
        }
    }

    public List<SseEmitter> complete(String taskId) {
        List<SseEmitter> list = emitterMap.remove(taskId);
        if (list != null) {
            log.info("关闭SSE连接：{}", taskId);
            for (SseEmitter emitter : list) {
                try {
                    emitter.complete();
                } catch (Exception e) {
                    log.error("关闭SSE连接异常：{}", ExceptionUtils.getStackTrace(e));
                }
            }
        }
        return list;
    }


}
