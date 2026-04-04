package com.ck.quiz.price.dto;

import com.ck.quiz.base.dto.UpdateDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class PriceMonitorItemUpdateDto extends UpdateDto {
    private String platform;
    private String itemName;
    private String itemUrl;
    private String externalItemId;
    private Boolean monitoringEnabled;
    private String currency;
}
