package com.ck.quiz.role.dto;

import com.ck.quiz.base.dto.UpdateDto;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class RoleUpdateDto extends UpdateDto {

    @Size(max = 64, message = "角色名称长度不能超过64个字符")
    private String name;

    @Size(max = 128, message = "角色描述长度不能超过128个字符")
    private String descr;
}