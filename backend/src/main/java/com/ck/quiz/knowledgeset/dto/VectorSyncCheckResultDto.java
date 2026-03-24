package com.ck.quiz.knowledgeset.dto;

import lombok.Data;

@Data
public class VectorSyncCheckResultDto {
    private VectorSyncCheckSummaryDto summary;
    private Checks checks;

    @Data
    public static class Checks {
        private VectorSyncCheckItemDto chunkWithoutVector;
        private VectorSyncCheckItemDto vectorWithoutChunk;
        private VectorSyncCheckItemDto chunkWithoutSet;
        private VectorSyncCheckItemDto sourceWithoutSet;
    }
}
