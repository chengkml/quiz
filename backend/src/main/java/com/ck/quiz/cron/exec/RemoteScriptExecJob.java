package com.ck.quiz.cron.exec;

import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.MapUtils;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Properties;

/**
 * 远程脚本执行作业
 * <p>
 * 使用 JSch SSH 连接远程服务器执行脚本，并捕获日志输出
 */
@Slf4j
@Component
public class RemoteScriptExecJob extends AbstractAsyncJob {

    @Override
    public String getJobPreffix() {
        return "RemoteScriptExec";
    }

    @Override
    public String getJobLabel() {
        return "远程脚本执行";
    }

    @Override
    public void run(Map<String, Object> params) {
        String host = MapUtils.getString(params, "host");
        int port = MapUtils.getIntValue(params, "port", 22);
        String username = MapUtils.getString(params, "username");
        String password = MapUtils.getString(params, "password");
        String command = MapUtils.getString(params, "cmd");
        List<String> args = (List<String>) params.get("args");

        if (host == null || username == null || command == null) {
            throw new IllegalArgumentException("远程执行参数不完整");
        }

        String fullCommand = command;
        if (args != null && !args.isEmpty()) {
            fullCommand += " " + String.join(" ", args);
        }

        log.info("开始远程执行脚本: {}@{}:{} -> {}", username, host, port, fullCommand);

        Session session = null;
        ChannelExec channel = null;

        try {
            JSch jsch = new JSch();
            session = jsch.getSession(username, host, port);
            session.setPassword(password);

            // 跳过 host key 检查（生产环境建议使用 known_hosts）
            Properties config = new Properties();
            config.put("StrictHostKeyChecking", "no");
            session.setConfig(config);

            session.connect(10000); // 10s 超时

            channel = (ChannelExec) session.openChannel("exec");
            channel.setCommand(fullCommand);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ByteArrayOutputStream errorStream = new ByteArrayOutputStream();

            channel.setOutputStream(outputStream);
            channel.setErrStream(errorStream);

            channel.connect();

            // 等待命令执行完毕
            while (!channel.isClosed()) {
                Thread.sleep(100);
            }

            int exitStatus = channel.getExitStatus();

            String stdOut = outputStream.toString(StandardCharsets.UTF_8);
            String stdErr = errorStream.toString(StandardCharsets.UTF_8);

            if (!stdOut.isBlank()) {
                log.info("远程脚本输出:\n{}", stdOut);
            }
            if (!stdErr.isBlank()) {
                log.warn("远程脚本错误输出:\n{}", stdErr);
            }

            if (exitStatus != 0) {
                log.error("远程脚本执行失败，exitCode={}", exitStatus);
                throw new RuntimeException("远程脚本执行失败，exitCode=" + exitStatus);
            }

            log.info("远程脚本执行成功，exitCode={}", exitStatus);

        } catch (Exception e) {
            log.error("远程脚本执行异常: {}", e.getMessage(), e);
            throw new RuntimeException("远程脚本执行异常", e);
        } finally {
            if (channel != null && channel.isConnected()) {
                channel.disconnect();
            }
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }
}
