package com.ck.quiz.cron.exec;

import com.ck.quiz.cron.service.TodoScheduleExpireService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class TodoScheduleExpireScanTask {

    @Autowired
    private TodoScheduleExpireService todoScheduleExpireService;

    @Scheduled(cron = "0 * * * * ?")
    public void scanExpiredTodosAndSchedules() {
        TodoScheduleExpireService.ExpireScanResult result = todoScheduleExpireService.scanAndExpire();
        if (result.totalExpiredCount() > 0) {
            log.info(
                    "自动过期扫描完成，过期待办: {}, 过期日程: {}, 合计: {}",
                    result.expiredTodoCount(),
                    result.expiredScheduleCount(),
                    result.totalExpiredCount()
            );
        }
    }
}
