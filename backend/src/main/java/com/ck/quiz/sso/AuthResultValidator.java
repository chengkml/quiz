package com.ck.quiz.sso;

import jakarta.servlet.http.HttpServletRequest;

public interface AuthResultValidator {

    AuthResult validate(HttpServletRequest request);
}
