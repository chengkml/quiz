package com.ck.quiz.group.dto;

import com.ck.quiz.base.dto.UpdateDto;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class GroupUpdateDto extends UpdateDto {

    @Size(max = 128, message = "分组英文名不能超过128个字符")
    private String name;

    @Size(max = 256, message = "分组中文名不能超过256个字符")
    private String label;

    @Size(max = 64, message = "分组类型不能超过64个字符")
    private String type;
    
    @Size(max = 512, message = "分组描述不能超过512个字符")
    private String descr;

}