package com.ck.quiz.datasource.service.impl;

import com.ck.quiz.datasource.dto.*;
import com.ck.quiz.datasource.entity.ColumnSchema;
import com.ck.quiz.datasource.entity.Datasource;
import com.ck.quiz.datasource.entity.TableSchema;
import com.ck.quiz.datasource.repository.ColumnSchemaRepository;
import com.ck.quiz.datasource.repository.DatasourceRepository;
import com.ck.quiz.datasource.repository.TableSchemaRepository;
import com.ck.quiz.datasource.service.DatasourceService;
import com.ck.quiz.thpool.CommonPool;
import com.ck.quiz.utils.ExcelTemplateHelper;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class DatasourceServiceImpl implements DatasourceService {

    @Autowired
    private DatasourceRepository datasourceRepository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Autowired
    private TableSchemaRepository tableSchemaRepository;

    @Autowired
    private ColumnSchemaRepository columnSchemaRepository;

    @Autowired
    private ChatClient.Builder chatBuilder;

    @Override
    @Transactional
    public DatasourceDto createDatasource(DatasourceCreateDto createDto) {
        Datasource ds = new Datasource();
        ds.setId(IdHelper.genUuid());
        ds.setName(createDto.getName());
        ds.setDriver(createDto.getDriver());
        ds.setJdbcUrl(createDto.getJdbcUrl());
        ds.setUsername(createDto.getUsername());
        ds.setPassword(createDto.getPassword());
        ds.setDescription(createDto.getDescription());
        ds.setActive(createDto.getActive());
        ds.setCreateDate(LocalDateTime.now());
        Datasource saved = datasourceRepository.save(ds);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public DatasourceDto updateDatasource(DatasourceUpdateDto updateDto) {
        Datasource ds = datasourceRepository.findById(updateDto.getId())
                .orElseThrow(() -> new RuntimeException("数据源不存在，ID: " + updateDto.getId()));

        if (StringUtils.hasText(updateDto.getName())) {
            ds.setName(updateDto.getName());
        }
        if (StringUtils.hasText(updateDto.getDriver())) {
            ds.setDriver(updateDto.getDriver());
        }
        if (StringUtils.hasText(updateDto.getJdbcUrl())) {
            ds.setJdbcUrl(updateDto.getJdbcUrl());
        }
        if (StringUtils.hasText(updateDto.getUsername())) {
            ds.setUsername(updateDto.getUsername());
        }
        if (updateDto.getPassword() != null) {
            ds.setPassword(updateDto.getPassword());
        }
        if (updateDto.getDescription() != null) {
            ds.setDescription(updateDto.getDescription());
        }
        if (updateDto.getActive() != null) {
            ds.setActive(updateDto.getActive());
        }
        ds.setUpdateDate(LocalDateTime.now());

        Datasource saved = datasourceRepository.save(ds);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public DatasourceDto deleteDatasource(String id) {
        Datasource ds = datasourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("数据源不存在，ID: " + id));
        datasourceRepository.delete(ds);
        return convertToDto(ds);
    }

    @Override
    @Transactional(readOnly = true)
    public DatasourceDto getDatasourceById(String id) {
        return datasourceRepository.findById(id).map(this::convertToDto)
                .orElseThrow(() -> new RuntimeException("数据源不存在，ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DatasourceDto> searchDatasources(DatasourceQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT ds.ds_id AS id, ds.name, ds.driver, ds.jdbc_url, ds.username, ds.description, ds.active, " +
                        "ds.create_date, ds.create_user, ds.update_date, ds.update_user, u.user_name create_user_name " +
                        "FROM datasource ds LEFT JOIN user u ON u.user_id = ds.create_user "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM datasource ds "
        );

        sql.append(" WHERE 1=1 ");
        countSql.append(" WHERE 1=1 ");

        Map<String, Object> params = new HashMap<>();

        JdbcQueryHelper.lowerLike("name", queryDto.getName(), " AND LOWER(ds.name) LIKE :name ", params, jdbcTemplate, sql, countSql);

        if (queryDto.getActive() != null) {
            JdbcQueryHelper.equals("active", String.valueOf(queryDto.getActive() ? 1 : 0), " AND ds.active = :active ", params, sql, countSql);
        }

        JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sql);

        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        List<DatasourceDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            DatasourceDto dto = new DatasourceDto();
            dto.setId(rs.getString("id"));
            dto.setName(rs.getString("name"));
            dto.setDriver(rs.getString("driver"));
            dto.setJdbcUrl(rs.getString("jdbc_url"));
            dto.setUsername(rs.getString("username"));
            dto.setDescription(rs.getString("description"));
            dto.setActive(rs.getBoolean("active"));
            dto.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name"));
            dto.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });

        Page<DatasourceDto> page = new PageImpl<>(list, org.springframework.data.domain.PageRequest.of(queryDto.getPageNum(), queryDto.getPageSize()),
                jdbcTemplate.queryForObject(countSql.toString(), params, Long.class));
        return page;
    }

    @Override
    public DatasourceDto convertToDto(Datasource ds) {
        DatasourceDto dto = new DatasourceDto();
        dto.setId(ds.getId());
        dto.setName(ds.getName());
        dto.setDriver(ds.getDriver());
        dto.setJdbcUrl(ds.getJdbcUrl());
        dto.setUsername(ds.getUsername());
        dto.setDescription(ds.getDescription());
        dto.setActive(ds.getActive());
        dto.setCreateDate(ds.getCreateDate());
        dto.setCreateUser(ds.getCreateUser());
        dto.setUpdateDate(ds.getUpdateDate());
        dto.setUpdateUser(ds.getUpdateUser());
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> testConnection(String id) {
        Datasource ds = datasourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("数据源不存在，ID: " + id));

        Map<String, Object> res = new HashMap<>();
        DriverManagerDataSource tmp = new DriverManagerDataSource();
        if (StringUtils.hasText(ds.getDriver())) {
            tmp.setDriverClassName(ds.getDriver());
        }
        tmp.setUrl(ds.getJdbcUrl());
        tmp.setUsername(ds.getUsername());
        tmp.setPassword(ds.getPassword());
        try (Connection conn = tmp.getConnection()) {
            res.put("success", true);
            res.put("databaseType", JdbcQueryHelper.getDatabaseType(tmp));
        } catch (Exception e) {
            res.put("success", false);
            res.put("error", e.getMessage());
        }
        return res;
    }

    @Override
    @Transactional(readOnly = true)
    public DatabaseSchemaDto collectSchema(String id) {
        return collectSchema(id, null);
    }

    @Override
    @Transactional
    public DatabaseSchemaDto collectSchema(String id, String schema) {
        Datasource ds = datasourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("数据源不存在，ID: " + id));

        DriverManagerDataSource tmp = new DriverManagerDataSource();
        if (StringUtils.hasText(ds.getDriver())) {
            tmp.setDriverClassName(ds.getDriver());
        }
        tmp.setUrl(ds.getJdbcUrl());
        tmp.setUsername(ds.getUsername());
        tmp.setPassword(ds.getPassword());

        DatabaseSchemaDto result = new DatabaseSchemaDto();

        try (Connection conn = tmp.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            result.setProductName(meta.getDatabaseProductName());
            result.setProductVersion(meta.getDatabaseProductVersion());
            result.setDriverName(meta.getDriverName());
            result.setDriverVersion(meta.getDriverVersion());
            String dbType = JdbcQueryHelper.getDatabaseType(tmp);
            result.setDatabaseType(dbType);

            String catalogToUse = null;
            String schemaToUse = null;
            if (StringUtils.hasText(schema)) {
                String low = dbType == null ? "" : dbType.toLowerCase();
                boolean useCatalog = low.contains("mysql") || low.contains("mariadb");
                if (useCatalog) {
                    catalogToUse = schema;
                } else {
                    schemaToUse = schema;
                }
            }

            // ---------- 清理旧数据 ----------
            if (StringUtils.hasText(schemaToUse)) {
                tableSchemaRepository.deleteByTableSchem(schemaToUse);
            }

            List<TableSchemaDto> tables = new ArrayList<>();

            try (ResultSet rs = meta.getTables(catalogToUse, schemaToUse, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    TableSchemaDto tableDto = new TableSchemaDto();
                    tableDto.setTableCat(rs.getString("TABLE_CAT"));
                    tableDto.setTableSchem(rs.getString("TABLE_SCHEM"));
                    tableDto.setTableName(rs.getString("TABLE_NAME"));
                    tableDto.setTableType(rs.getString("TABLE_TYPE"));
                    tableDto.setRemarks(rs.getString("REMARKS"));

                    // ---------- 保存表 ----------
                    TableSchema tableEntity = new TableSchema();
                    tableEntity.setId(IdHelper.genUuid());
                    tableEntity.setTableCat(tableDto.getTableCat());
                    tableEntity.setTableSchem(tableDto.getTableSchem());
                    tableEntity.setTableName(tableDto.getTableName());
                    tableEntity.setTableType(tableDto.getTableType());
                    tableEntity.setRemarks(tableDto.getRemarks());

                    // 主键集合
                    List<String> pks = new ArrayList<>();
                    try (ResultSet pkRs = meta.getPrimaryKeys(
                            rs.getString("TABLE_CAT"),
                            rs.getString("TABLE_SCHEM"),
                            rs.getString("TABLE_NAME"))) {
                        while (pkRs.next()) {
                            String pkCol = pkRs.getString("COLUMN_NAME");
                            if (pkCol != null) {
                                pks.add(pkCol);
                            }
                        }
                    }

                    // ---------- 采集字段 ----------
                    List<ColumnSchema> columnEntities = new ArrayList<>();
                    try (ResultSet colRs = meta.getColumns(
                            rs.getString("TABLE_CAT"),
                            rs.getString("TABLE_SCHEM"),
                            rs.getString("TABLE_NAME"),
                            "%")) {

                        while (colRs.next()) {
                            ColumnSchema column = new ColumnSchema();
                            column.setId(IdHelper.genUuid());
                            column.setTableSchema(tableEntity);
                            column.setColumnName(colRs.getString("COLUMN_NAME"));
                            column.setDataType(colRs.getString("TYPE_NAME"));
                            column.setColumnSize(getInt(colRs, "COLUMN_SIZE"));
                            column.setDecimalDigits(getInt(colRs, "DECIMAL_DIGITS"));
                            column.setNullable(
                                    "YES".equalsIgnoreCase(colRs.getString("IS_NULLABLE")) ||
                                            colRs.getInt("NULLABLE") == DatabaseMetaData.columnNullable
                            );
                            column.setDefaultValue(colRs.getString("COLUMN_DEF"));
                            column.setPrimaryKey(pks.contains(column.getColumnName()));
                            column.setRemarks(colRs.getString("REMARKS"));
                            columnEntities.add(column);
                        }
                    }

                    // 建立关联
                    tableEntity.setColumns(columnEntities);

                    // 保存表及其字段（级联生效）
                    tableSchemaRepository.save(tableEntity);

                    // 填充DTO（用于返回）
                    List<ColumnSchemaDto> columnDtos = new ArrayList<>();
                    for (ColumnSchema c : columnEntities) {
                        ColumnSchemaDto dto = new ColumnSchemaDto();
                        dto.setColumnName(c.getColumnName());
                        dto.setDataType(c.getDataType());
                        dto.setColumnSize(c.getColumnSize());
                        dto.setDecimalDigits(c.getDecimalDigits());
                        dto.setNullable(c.getNullable());
                        dto.setDefaultValue(c.getDefaultValue());
                        dto.setPrimaryKey(c.getPrimaryKey());
                        dto.setRemarks(c.getRemarks());
                        columnDtos.add(dto);
                    }

                    tableDto.setColumns(columnDtos);
                    tables.add(tableDto);
                }
            }

            result.setTables(tables);

        } catch (Exception e) {
            throw new RuntimeException("采集表结构失败: " + e.getMessage(), e);
        }

        return result;
    }


    @Override
    @Transactional(readOnly = true)
    public List<String> listSchemas(String id) {
        Datasource ds = datasourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("数据源不存在，ID: " + id));

        DriverManagerDataSource tmp = new DriverManagerDataSource();
        if (StringUtils.hasText(ds.getDriver())) {
            tmp.setDriverClassName(ds.getDriver());
        }
        tmp.setUrl(ds.getJdbcUrl());
        tmp.setUsername(ds.getUsername());
        tmp.setPassword(ds.getPassword());

        List<String> schemas = new ArrayList<>();
        try (Connection conn = tmp.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            // 先尝试获取schema
            try (ResultSet rs = meta.getSchemas()) {
                while (rs.next()) {
                    String name = rs.getString("TABLE_SCHEM");
                    if (StringUtils.hasText(name)) {
                        schemas.add(name);
                    }
                }
            }
            // 如果没有schema，尝试catalog作为schema选项
            if (schemas.isEmpty()) {
                try (ResultSet rs = meta.getCatalogs()) {
                    while (rs.next()) {
                        String name = rs.getString(1);
                        if (StringUtils.hasText(name)) {
                            schemas.add(name);
                        }
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("获取schema列表失败: " + e.getMessage(), e);
        }
        return schemas;
    }

    /**
     * 使用大模型生成表名、字段备注
     *
     * @param schema
     * @return
     */
    @Override
    public int generateRemarks(String datasourceId, String schema) {
        Datasource ds = datasourceRepository.findById(datasourceId)
                .orElseThrow(() -> new RuntimeException("数据源不存在，ID: " + datasourceId));

        ChatClient chat = chatBuilder.build();

        // 查询表结构（已保存的表）
        List<TableSchema> tables = StringUtils.hasText(schema) ?
                tableSchemaRepository.findByTableSchem(schema) :
                tableSchemaRepository.findAll();

        if (tables.isEmpty()) return 0;

        // 使用线程池并发处理
        List<java.util.concurrent.Future<Boolean>> futures = new ArrayList<>();

        for (TableSchema table : tables) {
            futures.add(CommonPool.cachedPool.submit(() -> {
                try {
                    String tableName = table.getTableName();

                    // 查询该表的字段
                    List<ColumnSchema> columnsInDb = columnSchemaRepository.findColumnsByTableName(tableName);
                    if (columnsInDb.isEmpty()) return false;

                    // 构建大模型提示
                    List<Map<String, String>> columns = new ArrayList<>();
                    for (ColumnSchema c : columnsInDb) {
                        Map<String, String> colInfo = new HashMap<>();
                        colInfo.put("name", c.getColumnName());
                        colInfo.put("type", c.getDataType());
                        columns.add(colInfo);
                    }
                    String prompt = buildRemarkPrompt(tableName, columns);

                    // 调用大模型生成备注
                    String content = chat.prompt(prompt).call().content();
                    Map<String, Object> remarkMap = new ObjectMapper().readValue(content, new TypeReference<>() {});

                    // 更新表备注
                    String tableRemark = (String) remarkMap.get("tableRemark");
                    if (StringUtils.hasText(tableRemark)) {
                        table.setRemarks(tableRemark);
                        tableSchemaRepository.save(table);
                    }

                    // 更新字段备注
                    Map<String, String> columnRemarks = (Map<String, String>) remarkMap.get("columns");
                    if (columnRemarks != null && !columnRemarks.isEmpty()) {
                        for (ColumnSchema c : columnsInDb) {
                            String remark = columnRemarks.get(c.getColumnName());
                            if (StringUtils.hasText(remark)) {
                                c.setRemarks(remark);
                            }
                        }
                        columnSchemaRepository.saveAllColumns(columnsInDb);
                    }

                    return true;
                } catch (Exception e) {
                    // 可选择打印日志，继续处理其他表
                    System.err.println("表 " + table.getTableName() + " 自动生成备注失败: " + e.getMessage());
                    return false;
                }
            }));
        }

        // 等待所有任务完成
        int updatedCount = 0;
        for (java.util.concurrent.Future<Boolean> f : futures) {
            try {
                if (f.get()) updatedCount++;
            } catch (Exception e) {
                // 忽略单个任务异常
            }
        }

        return updatedCount;
    }

    @Override
    @Transactional
    public int selectGroup(String datasourceId, String schema) {
        Datasource ds = datasourceRepository.findById(datasourceId)
                .orElseThrow(() -> new RuntimeException("数据源不存在，ID: " + datasourceId));

        ChatClient chat = chatBuilder.build();

        // 查询表结构（已保存的表）
        List<TableSchema> tables = StringUtils.hasText(schema) ?
                tableSchemaRepository.findByTableSchem(schema) :
                tableSchemaRepository.findAll();

        if (tables.isEmpty()) return 0;

        List<java.util.concurrent.Future<Boolean>> futures = new ArrayList<>();

        for (TableSchema table : tables) {
            futures.add(CommonPool.cachedPool.submit(() -> {
                try {
                    String tableName = table.getTableName();

                    // 查询字段信息（可选，根据需要提供更多上下文）
                    List<ColumnSchema> columnsInDb = columnSchemaRepository.findColumnsByTableName(tableName);

                    List<Map<String, String>> columns = new ArrayList<>();
                    for (ColumnSchema c : columnsInDb) {
                        Map<String, String> colInfo = new HashMap<>();
                        colInfo.put("name", c.getColumnName());
                        colInfo.put("type", c.getDataType());
                        columns.add(colInfo);
                    }

                    // 构建大模型提示
                    String prompt = buildGroupPrompt(tableName, columns);

                    // 调用大模型生成分类
                    String content = chat.prompt(prompt).call().content();
                    Map<String, Object> groupMap = new ObjectMapper().readValue(content, new TypeReference<>() {});

                    String category = (String) groupMap.get("category");
                    if (StringUtils.hasText(category)) {
                        table.setTableCat(category);
                        tableSchemaRepository.save(table);
                        return true;
                    }

                    return false;
                } catch (Exception e) {
                    System.err.println("表 " + table.getTableName() + " 分类失败: " + e.getMessage());
                    return false;
                }
            }));
        }

        int updatedCount = 0;
        for (java.util.concurrent.Future<Boolean> f : futures) {
            try {
                if (f.get()) updatedCount++;
            } catch (Exception ignored) {
            }
        }

        return updatedCount;
    }

    @Override
    public void exportToExcel(String datasourceId, String schema, HttpServletResponse response) {
        try {
            // 查询表结构
            List<TableSchema> tables = StringUtils.hasText(schema) ?
                    tableSchemaRepository.findByTableSchem(schema) :
                    tableSchemaRepository.findAll();

            if (tables.isEmpty()) {
                throw new RuntimeException("没有可导出的表结构数据");
            }

            // 读取模板
            String templatePath = "templates/table_dict_template.xlsx";
            try (InputStream is = getClass().getClassLoader().getResourceAsStream(templatePath)) {
                if (is == null) throw new RuntimeException("Excel 模板未找到: " + templatePath);

                XSSFWorkbook workbook = new XSSFWorkbook(is);

                // 按 tableCat 分组
                Map<String, List<TableSchema>> tablesByCat = new HashMap<>();
                for (TableSchema table : tables) {
                    String cat = table.getTableCat();
                    if (!StringUtils.hasText(cat)) cat = "未分类";
                    tablesByCat.computeIfAbsent(cat, k -> new ArrayList<>()).add(table);
                }

                for (Map.Entry<String, List<TableSchema>> entry : tablesByCat.entrySet()) {
                    String cat = entry.getKey();
                    List<TableSchema> catTables = entry.getValue();

                    // 获取对应 sheet
                    XSSFSheet sheet = workbook.getSheet(cat);
                    if (sheet == null) {
                        // sheet 不存在则创建
                        sheet = workbook.createSheet(cat);
                    }

                    // 构造循环数据
                    List<Map<String, Object>> loopData = new ArrayList<>();
                    for (TableSchema table : catTables) {
                        List<ColumnSchema> columns = table.getColumns();
                        if (columns == null) columns = new ArrayList<>();

                        for (ColumnSchema col : columns) {
                            Map<String, Object> map = new LinkedHashMap<>();
                            map.put("tableCat", String.valueOf(table.getTableCat()));
                            map.put("tableSchem", String.valueOf(table.getTableSchem()));
                            map.put("tableName", String.valueOf(table.getTableName()));
                            map.put("tableType", String.valueOf(table.getTableType()));
                            map.put("tableRemark", String.valueOf(table.getRemarks()));

                            map.put("columnName", String.valueOf(col.getColumnName()));
                            map.put("dataType", String.valueOf(col.getDataType()));
                            map.put("columnSize", String.valueOf(col.getColumnSize()));
                            map.put("decimalDigits", String.valueOf(col.getDecimalDigits()));
                            map.put("nullable", String.valueOf(col.getNullable()));
                            map.put("primaryKey", String.valueOf(col.getPrimaryKey()));
                            map.put("defaultValue", String.valueOf(col.getDefaultValue()));
                            map.put("remarks", String.valueOf(col.getRemarks()));

                            loopData.add(map);
                        }

                    }

                    // 填充 sheet
                    Map<String, String> staticSource = new HashMap<>();
                    List<Map<String, Object>> dynamicList = new ArrayList<>();
                    Map<String, Object> dynamic = new HashMap<>();
                    dynamic.put("loopId", "loop"); // 模板循环关键字
                    dynamic.put("dataList", loopData);
                    dynamicList.add(dynamic);

                    ExcelTemplateHelper.handleSheet(sheet, staticSource, dynamicList, ExcelTemplateHelper.getBorderStyle(workbook));
                }

                // 输出到响应
                String fileName = "表结构导出_" + new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date()) + ".xlsx";
                response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                response.setHeader("Content-Disposition", "attachment; filename=" + URLEncoder.encode(fileName, "UTF-8"));

                try (OutputStream os = response.getOutputStream()) {
                    workbook.write(os);
                }

                workbook.close();
            }

        } catch (Exception e) {
            throw new RuntimeException("导出 Excel 文件失败: " + e.getMessage(), e);
        }
    }



    /**
     * 构建大模型分类提示
     */
    private String buildGroupPrompt(String tableName, List<Map<String, String>> columns) {
        StringBuilder sb = new StringBuilder();
        sb.append("你是数据库架构专家。请根据表名和字段信息判断该表属于以下类别之一：门户、文档库、知识编排、监控运营、数据接入、系统管理。\n");
        sb.append("表名：").append(tableName).append("\n");
        sb.append("字段列表：\n");
        for (Map<String, String> col : columns) {
            sb.append("- ").append(col.get("name")).append(" (").append(col.get("type")).append(")\n");
        }
        sb.append("""
            输出格式必须是 JSON，例如：
            {
              "category": "门户"
            }
            不要输出其他文字或注释。
            """);
        return sb.toString();
    }



    private String buildRemarkPrompt(String tableName, List<Map<String, String>> columns) {
        StringBuilder sb = new StringBuilder();
        sb.append("你是一个数据库文档生成专家。请根据表名和字段名生成清晰的中文备注。\n");
        sb.append("表名：").append(tableName).append("\n");
        sb.append("字段列表：\n");
        for (Map<String, String> col : columns) {
            sb.append("- ").append(col.get("name")).append(" (").append(col.get("type")).append(")\n");
        }
        sb.append("""
                            
                输出格式必须是 JSON，例如：
                {
                  "tableRemark": "用于存储用户信息的表",
                  "columns": {
                    "id": "主键ID",
                    "name": "用户姓名",
                    "email": "电子邮箱"
                  }
                }
                不要输出额外文字或注释。
                """);
        return sb.toString();
    }


    private Integer getInt(ResultSet rs, String column) {
        try {
            int v = rs.getInt(column);
            return rs.wasNull() ? null : v;
        } catch (Exception e) {
            return null;
        }
    }
}