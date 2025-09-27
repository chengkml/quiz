package com.ck.quiz.role.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 角色更新DTO
 * 用于更新角色信息时接收参数
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleUpdateDto {

    /**
     * 角色ID
     */
    @NotBlank(message = "角色ID不能为空")
    @Size(max = 32, message = "角色ID长度不能超过32个字符")
    private String id;

    /**
     * 角色名称
     */
    @NotBlank(message = "角色名称不能为空")
    @Size(max = 64, message = "角色名称长度不能超过64个字符")
    private String name;

    /**
     * 角色描述
     */
    @Size(max = 128, message = "角色描述长度不能超过128个字符")
    private String descr;

}