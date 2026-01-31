package com.ck.quiz.orchestration.engine;

import com.ck.quiz.datasource.service.DatasourceService;
import com.ck.quiz.llmmodel.service.LLMModelService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class WorkflowEngine {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ApplicationContext applicationContext;

    public Map<String, Object> execute(String definitionJson, Map<String, Object> inputs) {
        Map<String, Object> context = new HashMap<>(inputs);
        try {
            WorkflowGraph graph = objectMapper.readValue(definitionJson, WorkflowGraph.class);

            // Find start node
            WorkflowGraph.NodeDef currentNode = graph.getNodes().stream()
                    .filter(n -> "start".equalsIgnoreCase(n.getType()))
                    .findFirst()
                    .orElse(null);

            if (currentNode == null) {
                throw new RuntimeException("Start node not found");
            }

            int safetyCounter = 0;
            while (currentNode != null && safetyCounter < 100) {
                safetyCounter++;
                log.info("Executing node: {} ({})", currentNode.getName(), currentNode.getType());

                // Execute logic based on type
                Object result = executeNode(currentNode, context);
                if (result instanceof Map) {
                    context.putAll((Map<String, Object>) result);
                } else {
                    context.put(currentNode.getId() + "_output", result);
                }

                if ("end".equalsIgnoreCase(currentNode.getType())) {
                    break;
                }

                // Find next node
                String nodeId = currentNode.getId();
                WorkflowGraph.EdgeDef edge = graph.getEdges().stream()
                        .filter(e -> e.getSource().equals(nodeId))
                        .findFirst()
                        .orElse(null);

                if (edge == null) {
                    break;
                }

                String nextId = edge.getTarget();
                currentNode = graph.getNodes().stream()
                        .filter(n -> n.getId().equals(nextId))
                        .findFirst()
                        .orElse(null);
            }

            return context;
        } catch (Exception e) {
            log.error("Workflow execution failed", e);
            context.put("_error", e.getMessage());
            return context;
        }
    }

    private Object executeNode(WorkflowGraph.NodeDef node, Map<String, Object> context) {
        String type = node.getType().toLowerCase();
        Map<String, Object> config = node.getConfig() != null ? node.getConfig() : new HashMap<>();

        switch (type) {
            case "llm":
                return executeLlmNode(config, context);
            case "sql":
                return executeSqlNode(config, context);
            case "log":
                log.info("WORKFLOW LOG: {}", config.get("message"));
                return null;
            case "start":
            case "end":
            default:
                return null;
        }
    }

    private Object executeLlmNode(Map<String, Object> config, Map<String, Object> context) {
        String modelName = (String) config.get("modelName");
        String promptTemplate = (String) config.get("prompt");

        if (modelName == null || promptTemplate == null) {
            return "Error: Missing modelName or prompt";
        }

        // Replace variables in promptTemplate: {{varName}}
        String p = promptTemplate;
        for (Map.Entry<String, Object> entry : context.entrySet()) {
            p = p.replace("{{" + entry.getKey() + "}}", String.valueOf(entry.getValue()));
        }

        try {
            LLMModelService modelService = applicationContext.getBean(LLMModelService.class);
            org.springframework.ai.openai.OpenAiChatModel chatModel = modelService.getChatModel(modelName);
            if (chatModel == null)
                return "Error: ChatModel not found: " + modelName;

            return chatModel.call(p);
        } catch (Exception e) {
            log.error("LLM execution failed", e);
            return "LLM Error: " + e.getMessage();
        }
    }

    private Object executeSqlNode(Map<String, Object> config, Map<String, Object> context) {
        String dsId = (String) config.get("datasourceId");
        String sqlTemplate = (String) config.get("sql");

        if (dsId == null || sqlTemplate == null) {
            return "Error: Missing datasourceId or sql";
        }

        String sql = sqlTemplate;
        for (Map.Entry<String, Object> entry : context.entrySet()) {
            sql = sql.replace("{{" + entry.getKey() + "}}", String.valueOf(entry.getValue()));
        }

        try {
            DatasourceService dsService = applicationContext.getBean(DatasourceService.class);
            return dsService.executeQuery(dsId, sql);
        } catch (Exception e) {
            log.error("SQL execution failed", e);
            return "SQL Error: " + e.getMessage();
        }
    }
}
