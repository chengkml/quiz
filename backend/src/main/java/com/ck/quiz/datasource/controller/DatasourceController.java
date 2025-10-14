package com.ck.quiz.datasource.controller;

import com.ck.quiz.datasource.dto.DatasourceCreateDto;
import com.ck.quiz.datasource.dto.DatasourceQueryDto;
import com.ck.quiz.datasource.dto.DatasourceUpdateDto;
import com.ck.quiz.datasource.dto.DatabaseSchemaDto;
import com.ck.quiz.datasource.service.DatasourceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ContentDisposition;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.*;

@Tag(name = "数据源管理", description = "数据库连接信息管理API接口")
@RestController
@RequestMapping("/api/datasource")
public class DatasourceController {

    @Autowired
    private DatasourceService datasourceService;

    @Operation(summary = "创建数据源", description = "创建新的数据库连接信息")
    @PostMapping("/create")
    public ResponseEntity createDatasource(
            @Parameter(description = "数据源创建信息", required = true) @Valid @RequestBody DatasourceCreateDto createDto) {
        return ResponseEntity.ok(datasourceService.createDatasource(createDto));
    }

    @Operation(summary = "更新数据源", description = "更新指定数据源的信息")
    @PutMapping("/update")
    public ResponseEntity updateDatasource(
            @Parameter(description = "数据源更新信息", required = true) @Valid @RequestBody DatasourceUpdateDto updateDto) {
        return ResponseEntity.ok(datasourceService.updateDatasource(updateDto));
    }

