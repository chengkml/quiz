package com.ck.quiz.utils;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    // ✅ 原始密钥字符串（可以包含任意字符，包括 '-'）
    private static final String SECRET_STRING = "quizck-tiandiyisuren";

    // ✅ 正确方式：转为字节数组，并创建 SecretKey
    private static final SecretKey SECRET_KEY = Keys.hmacShaKeyFor(
            SECRET_STRING.getBytes(StandardCharsets.UTF_8)
    );

    private static final long EXPIRATION = 7 * 24 * 3600 * 1000; // 7天

    public String generateToken(String userId) {
        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(SECRET_KEY, SignatureAlgorithm.HS256) // ✅ 传 SecretKey，不是字符串
                .compact();
    }

    public Claims parseToken(String token) {
        try {
            return Jwts.parserBuilder()               // ✅ 使用 parserBuilder()
                    .setSigningKey(SECRET_KEY)        // ✅ 同样传 SecretKey
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            throw new RuntimeException("Token 已过期", e);
        } catch (UnsupportedJwtException | MalformedJwtException |
                 SignatureException | IllegalArgumentException e) {
            throw new RuntimeException("Token 无效", e);
        }
    }
}