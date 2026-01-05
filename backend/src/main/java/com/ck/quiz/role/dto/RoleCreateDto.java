package com.ck.quiz.role.dto;

import com.ck.quiz.base.dto.CreateDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class RoleCreateDto extends CreateDto {

    @NotBlank(message = "角色名称不能为空")
    @Size(max = 64, message = "角色名称长度不能超过64个字符")
    private String name;

    @Size(max = 128, message = "角色描述长度不能超过128个字符")
    private String descr;
}