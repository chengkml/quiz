package com.ck.quiz.ocr.service.impl;

import com.ck.quiz.ocr.service.OcrService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.InputStream;

@Service
public class OcrServiceImpl implements OcrService {

    @Override
    public String recognizeFromFile(File imageFile) {
        return null;
    }

    @Override
    public String recognizeFromUrl(String imageUrl) {
        return null;
    }

    @Override
    public String recognizeFromInputStream(InputStream is) {
        return null;
    }

    @Override
    public String recognizeFromMultiFile(MultipartFile multipartFile) {
        return null;
    }

}