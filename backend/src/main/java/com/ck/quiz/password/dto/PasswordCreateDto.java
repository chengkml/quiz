package com.ck.quiz.password.dto;

import com.ck.quiz.base.dto.CreateDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "创建密码条目")
public class PasswordCreateDto extends CreateDto {

    @Schema(description = "标题")
    private String title;

    @Schema(description = "用户名")
    private String username;

    @Schema(description = "密码(明文)")
    private String password;

    @Schema(description = "网址")
    private String url;

    @Schema(description = "分组")
    private String category;

    @Schema(description = "备注")
    private String remark;
}
