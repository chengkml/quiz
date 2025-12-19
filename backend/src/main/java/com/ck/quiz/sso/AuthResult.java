package com.ck.quiz.sso;

import java.util.Map;
import lombok.Data;

@Data
public class AuthResult {
    boolean success;
    String userId;
    String username;
    Map<String, Object> attributes;
    String rawToken;
}
