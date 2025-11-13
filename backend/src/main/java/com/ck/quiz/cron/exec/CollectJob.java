package com.ck.quiz.cron.exec;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
public class CollectJob extends AbstractJob {

    @Override
    public String getJobPreffix() {
        return "collect";
    }

    @Override
    public String getJobLabel() {
        return "元数据采集";
    }

    @Override
    public void run(Map<String, Object> params) {
        log.info("采集任务执行中....请求参数：{}", params);
    }
}
