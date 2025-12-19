package com.ck.quiz.sso;

import jakarta.servlet.http.HttpServletRequest;

public interface AuthCallbackHandler {

    AuthResult handleCallback(HttpServletRequest request);
}
