package com.ck.quiz.price.dto;

import com.ck.quiz.base.dto.QueryDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class PriceMonitorItemQueryDto extends QueryDto {
    private String platform;
    private String itemName;
    private Boolean monitoringEnabled;
}
