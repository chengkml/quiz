package com.ck.quiz.utils;

import javax.crypto.Cipher;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.Arrays;
import java.util.Base64;

public class EncryptUtil {

    private static final String DEFAULT_SECRET = "ck_quiz_password_manager_secret";
    private static final String ENCRYPTED_PAYLOAD_PREFIX = "v2$";
    private static final int PBKDF2_ITERATIONS = 65536;
    private static final int KEY_LENGTH = 256;
    private static final int SALT_LENGTH = 16;
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private EncryptUtil() {
    }

    private static String resolveSecret(String secret) {
        if (secret != null && !secret.isBlank()) {
            return secret;
        }

        String propertySecret = System.getProperty("quiz.password.master-secret");
        if (propertySecret != null && !propertySecret.isBlank()) {
            return propertySecret;
        }

        String envSecret = System.getenv("QUIZ_PASSWORD_MASTER_SECRET");
        if (envSecret != null && !envSecret.isBlank()) {
            return envSecret;
        }

        return DEFAULT_SECRET;
    }

    private static SecretKeySpec getLegacyKey(String myKey) {
        try {
            byte[] key = myKey.getBytes(StandardCharsets.UTF_8);
            MessageDigest sha = MessageDigest.getInstance("SHA-1");
            key = sha.digest(key);
            key = Arrays.copyOf(key, 16);
            return new SecretKeySpec(key, "AES");
        } catch (Exception e) {
            throw new RuntimeException("Error while generating legacy key", e);
        }
    }

    private static SecretKeySpec deriveKey(String secret, byte[] salt) {
        try {
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            KeySpec spec = new PBEKeySpec(secret.toCharArray(), salt, PBKDF2_ITERATIONS, KEY_LENGTH);
            byte[] key = factory.generateSecret(spec).getEncoded();
            return new SecretKeySpec(key, "AES");
        } catch (Exception e) {
            throw new RuntimeException("Error while deriving encryption key", e);
        }
    }

    public static String encrypt(String plainText, String secret) {
        if (plainText == null) {
            return "";
        }

        try {
            byte[] salt = new byte[SALT_LENGTH];
            byte[] iv = new byte[GCM_IV_LENGTH];
            SECURE_RANDOM.nextBytes(salt);
            SECURE_RANDOM.nextBytes(iv);

            SecretKeySpec secretKey = deriveKey(resolveSecret(secret), salt);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            return ENCRYPTED_PAYLOAD_PREFIX
                    + Base64.getEncoder().encodeToString(salt)
                    + "$"
                    + Base64.getEncoder().encodeToString(iv)
                    + "$"
                    + Base64.getEncoder().encodeToString(cipherText);
        } catch (Exception e) {
            throw new RuntimeException("Error while encrypting password data", e);
        }
    }

    public static String decrypt(String encryptedText, String secret) {
        if (encryptedText == null || encryptedText.isBlank()) {
            return "";
        }

        if (isV2Encrypted(encryptedText)) {
            return decryptV2(encryptedText, secret);
        }
        return decryptLegacy(encryptedText, secret);
    }

    public static boolean isV2Encrypted(String encryptedText) {
        return encryptedText != null && encryptedText.startsWith(ENCRYPTED_PAYLOAD_PREFIX);
    }

    private static String decryptV2(String encryptedText, String secret) {
        try {
            String payload = encryptedText.substring(ENCRYPTED_PAYLOAD_PREFIX.length());
            String[] parts = payload.split("\\$");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid encrypted payload format");
            }

            byte[] salt = Base64.getDecoder().decode(parts[0]);
            byte[] iv = Base64.getDecoder().decode(parts[1]);
            byte[] cipherText = Base64.getDecoder().decode(parts[2]);

            SecretKeySpec secretKey = deriveKey(resolveSecret(secret), salt);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] plainBytes = cipher.doFinal(cipherText);
            return new String(plainBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error while decrypting password data", e);
        }
    }

    private static String decryptLegacy(String encryptedText, String secret) {
        try {
            String legacySecret = (secret == null || secret.isBlank()) ? DEFAULT_SECRET : secret;
            SecretKeySpec secretKey = getLegacyKey(legacySecret);
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5PADDING");
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            return new String(cipher.doFinal(Base64.getDecoder().decode(encryptedText)), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error while decrypting legacy password data", e);
        }
    }
}
