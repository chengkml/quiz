package com.ck.quiz.script.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("脚本信息表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "script_info", indexes = {
        @Index(name = "idx_script_code", columnList = "script_code")
})
public class ScriptInfo extends Model {

    @Column(length = 64, nullable = false, unique = true)
    @Comment("脚本编码")
    private String scriptCode;

    @Column(length = 128, nullable = false)
    @Comment("脚本名称")
    private String scriptName;

    @Column(length = 32, nullable = false)
    @Comment("远程脚本")
    private String remoteScript;

    @Column(length = 128)
    @Comment("远程脚本主机")
    private String host;

    @Comment("远程主机端口")
    private Integer port;

    @Column(length = 64)
    @Comment("远程主机用户名")
    private String username;

    @Column(length = 128)
    @Comment("远程主机密码")
    private String password;

    @Column(length = 512, nullable = false)
    @Comment("自定义执行命令模板")
    private String execCmd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Comment("启用状态")
    private State state = State.ENABLED;

    public enum State {
        ENABLED,
        DISABLED
    }
}
