package com.ck.quiz.mcp.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class McpServerDto extends Dto {

    private String name;

    private String identifier;

    private String description;

    private String address;

    private String authConfig;

    private Boolean hasAuthConfig;

    private String status;

    private LocalDateTime lastHeartbeatAt;
}

