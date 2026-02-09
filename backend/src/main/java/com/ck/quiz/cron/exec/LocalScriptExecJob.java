package com.ck.quiz.cron.exec;

import org.apache.commons.collections.MapUtils;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 脚本执行作业（ProcessBuilder 版本，自动适配 Windows PowerShell/Linux Shell 且解决乱码）
 */
@Component
public class LocalScriptExecJob extends AbstractJob {

    private static final ExecutorService streamReaderPool = Executors.newCachedThreadPool();

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
        // 1. 获取原始参数
        String baseCommand = MapUtils.getString(params, "cmd");
        List<String> args = (List<String>) params.getOrDefault("args", new ArrayList<>());

        if (baseCommand == null || baseCommand.isBlank()) {
            throw new IllegalArgumentException("执行命令为空，请检查脚本类型和入口参数");
        }

        // 2. 识别系统编码：Windows 中文版通常为 GBK (MS936)
        boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
        String charsetName = isWindows ? "GBK" : "UTF-8";
        log.info("检测到操作系统: {}, 使用字符集: {}", System.getProperty("os.name"), charsetName);

        // 3. 构建 ProcessBuilder 命令列表
        List<String> commands = buildProcessBuilderInput(baseCommand, args, isWindows);
        log.info("最终执行指令: {}", commands);

        ProcessBuilder pb = new ProcessBuilder(commands);
        // 不合并错误流，以便区分 INFO 和 WARN 日志
        pb.redirectErrorStream(false);

        Process process = null;
        try {
            // 4. 启动进程
            process = pb.start();

            // 5. 异步读取标准输出流和错误流，防止缓冲区满导致死锁
            // 使用自定义线程池或 CompletableFuture
            Process finalProcess = process;
            CompletableFuture<Void> stdoutFuture = CompletableFuture
                    .runAsync(() -> readStream(finalProcess.getInputStream(), charsetName, false), streamReaderPool);

            CompletableFuture<Void> stderrFuture = CompletableFuture
                    .runAsync(() -> readStream(finalProcess.getErrorStream(), charsetName, true), streamReaderPool);

            // 6. 等待进程结束
            int exitCode = process.waitFor();

            // 确保流读取完毕
            stdoutFuture.join();
            stderrFuture.join();

            log.info("脚本执行完毕，exitCode={}", exitCode);

            if (exitCode != 0) {
                log.error("脚本执行失败，exitCode={}", exitCode);
                throw new RuntimeException("脚本执行失败，exitCode=" + exitCode);
            }

        } catch (InterruptedException e) {
            log.error("脚本执行被中断: {}", e.getMessage());
            if (process != null) {
                process.destroy();
            }
            Thread.currentThread().interrupt();
            throw new RuntimeException("脚本执行被中断", e);
        } catch (Exception e) {
            log.error("脚本执行异常: {}", e.getMessage(), e);
            throw new RuntimeException("脚本执行异常", e);
        }
    }

    /**
     * 读取流并输出日志
     */
    private void readStream(InputStream inputStream, String charsetName, boolean isError) {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(inputStream, Charset.forName(charsetName)))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.isBlank()) {
                    if (isError) {
                        log.warn("{}", line);
                    } else {
                        log.info("{}", line);
                    }
                }
            }
        } catch (Exception e) {
            log.error("读取脚本输出流异常: {}", e.getMessage(), e);
        }
    }

    /**
     * 构建 ProcessBuilder 所需的命令列表
     */
    private List<String> buildProcessBuilderInput(String baseCommand, List<String> args, boolean isWindows) {
        List<String> commands = new ArrayList<>();

        if (isWindows) {
            commands.add("powershell.exe");
            commands.add("-NoProfile");
            commands.add("-ExecutionPolicy");
            commands.add("Bypass");
            commands.add("-Command");

            StringBuilder fullCmd = new StringBuilder();
            fullCmd.append("& {");
            // 关键：强制 PowerShell 本次会话输出编码为 UTF8/GBK 兼容
            fullCmd.append("[Console]::OutputEncoding = [System.Text.Encoding]::GetEncoding('GBK');");
            fullCmd.append(System.lineSeparator());
            fullCmd.append(baseCommand);
            for (String arg : args) {
                fullCmd.append(" ").append(arg);
            }
            fullCmd.append(System.lineSeparator());
            fullCmd.append("}");

            commands.add(fullCmd.toString());
        } else {
            commands.add("sh");
            commands.add("-c");

            StringBuilder fullCmd = new StringBuilder(baseCommand);
            for (String arg : args) {
                fullCmd.append(" ").append(arg);
            }
            commands.add(fullCmd.toString());
        }

        return commands;
    }

    @Override
    public Map<String, Object> getParamDef() {
        return Map.of(
                "cmd", Map.of(
                        "label", "执行命令",
                        "type", "string",
                        "required", true,
                        "placeholder", "Windows下可直接写 PS 脚本逻辑；Linux下写 Shell 脚本"),
                "args", Map.of(
                        "label", "命令参数",
                        "type", "array",
                        "required", false,
                        "placeholder", "参数列表"));
    }
}