package com.ck.quiz.password.dto;

import com.ck.quiz.base.dto.UpdateDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "更新密码条目")
public class PasswordUpdateDto extends UpdateDto {

    @Schema(description = "ID")
    private String id;

    @Schema(description = "标题")
    private String title;

    @Schema(description = "用户名")
    private String username;

    @Schema(description = "密码(明文，留空不修改)")
    private String password;

    @Schema(description = "网址")
    private String url;

    @Schema(description = "备注")
    private String remark;
}
