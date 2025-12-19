package com.ck.quiz.sso.impl;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;

import com.ck.quiz.sso.AuthResult;
import com.ck.quiz.sso.SsoProtocolAdapter;


@Component
public class DefaultSsoProtocolAdapter implements SsoProtocolAdapter {

    @Override
    public void redirectToLogin(HttpServletRequest req, HttpServletResponse resp) {
        
    }

    @Override
    public AuthResult handleCallback(HttpServletRequest req) {
        return new AuthResult();
    }

    @Override
    public boolean validateToken(String token) {
        return true;
    }

    @Override
    public void logout(String token) {
        
    }
    
}
