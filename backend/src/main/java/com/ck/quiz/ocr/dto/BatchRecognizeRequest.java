package com.ck.quiz.ocr.dto;

public class BatchRecognizeRequest {

    private String sourceRoot;
    private String targetBase;
    private String modelName;
    private Integer maxWorkers;

    public BatchRecognizeRequest() {
    }

    public BatchRecognizeRequest(String sourceRoot, String targetBase, String modelName, Integer maxWorkers) {
        this.sourceRoot = sourceRoot;
        this.targetBase = targetBase;
        this.modelName = modelName;
        this.maxWorkers = maxWorkers;
    }

    public String getSourceRoot() {
        return sourceRoot;
    }

    public void setSourceRoot(String sourceRoot) {
        this.sourceRoot = sourceRoot;
    }

    public String getTargetBase() {
        return targetBase;
    }

    public void setTargetBase(String targetBase) {
        this.targetBase = targetBase;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public Integer getMaxWorkers() {
        return maxWorkers;
    }

    public void setMaxWorkers(Integer maxWorkers) {
        this.maxWorkers = maxWorkers;
    }
}
