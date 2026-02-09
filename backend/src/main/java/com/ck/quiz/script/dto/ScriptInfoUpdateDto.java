package com.ck.quiz.script.dto;

import com.ck.quiz.base.dto.UpdateDto;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ScriptInfoUpdateDto extends UpdateDto {

    @Size(max = 128, message = "脚本名称长度不能超过128个字符")
    private String scriptName;

    @Size(max = 32, message = "远程脚本长度不能超过32个字符")
    private String remoteScript;

    @Size(max = 128, message = "远程主机地址长度不能超过128个字符")
    private String host;

    private Integer port;

    @Size(max = 64, message = "远程主机用户名长度不能超过64个字符")
    private String username;

    @Size(max = 128, message = "远程主机密码长度不能超过128个字符")
    private String password;

    @Size(max = 4096, message = "自定义执行命令长度不能超过4096个字符")
    private String execCmd;

    @Size(max = 20, message = "状态长度不能超过20个字符")
    private String state;
}