    @Operation(summary = "删除数据源", description = "根据ID删除指定数据源")
    @DeleteMapping("/{id}")
    public ResponseEntity deleteDatasource(
            @Parameter(description = "数据源ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(datasourceService.deleteDatasource(id));
    }

    @Operation(summary = "获取数据源详情", description = "根据ID获取数据源详细信息")
    @GetMapping("/{id}")
    public ResponseEntity getDatasourceById(
            @Parameter(description = "数据源ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(datasourceService.getDatasourceById(id));
    }

    @Operation(summary = "分页查询数据源", description = "根据条件分页查询数据源列表")
    @GetMapping
    public ResponseEntity searchDatasources(
            @Parameter(description = "名称关键字") @RequestParam(required = false) String name,
            @Parameter(description = "是否启用") @RequestParam(required = false) Boolean active,
            @Parameter(description = "页码") @RequestParam(defaultValue = "0") int pageNum,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int pageSize,
            @Parameter(description = "排序字段") @RequestParam(defaultValue = "create_date") String sortColumn,
            @Parameter(description = "排序方向") @RequestParam(defaultValue = "desc") String sortType) {
        DatasourceQueryDto queryDto = new DatasourceQueryDto();
        queryDto.setName(name);
        queryDto.setActive(active);
        queryDto.setPageNum(pageNum);
        queryDto.setPageSize(pageSize);
        queryDto.setSortColumn(sortColumn);
        queryDto.setSortType(sortType);
        return ResponseEntity.ok(datasourceService.searchDatasources(queryDto));
    }

    @Operation(summary = "测试数据源连接", description = "根据ID测试数据源连接是否成功")
    @PostMapping("/{id}/test")
    public ResponseEntity testConnection(
            @Parameter(description = "数据源ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(datasourceService.testConnection(id));
    }

    @Operation(summary = "采集数据源表结构", description = "根据ID采集数据库的表结构信息")
    @GetMapping("/{id}/schema")
    public ResponseEntity collectSchema(
            @Parameter(description = "数据源ID", required = true) @PathVariable String id,
            @Parameter(description = "schema名称（MySQL等将作为catalog使用）") @RequestParam(required = false) String schema) {
        if (schema == null || schema.isEmpty()) {
            return ResponseEntity.ok(datasourceService.collectSchema(id));
        }
        return ResponseEntity.ok(datasourceService.collectSchema(id, schema));
    }

    @Operation(summary = "导出指定schema的表结构", description = "根据ID与schema导出数据库表结构为JSON文件")
    @GetMapping("/{id}/schema/export")
    public ResponseEntity<byte[]> exportSchema(
            @Parameter(description = "数据源ID", required = true) @PathVariable String id,
            @Parameter(description = "schema名称（MySQL等将作为catalog使用）") @RequestParam(required = false) String schema) throws Exception {
        DatabaseSchemaDto dto = (schema == null || schema.isEmpty())
                ? datasourceService.collectSchema(id)
                : datasourceService.collectSchema(id, schema);

        ObjectMapper mapper = new ObjectMapper();
        byte[] bytes = mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(dto);

        String fileName = String.format("schema_%s_%s.json",
                (schema == null || schema.isEmpty()) ? "all" : schema,
                id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setContentDisposition(ContentDisposition.attachment().filename(fileName).build());

        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }

    @Operation(summary = "导出表结构为Excel", description = "根据ID与可选schema导出数据库表结构为XLSX文件")
    @GetMapping("/{id}/schema/export/excel")
    public ResponseEntity<byte[]> exportSchemaExcel(
            @Parameter(description = "数据源ID", required = true) @PathVariable String id,
            @Parameter(description = "schema名称（MySQL等将作为catalog使用）") @RequestParam(required = false) String schema) {
        DatabaseSchemaDto dto = (schema == null || schema.isEmpty())
                ? datasourceService.collectSchema(id)
                : datasourceService.collectSchema(id, schema);

        try (Workbook workbook = new XSSFWorkbook();
             java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream()) {
            // Sheet: Tables
            org.apache.poi.ss.usermodel.Sheet tables = workbook.createSheet("Tables");
            org.apache.poi.ss.usermodel.Row th = tables.createRow(0);
            String[] tCols = {"tableCat", "tableSchem", "tableName", "tableType", "remarks"};
            for (int i = 0; i < tCols.length; i++) th.createCell(i).setCellValue(tCols[i]);
            int tr = 1;
            if (dto.getTables() != null) {
                for (com.ck.quiz.datasource.dto.TableSchemaDto t : dto.getTables()) {
                    org.apache.poi.ss.usermodel.Row r = tables.createRow(tr++);
                    r.createCell(0).setCellValue(t.getTableCat() == null ? "" : t.getTableCat());
                    r.createCell(1).setCellValue(t.getTableSchem() == null ? "" : t.getTableSchem());
                    r.createCell(2).setCellValue(t.getTableName() == null ? "" : t.getTableName());
                    r.createCell(3).setCellValue(t.getTableType() == null ? "" : t.getTableType());
                    r.createCell(4).setCellValue(t.getRemarks() == null ? "" : t.getRemarks());
                }
            }

            // Sheet: Columns
            org.apache.poi.ss.usermodel.Sheet columns = workbook.createSheet("Columns");
            org.apache.poi.ss.usermodel.Row ch = columns.createRow(0);
            String[] cCols = {"tableName", "columnName", "dataType", "columnSize", "decimalDigits", "nullable", "defaultValue", "primaryKey", "remarks"};
            for (int i = 0; i < cCols.length; i++) ch.createCell(i).setCellValue(cCols[i]);
            int cr = 1;
            if (dto.getTables() != null) {
                for (com.ck.quiz.datasource.dto.TableSchemaDto t : dto.getTables()) {
                    if (t.getColumns() == null) continue;
                    for (com.ck.quiz.datasource.dto.ColumnSchemaDto c : t.getColumns()) {
                        org.apache.poi.ss.usermodel.Row r = columns.createRow(cr++);
                        r.createCell(0).setCellValue(t.getTableName() == null ? "" : t.getTableName());
                        r.createCell(1).setCellValue(c.getColumnName() == null ? "" : c.getColumnName());
                        r.createCell(2).setCellValue(c.getDataType() == null ? "" : c.getDataType());
                        r.createCell(3).setCellValue(c.getColumnSize() == null ? 0 : c.getColumnSize());
                        r.createCell(4).setCellValue(c.getDecimalDigits() == null ? 0 : c.getDecimalDigits());
                        r.createCell(5).setCellValue(Boolean.TRUE.equals(c.getNullable()) ? "YES" : "NO");
                        r.createCell(6).setCellValue(c.getDefaultValue() == null ? "" : c.getDefaultValue());
                        r.createCell(7).setCellValue(Boolean.TRUE.equals(c.getPrimaryKey()) ? "YES" : "NO");
                        r.createCell(8).setCellValue(c.getRemarks() == null ? "" : c.getRemarks());
                    }
                }
            }

            for (int i = 0; i < 5; i++) tables.autoSizeColumn(i);
            for (int i = 0; i < 9; i++) columns.autoSizeColumn(i);

            workbook.write(baos);
            byte[] bytes = baos.toByteArray();
            String fileName = String.format("schema_%s_%s.xlsx",
                    (schema == null || schema.isEmpty()) ? "all" : schema, id);

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDisposition(org.springframework.http.ContentDisposition.attachment().filename(fileName).build());

            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
        } catch (java.io.IOException e) {
            throw new RuntimeException("生成Excel失败", e);
        }
    }

    @Operation(summary = "获取可选schema列表", description = "根据ID获取数据库的schema（无schema则返回catalog）")
    @GetMapping("/{id}/schemas")
    public ResponseEntity listSchemas(
            @Parameter(description = "数据源ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(datasourceService.listSchemas(id));
    }
}