package com.ck.quiz.subject.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 学科更新DTO
 * 用于更新学科信息时接收参数
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubjectUpdateDto {

    /**
     * 学科ID
     */
    @NotBlank(message = "学科ID不能为空")
    @Size(max = 32, message = "学科ID长度不能超过32个字符")
    private String id;

    /**
     * 学科名称
     */
    @NotBlank(message = "学科名称不能为空")
    @Size(max = 64, message = "学科名称长度不能超过64个字符")
    private String name;

    /**
     * 学科描述
     */
    @Size(max = 255, message = "学科描述长度不能超过255个字符")
    private String description;

}