package com.ck.quiz.utils;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.openxml4j.exceptions.OpenXML4JException;
import org.apache.poi.openxml4j.opc.OPCPackage;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.eventusermodel.ReadOnlySharedStringsTable;
import org.apache.poi.xssf.eventusermodel.XSSFReader;
import org.apache.poi.xssf.eventusermodel.XSSFSheetXMLHandler;
import org.apache.poi.xssf.model.StylesTable;
import org.apache.poi.xssf.streaming.SXSSFCell;
import org.apache.poi.xssf.streaming.SXSSFRow;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.usermodel.*;
import org.apache.xmlbeans.XmlOptions;
import org.apache.xmlbeans.impl.common.SAXHelper;
import org.xml.sax.ContentHandler;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.XMLReader;

import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;
import java.io.InputStream;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.*;

@Slf4j
public class ExcelTemplateHelper {

    public static Map<String, Object> readData(SXSSFSheet sheet, String loopKey, SXSSFSheet srcSheet) {
        return readDataFromTpl(sheet, loopKey, readTemplate(srcSheet, loopKey));
    }

    private static Map<String, Object> readDataFromTpl(SXSSFSheet sheet, String loopKey, Map<Integer, Map<Boolean, Map<Integer, String>>> tpl) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> loop = new ArrayList<>();
        boolean startLoop = false;
        int startLoopRow = 0;
        for (int r = sheet.getFirstRowNum(); r <= sheet.getLastRowNum(); r++) {
            if (!tpl.containsKey(r) && !startLoop) {
                continue;
            }
            SXSSFRow row = sheet.getRow(r);
            if (tpl.containsKey(r)) {
                if (tpl.get(r).containsKey(false)) {
                    if (row != null) {
                        int finalR = r;
                        tpl.get(r).get(false).forEach((ki, k) -> {
                            result.put(k, "");
                            result.put(k + "ColNum", ki);
                            result.put(k + "RowNum", finalR);
                        });
                        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
                            if (!tpl.get(r).get(false).containsKey(c)) {
                                continue;
                            }
                            SXSSFCell cell = row.getCell(c);
                            result.put(tpl.get(r).get(false).get(c) + "ColNum", c);
                            result.put(tpl.get(r).get(false).get(c) + "RowNum", r);
                            if (cell != null) {
                                String value = getCellStringValue(cell);
                                result.put(tpl.get(r).get(false).get(c), value);
                            }
                        }
                    }
                } else {
                    startLoop = true;
                    startLoopRow = r;
                    Map<String, Object> temp = new HashMap<>();
                    loop.add(temp);
                    if (row != null) {
                        int finalR1 = r;
                        tpl.get(r).get(true).forEach((ki, k) -> {
                            temp.put(k, "");
                            temp.put(k + "ColNum", ki);
                            temp.put(k + "RowNum", finalR1);
                        });
                        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
                            if (!tpl.get(r).get(true).containsKey(c)) {
                                continue;
                            }
                            SXSSFCell cell = row.getCell(c);
                            temp.put(tpl.get(r).get(true).get(c) + "RowNum", r);
                            temp.put(tpl.get(r).get(true).get(c) + "ColNum", c);
                            if (cell != null) {
                                String value = getCellStringValue(cell);
                                temp.put(tpl.get(r).get(true).get(c), value);
                            }
                        }
                    }
                }
            } else {
                Map<String, Object> temp = new HashMap<>();
                loop.add(temp);
                if (row != null) {
                    int finalR2 = r;
                    tpl.get(startLoopRow).get(true).forEach((ki, k) -> {
                        temp.put(k, "");
                        temp.put(k + "ColNum", ki);
                        temp.put(k + "RowNum", finalR2);
                    });
                    for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
                        if (!tpl.get(startLoopRow).get(true).containsKey(c)) {
                            continue;
                        }
                        SXSSFCell cell = row.getCell(c);
                        temp.put(tpl.get(startLoopRow).get(true).get(c) + "RowNum", r);
                        temp.put(tpl.get(startLoopRow).get(true).get(c) + "ColNum", c);
                        if (cell != null) {
                            String value = getCellStringValue(cell);
                            temp.put(tpl.get(startLoopRow).get(true).get(c), value);
                        }
                    }
                }
            }
        }
        result.put(loopKey, loop);
        return result;
    }

    public static Map<Integer, Map<Boolean, Map<Integer, String>>> readTemplate(SXSSFSheet sheet, String loopKey) {
        Map<Integer, Map<Boolean, Map<Integer, String>>> result = new LinkedHashMap<>();
        for (int r = sheet.getFirstRowNum(); r <= sheet.getLastRowNum(); r++) {
            SXSSFRow row = sheet.getRow(r);
            if (row != null) {
                for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
                    SXSSFCell cell = row.getCell(c);
                    if (cell != null) {
                        String value = getCellStringValue(cell);
                        if (StringUtils.isNotBlank(value)) {
                            if (value.startsWith("{{") && value.endsWith("}}")) {
                                if (value.startsWith("{{" + loopKey + ".")) {
                                    result.computeIfAbsent(r, key -> new HashMap<>()).computeIfAbsent(true, key -> new HashMap<>()).put(c, value.substring(3 + loopKey.length(), value.length() - 2));
                                } else {
                                    result.computeIfAbsent(r, key -> new HashMap<>()).computeIfAbsent(false, key -> new HashMap<>()).put(c, value.substring(2, value.length() - 2));
                                }
                            }
                        }
                    }
                }
            }
        }
        return result;
    }

    public static Map<String, Object> readData(XSSFSheet sheet, String loopKey, XSSFSheet srcSheet) {
        return readDataFromTpl(sheet, loopKey, readTemplate(srcSheet, loopKey));
    }

    private static Map<String, Object> readDataFromTpl(XSSFSheet sheet, String loopKey, Map<Integer, Map<Boolean, Map<Integer, String>>> tpl) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> loop = new ArrayList<>();
        boolean startLoop = false;
        int startLoopRow = 0;
        for (int r = sheet.getFirstRowNum(); r <= sheet.getLastRowNum(); r++) {
            if (!tpl.containsKey(r) && !startLoop) {
                continue;
            }
            XSSFRow row = sheet.getRow(r);
            if (tpl.containsKey(r)) {
                if (tpl.get(r).containsKey(false)) {
                    if (row != null) {
                        int finalR = r;
                        tpl.get(r).get(false).forEach((ki, k) -> {
                            result.put(k, "");
                            result.put(k + "ColNum", ki);
                            result.put(k + "RowNum", finalR);
                        });
                        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
                            if (!tpl.get(r).get(false).containsKey(c)) {
                                continue;
                            }
                            XSSFCell cell = row.getCell(c);
                            result.put(tpl.get(r).get(false).get(c) + "RowNum", r);
                            result.put(tpl.get(r).get(false).get(c) + "ColNum", c);
                            if (cell != null) {
                                String value = getCellStringValue(cell);
                                result.put(tpl.get(r).get(false).get(c), value);
                            }
                        }
                    }
                } else {
                    startLoop = true;
                    startLoopRow = r;
                    Map<String, Object> temp = new HashMap<>();
                    loop.add(temp);
                    if (row != null) {
                        int finalR1 = r;
                        tpl.get(r).get(true).forEach((ki, k) -> {
                            temp.put(k, "");
                            temp.put(k + "ColNum", ki);
                            temp.put(k + "RowNum", finalR1);
                        });
                        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
                            if (!tpl.get(r).get(true).containsKey(c)) {
                                continue;
                            }
                            XSSFCell cell = row.getCell(c);
                            temp.put(tpl.get(r).get(true).get(c) + "RowNum", r);
                            temp.put(tpl.get(r).get(true).get(c) + "ColNum", c);
                            if (cell != null) {
                                String value = getCellStringValue(cell);
                                temp.put(tpl.get(r).get(true).get(c), value);
                            }
                        }
                    }
                }
            } else {
                Map<String, Object> temp = new HashMap<>();
                loop.add(temp);
                if (row != null) {
                    int finalR2 = r;
                    tpl.get(startLoopRow).get(true).forEach((ki, k) -> {
                        temp.put(k, "");
                        temp.put(k + "ColNum", ki);
                        temp.put(k + "RowNum", finalR2);
                    });
                    for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
                        if (!tpl.get(startLoopRow).get(true).containsKey(c)) {
                            continue;
                        }
                        XSSFCell cell = row.getCell(c);
                        temp.put(tpl.get(startLoopRow).get(true).get(c) + "RowNum", r);
                        temp.put(tpl.get(startLoopRow).get(true).get(c) + "ColNum", c);
                        if (cell != null) {
                            String value = getCellStringValue(cell);
                            temp.put(tpl.get(startLoopRow).get(true).get(c), value);
                        }
                    }
                }
            }
        }
        result.put(loopKey, loop);
        return result;
    }

    public static Map<Integer, Map<Boolean, Map<Integer, String>>> readTemplate(XSSFSheet sheet, String loopKey) {
        Map<Integer, Map<Boolean, Map<Integer, String>>> result = new LinkedHashMap<>();
        for (int r = sheet.getFirstRowNum(); r <= sheet.getLastRowNum(); r++) {
            XSSFRow row = sheet.getRow(r);
            for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
                XSSFCell cell = row.getCell(c);
                if (cell != null) {
                    String value = getCellStringValue(cell);
                    if (StringUtils.isNotBlank(value)) {
                        if (value.startsWith("{{") && value.endsWith("}}")) {
                            if (value.startsWith("{{" + loopKey + ".")) {
                                result.computeIfAbsent(r, key -> new HashMap<>()).computeIfAbsent(true, key -> new HashMap<>()).put(c, value.substring(3 + loopKey.length(), value.length() - 2));
                            } else {
                                result.computeIfAbsent(r, key -> new HashMap<>()).computeIfAbsent(false, key -> new HashMap<>()).put(c, value.substring(2, value.length() - 2));
                            }
                        }
                    }
                }
            }
        }
        return result;
    }

    public static LinkedHashMap<Integer, Integer> readTemplateColLens(XSSFSheet sheet, int rowStart) {
        LinkedHashMap<Integer, Integer> result = new LinkedHashMap<>();
        XSSFRow row = sheet.getRow(rowStart);
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            XSSFCell cell = row.getCell(c);
            if (cell != null) {
                result.put(c, sheet.getColumnWidth(cell.getColumnIndex()));
            }
        }
        return result;
    }

    public static void handleSheet(XSSFSheet sheet, Map<String, String> staticSource, List<Map<String, Object>> dynamicSourceList, XSSFCellStyle style) {
        for (int i = sheet.getFirstRowNum(); i <= sheet.getLastRowNum(); i++) {
            XSSFRow row = sheet.getRow(i);
            Map<String, Object> dynamicSource = parseDynamicRow(row, dynamicSourceList);
            if (dynamicSource != null) {
                i = handleDynamicRows(dynamicSource, sheet, i, style);
            } else {
                replaceRowValue(row, staticSource, null, style);
            }
        }
    }

    private static Map<String, Object> parseDynamicRow(XSSFRow row, List<Map<String, Object>> dynamicSourceList) {
        if (dynamicSourceList.isEmpty()) {
            return null;
        }
        for (int i = row.getFirstCellNum(); i < row.getLastCellNum(); i++) {
            XSSFCell cell = row.getCell(i);
            if (cell != null) {
                String value = getCellStringValue(cell);
                if (value != null) {
                    for (Map<String, Object> current : dynamicSourceList) {
                        String id = MapUtils.getString(current, "loopId");
                        if (value.startsWith("{{" + id + ".")) {
                            return current;
                        }
                    }
                }
            }
        }
        return null;
    }

    private static int handleDynamicRows(Map<String, Object> dynamicSource, XSSFSheet sheet, int rowIndex, XSSFCellStyle style) {
        if (dynamicSource.isEmpty()) {
            return rowIndex;
        }
        String id = MapUtils.getString(dynamicSource, "loopId");
        List<Map<String, String>> dataList = (List<Map<String, String>>) dynamicSource.get("dataList");
        if (dataList == null) {
            return rowIndex;
        }
        int rows = dataList.size();
        // 因为模板行本身占1行，所以-1
        int copyRows = rows - 1;
        if (copyRows > 0) {
            // shiftRows: 从startRow到最后一行，全部向下移copyRows行
            sheet.shiftRows(rowIndex, sheet.getLastRowNum(), copyRows, true, false);
            // 拷贝策略
            CellCopyPolicy cellCopyPolicy = new CellCopyPolicy();
            cellCopyPolicy.setCopyCellValue(true);
            cellCopyPolicy.setCopyCellStyle(true);
            // 这里模板row已经变成了startRow + copyRows,
            int templateRow = rowIndex + copyRows;
            // 因为下移了，所以要把模板row拷贝到所有空行
            for (int i = 0; i < copyRows; i++) {
                sheet.copyRows(templateRow, templateRow, rowIndex + i, cellCopyPolicy);
            }
        }
        // 替换动态行的值
        for (int j = rowIndex; j < rowIndex + rows; j++) {
            replaceRowValue(sheet.getRow(j), dataList.get(j - rowIndex), id, style);
        }
        return rowIndex + copyRows;
    }

    private static void replaceRowValue(XSSFRow row, Map<String, String> map, String prefixKey, XSSFCellStyle style) {
        if (map.isEmpty()) {
            return;
        }
        for (int i = row.getFirstCellNum(); i < row.getLastCellNum(); i++) {
            XSSFCell cell = row.getCell(i);
            replaceCellValue(cell, map, prefixKey, style);
        }
    }

    private static void replaceCellValue(XSSFCell cell, Map<String, String> map, String prefixKey, XSSFCellStyle style) {
        if (cell == null) {
            return;
        }
        String cellValue = getCellStringValue(cell);
        if (StringUtils.isBlank(cellValue)) {
            return;
        }
        boolean flag = false;
        prefixKey = StringUtils.isBlank(prefixKey) ? "" : (prefixKey + ".");
        for (Map.Entry<String, String> current : map.entrySet()) {
            // 循环所有，因为可能一行有多个占位符
            String template = "{{" + prefixKey + current.getKey() + "}}";
            if (cellValue.contains(template)) {
                String value = current.getValue();
                if (value == null) {
                    value = "";
                }
                String oldCellValue = cellValue;
                cellValue = cellValue.replace(template, value);
                if (!oldCellValue.equals(cellValue)) {
                    cell.setCellStyle(style);
                } else {
                    cellValue = "";
                }
                flag = true;
            }
        }
        if (cellValue.startsWith("{{") && cellValue.endsWith("}}")) {
            cellValue = "";
            flag = true;
        }
        if (flag) {
            cell.setCellValue(cellValue);
        }
    }

    public static XSSFCellStyle getBorderStyle(XSSFWorkbook xssfBook) {
        XSSFCellStyle style = xssfBook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBottomBorderColor(IndexedColors.BLACK.getIndex());
        style.setBorderLeft(BorderStyle.THIN);
        style.setLeftBorderColor(IndexedColors.BLACK.getIndex());
        style.setBorderRight(BorderStyle.THIN);
        style.setRightBorderColor(IndexedColors.BLACK.getIndex());
        style.setBorderTop(BorderStyle.THIN);
        style.setTopBorderColor(IndexedColors.BLACK.getIndex());
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setWrapText(true);
        return style;
    }

    public static List<String> readNotLoopKeys(XSSFSheet sheet, String loopKey) {
        Set<String> result = new HashSet<>();
        for (int r = sheet.getFirstRowNum(); r <= sheet.getLastRowNum(); r++) {
            XSSFRow row = sheet.getRow(r);
            for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
                XSSFCell cell = row.getCell(c);
                if (cell != null) {
                    String value = getCellStringValue(cell);
                    if (StringUtils.isNotBlank(value)) {
                        if (value.startsWith("{{") && value.endsWith("}}")) {
                            if (!value.startsWith("{{" + loopKey + ".")) {
                                result.add(value.substring(2, value.length() - 2));
                            }
                        }
                    }
                }
            }
        }
        return new ArrayList<>(result);
    }

    private static String getCellStringValue(Cell cell) {
        if (cell == null) {
            return "";
        }

        switch (cell.getCellType()) {
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    // 注意：HH 为24小时制，hh 为12小时制
                    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                    return sdf.format(cell.getDateCellValue());
                } else {
                    return new DecimalFormat("0").format(cell.getNumericCellValue());
                }
            case BLANK:
                return "";
            case ERROR:
                return "/";
            case FORMULA:
                // 如果单元格是公式类型，获取公式计算结果
                FormulaEvaluator evaluator = cell.getSheet().getWorkbook().getCreationHelper().createFormulaEvaluator();
                CellValue cellValue = evaluator.evaluate(cell);
                switch (cellValue.getCellType()) {
                    case BOOLEAN:
                        return String.valueOf(cellValue.getBooleanValue());
                    case STRING:
                        return cellValue.getStringValue();
                    case NUMERIC:
                        if (DateUtil.isCellDateFormatted(cell)) {
                            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                            return sdf.format(cell.getDateCellValue());
                        } else {
                            return new DecimalFormat("0").format(cellValue.getNumberValue());
                        }
                    case ERROR:
                        return "/";
                    default:
                        return "";
                }
            default:
                return cell.toString();
        }
    }

    public static Map<String, Map<String, Object>> readBigData(InputStream is, String loopKey, List<String> targetSheets, XSSFSheet srcSheet) throws OpenXML4JException, IOException, ParserConfigurationException, SAXException {
        return readBigDataFromTpl(is, loopKey, targetSheets, readTemplate(srcSheet, loopKey));
    }

    public static Map<String, Map<String, Object>> readBigDataFromTpl(InputStream is, String loopKey, List<String> targetSheets, Map<Integer, Map<Boolean, Map<Integer, String>>> tpl) throws OpenXML4JException, IOException, ParserConfigurationException, SAXException {
        Map<String, Map<Integer, Map<Integer, String>>> data = readBigData(targetSheets, is);
        Map<String, Map<String, Object>> sumResult = new HashMap<>();
        data.forEach((sheetName, sheetData) -> {
            Map<String, Object> result = new HashMap<>();
            sumResult.put(sheetName, result);
            List<Map<String, Object>> loop = new ArrayList<>();
            boolean startLoop = false;
            int startLoopRow = 0;
            Iterator<Map.Entry<Integer, Map<Integer, String>>> rowIt = sheetData.entrySet().iterator();
            while (rowIt.hasNext()) {
                Map.Entry<Integer, Map<Integer, String>> re = rowIt.next();
                int r = re.getKey();
                Map<Integer, String> rowData = re.getValue();
                if (!tpl.containsKey(r) && !startLoop) {
                    continue;
                }
                if (tpl.containsKey(r)) {
                    if (tpl.get(r).containsKey(false)) {
                        if (rowData != null) {
                            int finalR = r;
                            tpl.get(r).get(false).forEach((ki, k) -> {
                                result.put(k, "");
                                result.put(k + "ColNum", ki);
                                result.put(k + "RowNum", finalR);
                            });
                            Iterator<Map.Entry<Integer, String>> colIt = rowData.entrySet().iterator();
                            while (colIt.hasNext()) {
                                Map.Entry<Integer, String> ce = colIt.next();
                                int c = ce.getKey();
                                if (!tpl.get(r).get(false).containsKey(c)) {
                                    continue;
                                }
                                String value = ce.getValue();
                                if (value == null) {
                                    value = "";
                                }
                                result.put(tpl.get(r).get(false).get(c) + "RowNum", r);
                                result.put(tpl.get(r).get(false).get(c) + "ColNum", c);
                                result.put(tpl.get(r).get(false).get(c), value);
                            }
                        }
                    } else {
                        startLoop = true;
                        startLoopRow = r;
                        Map<String, Object> temp = new HashMap<>();
                        loop.add(temp);
                        if (rowData != null) {
                            int finalR1 = r;
                            tpl.get(r).get(true).forEach((ki, k) -> {
                                temp.put(k, "");
                                temp.put(k + "ColNum", ki);
                                temp.put(k + "RowNum", finalR1);
                            });
                            Iterator<Map.Entry<Integer, String>> colIt = rowData.entrySet().iterator();
                            while (colIt.hasNext()) {
                                Map.Entry<Integer, String> ce = colIt.next();
                                int c = ce.getKey();
                                if (!tpl.get(r).get(true).containsKey(c)) {
                                    continue;
                                }
                                String value = ce.getValue();
                                if (value == null) {
                                    value = "";
                                }
                                temp.put(tpl.get(r).get(true).get(c) + "RowNum", r);
                                temp.put(tpl.get(r).get(true).get(c) + "ColNum", c);
                                temp.put(tpl.get(r).get(true).get(c), value);
                            }
                        }
                    }
                } else {
                    Map<String, Object> temp = new HashMap<>();
                    loop.add(temp);
                    if (rowData != null) {
                        int finalR2 = r;
                        tpl.get(startLoopRow).get(true).forEach((ki, k) -> {
                            temp.put(k, "");
                            temp.put(k + "ColNum", ki);
                            temp.put(k + "RowNum", finalR2);
                        });
                        Iterator<Map.Entry<Integer, String>> colIt = rowData.entrySet().iterator();
                        while (colIt.hasNext()) {
                            Map.Entry<Integer, String> ce = colIt.next();
                            int c = ce.getKey();
                            if (!tpl.get(startLoopRow).get(true).containsKey(c)) {
                                continue;
                            }
                            String value = ce.getValue();
                            if (value == null) {
                                value = "";
                            }
                            temp.put(tpl.get(startLoopRow).get(true).get(c) + "RowNum", r);
                            temp.put(tpl.get(startLoopRow).get(true).get(c) + "ColNum", c);
                            temp.put(tpl.get(startLoopRow).get(true).get(c), value);
                        }
                    }
                }
            }
            result.put(loopKey, loop);
        });
        return sumResult;
    }

    public static Map<String, Map<String, Object>> readBigDataFromTpl(Map<String, Map<Integer, Map<Integer, String>>> data, String loopKey, XSSFSheet srcSheet) {
        Map<Integer, Map<Boolean, Map<Integer, String>>> tpl = readTemplate(srcSheet, loopKey);
        Map<String, Map<String, Object>> sumResult = new HashMap<>();
        data.forEach((sheetName, sheetData) -> {
            Map<String, Object> result = new HashMap<>();
            sumResult.put(sheetName, result);
            List<Map<String, Object>> loop = new ArrayList<>();
            boolean startLoop = false;
            int startLoopRow = 0;
            Iterator<Map.Entry<Integer, Map<Integer, String>>> rowIt = sheetData.entrySet().iterator();
            while (rowIt.hasNext()) {
                Map.Entry<Integer, Map<Integer, String>> re = rowIt.next();
                int r = re.getKey();
                Map<Integer, String> rowData = re.getValue();
                if (!tpl.containsKey(r) && !startLoop) {
                    continue;
                }
                if (tpl.containsKey(r)) {
                    if (tpl.get(r).containsKey(false)) {
                        if (rowData != null) {
                            int finalR = r;
                            tpl.get(r).get(false).forEach((ki, k) -> {
                                result.put(k, "");
                                result.put(k + "ColNum", ki);
                                result.put(k + "RowNum", finalR);
                            });
                            Iterator<Map.Entry<Integer, String>> colIt = rowData.entrySet().iterator();
                            while (colIt.hasNext()) {
                                Map.Entry<Integer, String> ce = colIt.next();
                                int c = ce.getKey();
                                if (!tpl.get(r).get(false).containsKey(c)) {
                                    continue;
                                }
                                String value = ce.getValue();
                                if (value == null) {
                                    value = "";
                                }
                                result.put(tpl.get(r).get(false).get(c) + "RowNum", r);
                                result.put(tpl.get(r).get(false).get(c) + "ColNum", c);
                                result.put(tpl.get(r).get(false).get(c), value);
                            }
                        }
                    } else {
                        startLoop = true;
                        startLoopRow = r;
                        Map<String, Object> temp = new HashMap<>();
                        loop.add(temp);
                        if (rowData != null) {
                            int finalR1 = r;
                            tpl.get(r).get(true).forEach((ki, k) -> {
                                temp.put(k, "");
                                temp.put(k + "ColNum", ki);
                                temp.put(k + "RowNum", finalR1);
                            });
                            Iterator<Map.Entry<Integer, String>> colIt = rowData.entrySet().iterator();
                            while (colIt.hasNext()) {
                                Map.Entry<Integer, String> ce = colIt.next();
                                int c = ce.getKey();
                                if (!tpl.get(r).get(true).containsKey(c)) {
                                    continue;
                                }
                                String value = ce.getValue();
                                if (value == null) {
                                    value = "";
                                }
                                temp.put(tpl.get(r).get(true).get(c) + "RowNum", r);
                                temp.put(tpl.get(r).get(true).get(c) + "ColNum", c);
                                temp.put(tpl.get(r).get(true).get(c), value);
                            }
                        }
                    }
                } else {
                    Map<String, Object> temp = new HashMap<>();
                    loop.add(temp);
                    if (rowData != null) {
                        int finalR2 = r;
                        tpl.get(startLoopRow).get(true).forEach((ki, k) -> {
                            temp.put(k, "");
                            temp.put(k + "ColNum", ki);
                            temp.put(k + "RowNum", finalR2);
                        });
                        Iterator<Map.Entry<Integer, String>> colIt = rowData.entrySet().iterator();
                        while (colIt.hasNext()) {
                            Map.Entry<Integer, String> ce = colIt.next();
                            int c = ce.getKey();
                            if (!tpl.get(startLoopRow).get(true).containsKey(c)) {
                                continue;
                            }
                            String value = ce.getValue();
                            if (value == null) {
                                value = "";
                            }
                            temp.put(tpl.get(startLoopRow).get(true).get(c) + "RowNum", r);
                            temp.put(tpl.get(startLoopRow).get(true).get(c) + "ColNum", c);
                            temp.put(tpl.get(startLoopRow).get(true).get(c), value);
                        }
                    }
                }
            }
            result.put(loopKey, loop);
        });
        return sumResult;
    }

    public static Map<String, Map<Integer, Map<Integer, String>>> readBigData(List<String> targetSheets, InputStream is) throws IOException, OpenXML4JException, SAXException, ParserConfigurationException {
        OPCPackage xlsxPackage = OPCPackage.open(is);
        // 只读字符表
        ReadOnlySharedStringsTable strings = new ReadOnlySharedStringsTable(xlsxPackage);
        // Xssf读取
        XSSFReader xssfReader = new XSSFReader(xlsxPackage);
        // 样式表
        StylesTable styles = xssfReader.getStylesTable();
        //读取文件数据，生成List<InputStream>
        XSSFReader.SheetIterator sheets = (XSSFReader.SheetIterator) xssfReader.getSheetsData();
        //xml文件解析器
        XmlOptions xmlOptions = new XmlOptions();
        XMLReader parser = SAXHelper.newXMLReader(xmlOptions);
        Map<String, Map<Integer, Map<Integer, String>>> sheetDatas = new LinkedHashMap<>();
        //一个个sheet分开读取，分开处理
        while (sheets.hasNext()) {

            InputStream sheet = sheets.next();
            //获取当前sheet名
            String sheetName = sheets.getSheetName();
            if (targetSheets != null && !targetSheets.isEmpty() && !targetSheets.contains(sheetName)) {
                continue;
            }
            log.info("读取sheet:{}", sheetName);
            //解析sheet数据，这里执行结束，datas将有数据
            ContentHandler handler = new XSSFSheetXMLHandler(styles, strings, new XSSFSheetXMLHandler.SheetContentsHandler() {
                @Override
                public void startRow(int i) {
                    log.debug("读取行:【{}】", i);
                }

                @Override
                public void endRow(int i) {
                    log.debug("读取行:【{}】结束", i);
                }

                @Override
                public void cell(String cellReference, String formattedValue, XSSFComment comment) {
                    int row = (new CellReference(cellReference)).getRow();
                    int col = (new CellReference(cellReference)).getCol();
                    sheetDatas.computeIfAbsent(sheetName, key -> new LinkedHashMap<>()).computeIfAbsent(row, key -> new LinkedHashMap<>()).put(col, formattedValue);
                }

                @Override
                public void headerFooter(String s, boolean b, String s1) {

                }
            }, false);
            InputSource sheetSource = new InputSource(sheet);
            //设置内容格式
            parser.setContentHandler(handler);
            //解析XMl文件数据
            parser.parse(sheetSource);
            //数据已经读取，释放资源
            sheet.close();
        }
        return sheetDatas;
    }

}
