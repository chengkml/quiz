package com.ck.quiz.cron.exec;

import com.ck.quiz.cron.service.TodoScheduleExpireService;
import org.apache.commons.collections4.MapUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
public class TodoScheduleExpireScanJob extends AbstractAsyncJob {

    @Autowired
    private TodoScheduleExpireService todoScheduleExpireService;

    @Override
    public String getJobPreffix() {
        return "todo-schedule-expire-scan";
    }

    @Override
    public String getJobLabel() {
        return "待办和日程过期扫描任务";
    }

    @Override
    public Map<String, Object> getParamDef() {
        Map<String, Object> params = new HashMap<>();
        params.put("scanTime", "扫描时间（可选，ISO-8601，默认当前时间）");
        return params;
    }

    @Override
    public void run(Map<String, Object> params) {
        String scanTimeText = MapUtils.getString(params, "scanTime");
        LocalDateTime scanTime = StringUtils.hasText(scanTimeText)
                ? LocalDateTime.parse(scanTimeText)
                : LocalDateTime.now();
        TodoScheduleExpireService.ExpireScanResult result = todoScheduleExpireService.scanAndExpire(scanTime);
        log.info(
                "待办和日程过期扫描完成，扫描时间: {}, 过期待办: {}, 过期日程: {}, 合计: {}",
                scanTime,
                result.expiredTodoCount(),
                result.expiredScheduleCount(),
                result.totalExpiredCount()
        );
    }
}
