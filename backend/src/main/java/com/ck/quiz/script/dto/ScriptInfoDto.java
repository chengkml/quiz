package com.ck.quiz.script.dto;

import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.script.entity.ScriptInfo;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ScriptInfoDto extends Dto {

    private String scriptCode;

    private String scriptName;

    private String remoteScript;

    private String host;

    private Integer port;

    private String username;

    private String password;

    private String execCmd;

    private ScriptInfo.State state;
}