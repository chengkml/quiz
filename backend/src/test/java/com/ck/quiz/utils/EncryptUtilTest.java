package com.ck.quiz.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class EncryptUtilTest {

    @Test
    void encryptAndDecryptRoundTripWithCustomSecret() {
        String plain = "quiz-password-content";
        String secret = "unit-test-secret";

        String encrypted = EncryptUtil.encrypt(plain, secret);
        String decrypted = EncryptUtil.decrypt(encrypted, secret);

        assertNotEquals(plain, encrypted);
        assertEquals(plain, decrypted);
    }

    @Test
    void encryptAndDecryptRoundTripWithDefaultSecret() {
        String plain = "default-secret-value";

        String encrypted = EncryptUtil.encrypt(plain, null);
        String decrypted = EncryptUtil.decrypt(encrypted, "");

        assertEquals(plain, decrypted);
    }

    @Test
    void decryptWithWrongSecretThrowsRuntimeException() {
        String encrypted = EncryptUtil.encrypt("hello", "right-secret");

        assertThrows(RuntimeException.class, () -> EncryptUtil.decrypt(encrypted, "wrong-secret"));
    }
}
