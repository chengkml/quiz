package com.ck.quiz.tag.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class TagDto extends Dto {

    private String name;

    private String label;

    private String type;

    private String descr;

    private String color;

}
