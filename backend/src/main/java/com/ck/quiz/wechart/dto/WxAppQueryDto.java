package com.ck.quiz.wechart.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WxAppQueryDto {

    private int offset;

    private int limit;

    private String name;
}
