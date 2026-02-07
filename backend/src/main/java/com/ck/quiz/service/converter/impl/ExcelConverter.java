package com.ck.quiz.service.converter.impl;

import com.ck.quiz.service.converter.DocumentConverter;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.Set;

@Component
public class ExcelConverter implements DocumentConverter {

    private static final Set<String> SUPPORTED_TYPES = Set.of(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-excel" // .xls
    );

    @Override
    public String convert(InputStream inputStream) throws Exception {
        Workbook workbook = WorkbookFactory.create(inputStream);
        StringBuilder markdown = new StringBuilder();

        for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
            Sheet sheet = workbook.getSheetAt(i);
            markdown.append("## Sheet: ").append(sheet.getSheetName()).append("\n\n");

            // Iterate rows
            int maxCols = 0;
            for (Row row : sheet) {
                maxCols = Math.max(maxCols, row.getLastCellNum());
            }

            if (maxCols <= 0)
                continue;

            // Generate Header (Row 1 as header, or empty if no data)
            // Just assume first row found is header? Or just dump grid?
            // Let's dump grid.

            // We need to iterate by index to align columns
            int lastRowNum = sheet.getLastRowNum();
            for (int r = 0; r <= lastRowNum; r++) {
                Row row = sheet.getRow(r);
                markdown.append("|");
                for (int c = 0; c < maxCols; c++) {
                    Cell cell = row == null ? null : row.getCell(c);
                    String cellValue = getCellValue(cell);
                    markdown.append(" ").append(cellValue).append(" |");
                }
                markdown.append("\n");

                // Add separator after first row
                if (r == 0) {
                    markdown.append("|");
                    for (int c = 0; c < maxCols; c++) {
                        markdown.append(" --- |");
                    }
                    markdown.append("\n");
                }
            }
            markdown.append("\n");
        }

        return markdown.toString();
    }

    private String getCellValue(Cell cell) {
        if (cell == null)
            return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().replace("|", "\\|").replace("\n", "<br>");
            case NUMERIC -> String.valueOf(cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula(); // Or evaluate?
            default -> "";
        };
    }

    @Override
    public boolean supports(String mediaType) {
        return SUPPORTED_TYPES.contains(mediaType);
    }
}
