package com.ck.quiz.password.dto;

import com.ck.quiz.base.dto.QueryDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "查询密码条目")
public class PasswordQueryDto extends QueryDto {
}
