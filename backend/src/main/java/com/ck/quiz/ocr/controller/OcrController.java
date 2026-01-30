package com.ck.quiz.ocr.controller;

import com.ck.quiz.ocr.service.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/ocr")
public class OcrController {

	@Autowired
	private OcrService ocrService;

	@PostMapping(value = "/recognize", produces = "text/event-stream")
	public org.springframework.http.ResponseEntity<SseEmitter> recognize(@RequestParam("image") MultipartFile image,
			@RequestParam(value = "model", required = false) String model) {
		SseEmitter emitter = null;
		try {
			emitter = ocrService.recognizeStream(image, model);
		} catch (Exception e) {
			emitter = new SseEmitter(0L);
			try {
				emitter.send("[ERROR]" + e.getMessage());
			} catch (Exception ex) {
				// ignore
			}
			emitter.completeWithError(e);
		}
		return org.springframework.http.ResponseEntity.ok()
				.header("X-Accel-Buffering", "no")
				.header("Cache-Control", "no-cache")
				.header("Connection", "keep-alive")
				.body(emitter);
	}

}
