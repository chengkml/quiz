package com.ck.quiz.password.dto;

import com.ck.quiz.base.dto.Dto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "密码条目详情")
public class PasswordDto extends Dto {

    @Schema(description = "ID")
    private String id;

    @Schema(description = "标题")
    private String title;

    @Schema(description = "用户名")
    private String username;

    @Schema(description = "网址")
    private String url;

    @Schema(description = "分组")
    private String category;

    @Schema(description = "备注")
    private String remark;

    @Schema(description = "创建人")
    private String createUser;

    // Note: Password is deliberately excluded from default DTO for security
}
