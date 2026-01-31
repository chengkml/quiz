package com.ck.quiz.orchestration.engine;

import lombok.Data;
import java.util.Map;
import java.util.List;

@Data
public class WorkflowGraph {
    private List<NodeDef> nodes;
    private List<EdgeDef> edges;

    @Data
    public static class NodeDef {
        private String id;
        private String name;
        private String type;
        private Map<String, Object> config;
    }

    @Data
    public static class EdgeDef {
        private String id;
        private String source;
        private String target;
        private String condition;
    }
}
