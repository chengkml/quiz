package com.ck.quiz.cron.exec;

import com.ck.quiz.utils.LogPushService;
import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.MapUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.List;
import java.util.Map;
import java.util.Properties;

/**
 * 远程脚本执行作业
 * <p>
 * 使用 JSch SSH 连接远程服务器执行脚本，并逐行捕获日志输出
 */
@Slf4j
@Component
public class RemoteScriptExecJob extends AbstractAsyncJob {

    @Autowired
    private LogPushService logPushService;

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
        String jobId = MapUtils.getString(params, "jobId");
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

            InputStream inputStream = channel.getInputStream();
            InputStream errorStream = channel.getErrStream();

            channel.connect();

            // 逐行读取标准输出
            BufferedReader stdReader = new BufferedReader(new InputStreamReader(inputStream, "UTF-8"));
            BufferedReader errReader = new BufferedReader(new InputStreamReader(errorStream, "UTF-8"));

            String line;
            while (true) {
                // 标准输出
                while (stdReader.ready() && (line = stdReader.readLine()) != null) {
                    log.info("{}", line);
                }

                // 错误输出
                while (errReader.ready() && (line = errReader.readLine()) != null) {
                    log.warn("{}", line);
                }

                if (channel.isClosed()) {
                    // 处理残余输出
                    while ((line = stdReader.readLine()) != null) {
                        log.info("{}", line);
                    }
                    while ((line = errReader.readLine()) != null) {
                        log.warn("{}", line);
                    }
                    break;
                }

                Thread.sleep(100);
            }

            int exitStatus = channel.getExitStatus();
            if (exitStatus != 0) {
                log.error("远程脚本执行失败，exitCode={}", exitStatus);
                throw new RuntimeException("远程脚本执行失败，exitCode=" + exitStatus);
            }

            log.info("远程脚本执行成功，exitCode={}", exitStatus);

        } catch (Exception e) {
            log.error("远程脚本执行异常: {}", e.getMessage(), e);
            throw new RuntimeException("远程脚本执行异常", e);
        } finally {
            logPushService.complete(jobId);
            if (channel != null && channel.isConnected()) {
                channel.disconnect();
            }
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }
}
