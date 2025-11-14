package com.ck.quiz.script.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.time.LocalDateTime;

/**
 * 脚本信息实体类
 * 用于管理脚本的元数据（类型、入口、路径等）
 */
@Entity
@Table(
        name = "script_info",
        indexes = {
                @Index(name = "idx_script_type", columnList = "script_type"),
                @Index(name = "idx_script_code", columnList = "script_code")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScriptInfo {

    @Id
    @Column(name = "id", length = 32, nullable = false)
    private String id;

    /**
     * 脚本编码（唯一标识）
     */
    @Column(name = "script_code", length = 64, nullable = false, unique = true)
    private String scriptCode;

    /**
     * 脚本名称
     */
    @Column(name = "script_name", length = 128, nullable = false)
    private String scriptName;

    /**
     * 脚本类型（python/shell/node/java/...）
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "script_type", length = 32, nullable = false)
    private ScriptType scriptType;

    /**
     * 远程脚本主机
     */
    @Column(name = "host", length = 128)
    private String host;

    /**
     * 远程主机端口，默认22
     */
    @Column(name = "port")
    private Integer port = 22;

    /**
     * 远程主机用户名
     */
    @Column(name = "username", length = 64)
    private String username;

    /**
     * 远程主机密码（可为空，推荐使用密钥认证）
     */
    @Column(name = "password", length = 128)
    private String password;

    /**
     * 脚本文件或目录路径
     */
    @Column(name = "file_path", length = 512, nullable = false)
    private String filePath;

    /**
     * 执行入口文件
     */
    @Column(name = "exec_entry", length = 256, nullable = false)
    private String execEntry;

    /**
     * 自定义执行命令模板，可包含占位符
     * 示例：python {entry} --config={file_path}/config.yaml
     */
    @Column(name = "exec_cmd", length = 512)
    private String execCmd;

    /**
     * 脚本描述
     */
    @Lob
    @Column(name = "description", columnDefinition = "LONGTEXT")
    private String description;

    /**
     * 启用状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "state", length = 20, nullable = false)
    private State state = State.ENABLED;

    /**
     * 创建时间
     */
    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    /**
     * 创建人
     */
    @Column(name = "create_user", length = 64, updatable = false)
    private String createUser;

    /**
     * 更新时间
     */
    @Column(name = "update_date")
    private LocalDateTime updateDate;

    /**
     * 更新人
     */
    @Column(name = "update_user", length = 64)
    private String updateUser;

    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            this.createUser = auth.getName();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updateDate = LocalDateTime.now();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            this.updateUser = auth.getName();
        }
    }

    /**
     * 脚本类型枚举
     */
    /**
     * 脚本类型枚举
     * 区分不同的执行方式，而不仅是语言名称
     */
    public enum ScriptType {

        // ========= Python 系 =========
        PYTHON("python"),            // python 解释器执行 main.py
        PYTHON3("python3"),          // 指定 python3 版本

        // ========= Shell =========
        SHELL("shell"),              // bash/sh 脚本

        // ========= Node.js / JS =========
        NODE("node"),                // node index.js

        // ========= Java 系 =========
        JAVA_JAR("java-jar"),        // java -jar xxx.jar
        JAVA_CLASS("java-class"),    // java com.xxx.Main（需要 classpath）

        // ========= 任务代理 / 网络执行 =========
        HTTP("http"),                // HTTP 请求类“脚本”，并非本地执行
        COMMAND("command"),          // 纯命令，不依赖文件

        // ========= 远程执行 =========
        REMOTE_SSH("remote-ssh"),   // 通过 SSH 执行远程脚本

        // ========= 其他 =========
        OTHER("other");

        private final String value;

        ScriptType(String value) {
            this.value = value;
        }

        @JsonValue
        public String getValue() {
            return value;
        }

        @JsonCreator
        public static ScriptType fromValue(String value) {
            for (ScriptType scriptType : ScriptType.values()) {
                if (scriptType.value.equalsIgnoreCase(value)) {
                    return scriptType;
                }
            }
            throw new IllegalArgumentException("Invalid script type: " + value);
        }
    }



    /**
     * 启用状态枚举
     */
    public enum State {
        ENABLED,   // 启用
        DISABLED   // 禁用
    }
}
