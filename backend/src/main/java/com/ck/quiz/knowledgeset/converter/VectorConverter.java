package com.ck.quiz.knowledgeset.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Converter
public class VectorConverter implements AttributeConverter<List<Double>, String> {

    @Override
    public String convertToDatabaseColumn(List<Double> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }
        // Ensure format [1.1,2.2,3.3] without spaces
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < attribute.size(); i++) {
            sb.append(attribute.get(i));
            if (i < attribute.size() - 1) {
                sb.append(",");
            }
        }
        sb.append("]");
        return sb.toString();
    }

    @Override
    public List<Double> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return new ArrayList<>();
        }
        // Remove brackets and split
        String content = dbData.replaceAll("[\\[\\]]", "");
        if (content.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(content.split(","))
                .map(String::trim)
                .map(Double::valueOf)
                .collect(Collectors.toList());
    }
}
