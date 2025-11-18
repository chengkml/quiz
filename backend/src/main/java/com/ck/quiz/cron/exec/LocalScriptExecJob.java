package com.ck.quiz.cron.exec;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.exec.*;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 脚本执行作业（逐行输出日志版本）
 */
@Slf4j
@Component
public class LocalScriptExecJob extends AbstractAsyncJob {

    @Override
    public String getJobPreffix() {
        return "LocalScriptExec";
    }

    @Override
    public String getJobLabel() {
        return "本地脚本执行";
    }

    @Override
    public void run(Map<String, Object> params) {
        // 1. 获取基础命令
        String baseCommand = MapUtils.getString(params, "cmd");
        List<String> args = new ArrayList<>();
        if (params.containsKey("args")) {
            args = (List<String>) params.get("args");
        }
        if (baseCommand == null || baseCommand.isBlank()) {
            throw new IllegalArgumentException("执行命令为空，请检查脚本类型和入口参数");
        }

        log.info("开始执行脚本命令: {}", baseCommand);
        if (args != null && !args.isEmpty()) {
            log.info("附加参数: {}", args);
        }

        // 2. 构建 CommandLine 对象
        CommandLine cmdLine = CommandLine.parse(baseCommand);
        if (args != null) {
            for (String arg : args) {
                cmdLine.addArgument(arg, false);
            }
        }

        // 3. 使用 LogOutputStream 实现逐行日志输出
        LogOutputStream stdOut = new LogOutputStream() {
            @Override
            protected void processLine(String line, int level) {
                if (line != null && !line.isBlank()) {
                    log.info("{}", line);
                }
            }
        };

        LogOutputStream stdErr = new LogOutputStream() {
            @Override
            protected void processLine(String line, int level) {
                if (line != null && !line.isBlank()) {
                    log.warn("{}", line);
                }
            }
        };

        PumpStreamHandler streamHandler = new PumpStreamHandler(stdOut, stdErr);

        DefaultExecutor executor = new DefaultExecutor();
        executor.setStreamHandler(streamHandler);

        // 4. 执行命令
        int exitCode;
        try {
            exitCode = executor.execute(cmdLine);
        } catch (IOException e) {
            log.error("脚本执行异常: {}", e.getMessage(), e);
            throw new RuntimeException("脚本执行异常", e);
        }

        // 5. 校验退出码
        if (exitCode != 0) {
            log.error("脚本执行失败，exitCode={}", exitCode);
            throw new RuntimeException("脚本执行失败，exitCode=" + exitCode);
        }

        log.info("脚本执行成功，exitCode={}", exitCode);
    }
}
