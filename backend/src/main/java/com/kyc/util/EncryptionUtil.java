package com.kyc.util;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class EncryptionUtil {

    private static final String ENCRYPT_ALGO = "AES/GCM/NoPadding";
    private static final int TAG_LENGTH_BIT = 128;
    private static final int IV_LENGTH_BYTE = 12;

    private static String SECRET_KEY;

    @Value("${app.security.encryption-secret-key}")
    public void setSecretKey(String secretKey) {
        EncryptionUtil.SECRET_KEY = secretKey;
    }

    // Returns a map { iv, cipherText }
    public static Map<String, String> encryptWithIV(String data) throws Exception {
        byte[] iv = new byte[IV_LENGTH_BYTE];
        new SecureRandom().nextBytes(iv);

        Cipher cipher = Cipher.getInstance(ENCRYPT_ALGO);
        SecretKeySpec keySpec = new SecretKeySpec(SECRET_KEY.getBytes(StandardCharsets.UTF_8), "AES");
        GCMParameterSpec gcmSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);

        byte[] encrypted = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));

        Map<String, String> result = new HashMap<>();
        result.put("iv", Base64.getEncoder().encodeToString(iv));
        result.put("cipherText", Base64.getEncoder().encodeToString(encrypted));
        return result;
    }

    // Decrypt using iv + cipherText map
    public static String decryptWithIV(Map<String, String> encryptedData) throws Exception {
        byte[] iv = Base64.getDecoder().decode(encryptedData.get("iv"));
        byte[] cipherText = Base64.getDecoder().decode(encryptedData.get("cipherText"));

        Cipher cipher = Cipher.getInstance(ENCRYPT_ALGO);
        SecretKeySpec keySpec = new SecretKeySpec(SECRET_KEY.getBytes(StandardCharsets.UTF_8), "AES");
        GCMParameterSpec gcmSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
        cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);

        byte[] decrypted = cipher.doFinal(cipherText);
        return new String(decrypted, StandardCharsets.UTF_8);
    }
}
