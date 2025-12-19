package com.ck.quiz.sso;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

interface AuthRedirectHandler {

    boolean supports(HttpServletRequest request);

    void redirectToAuthCenter(
        HttpServletRequest request,
        HttpServletResponse response
    );
}

