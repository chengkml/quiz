package com.ck.quiz.cron.exec;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.DefaultExecutor;
import org.apache.commons.exec.PumpStreamHandler;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 脚本执行作业
 * <p>
 * 使用 Apache Commons Exec 执行外部命令/脚本，并将输出日志打印到日志系统
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
        if(params.containsKey("args")) {
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

        // 3. 设置输出流，用于捕获 stdout 和 stderr
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ByteArrayOutputStream errorStream = new ByteArrayOutputStream();
        PumpStreamHandler streamHandler = new PumpStreamHandler(outputStream, errorStream);

        DefaultExecutor executor = new DefaultExecutor();
        executor.setStreamHandler(streamHandler);

        // 4. 执行命令
        int exitCode = 0;
        try {
            exitCode = executor.execute(cmdLine);
        } catch (IOException e) {
            log.error("脚本执行异常: {}", e.getMessage(), e);
            throw new RuntimeException("脚本执行异常", e);
        }

        // 5. 输出日志
        String stdOut = outputStream.toString(StandardCharsets.UTF_8);
        String stdErr = errorStream.toString(StandardCharsets.UTF_8);

        if (!stdOut.isBlank()) {
            log.info("脚本输出:\n{}", stdOut);
        }
        if (!stdErr.isBlank()) {
            log.warn("脚本错误输出:\n{}", stdErr);
        }

        if (exitCode != 0) {
            log.error("脚本执行失败，exitCode={}", exitCode);
            throw new RuntimeException("脚本执行失败，exitCode=" + exitCode);
        }

        log.info("脚本执行成功，exitCode={}", exitCode);
    }
}
