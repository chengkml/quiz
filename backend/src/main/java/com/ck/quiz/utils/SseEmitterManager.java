package com.ck.quiz.utils;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SseEmitterManager {

    private final Map<String, SseEmitter> emitterMap = new ConcurrentHashMap<>();

    public SseEmitter create(String taskId) {
        SseEmitter emitter = new SseEmitter(0L); // 永不超时
        emitter.onCompletion(() -> emitterMap.remove(taskId));
        emitter.onTimeout(() -> emitterMap.remove(taskId));
        emitter.onError((e) -> emitterMap.remove(taskId));

        emitterMap.put(taskId, emitter);
        return emitter;
    }

    public void send(String taskId, Object data) {
        SseEmitter emitter = emitterMap.get(taskId);
        if (emitter != null) {
            try {
                emitter.send(data);
            } catch (Exception e) {
                emitterMap.remove(taskId);
            }
        }
    }

    public void complete(String taskId) {
        SseEmitter emitter = emitterMap.remove(taskId);
        if (emitter != null) {
            emitter.complete();
        }
    }
}
