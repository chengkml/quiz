package com.ck.quiz.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;

class JwtUtilTest {

    private final JwtUtil jwtUtil = new JwtUtil();

    @Test
    void generateTokenAndParseTokenReturnExpectedSubject() {
        String token = jwtUtil.generateToken("u-1001");

        Claims claims = jwtUtil.parseToken(token);

        assertEquals("u-1001", claims.getSubject());
    }

    @Test
    void parseTokenThrowsForMalformedInput() {
        assertThrows(RuntimeException.class, () -> jwtUtil.parseToken("not-a-valid-token"));
    }
}
