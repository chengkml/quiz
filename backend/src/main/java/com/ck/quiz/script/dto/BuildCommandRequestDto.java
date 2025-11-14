package com.ck.quiz.script.dto;

import com.ck.quiz.script.entity.ScriptInfo;
import lombok.Data;

@Data
public class BuildCommandRequestDto {

    private String filePath;

    private String execEntry;

    private ScriptInfo.ScriptType scriptType;
}
