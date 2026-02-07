---
name: 后端开发助手
description: Java Spring Boot 后端开发流程指导，包含编码规范与编译检查
---

此技能为本项目 Java Spring Boot 后端开发的最佳实践指南。

## 项目结构

后端代码位于 `d:\idea_repo\quiz\backend\src\main\java\com\ck\quiz\` 目录下，按业务模块组织：

```
backend/src/main/java/com/ck/quiz/
├── [module]/                  # 业务模块目录
│   ├── controller/           # REST Controller
│   ├── service/             # 业务逻辑接口与实现
│   │   └── impl/
│   ├── repository/          # JPA Repository
│   └── entity/              # 实体类
├── common/                   # 公共组件
└── config/                   # 配置类
```

## 开发流程

### 1. 创建新模块

创建新业务模块时，按以下顺序创建文件：

1. **Entity** - 定义数据库实体
   ```java
   @Data
   @Entity
   @Table(name = "table_name")
   public class XxxEntity extends Model {
       // 字段定义
   }
   ```

2. **Repository** - 继承 JpaRepository
   ```java
   public interface XxxRepository extends JpaRepository<XxxEntity, Long> {
       // 自定义查询方法
   }
   ```

3. **Service** - 业务接口与实现
   ```java
   public interface XxxService {
       // 方法定义
   }
   
   @Service
   public class XxxServiceImpl implements XxxService {
       @Autowired
       private XxxRepository repository;
       // 实现
   }
   ```

4. **Controller** - REST 接口
   ```java
   @RestController
   @RequestMapping("/xxx")
   public class XxxController {
       @Autowired
       private XxxService service;
       // 接口定义
   }
   ```

### 2. 编译检查

完成代码修改后，**必须**运行编译检查：

```bash
cd d:\idea_repo\quiz\backend
# Windows
.\gradlew.bat compileJava

# 设置编码（如需）
set JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8"
```

**编译检查流程**：
1. 执行 Gradle 编译命令
2. 如果失败 (Exit Code 1)，分析错误信息
3. 定位错误文件和行号
4. 修复代码后重新编译
5. 重复直到编译成功 (Exit Code 0)

### 3. 常见问题

- **类型不匹配**：检查方法返回类型和参数类型
- **找不到符号**：检查 import 语句和包路径
- **空指针异常**：添加 null 检查或使用 Optional
- **SQL 语法错误**：检查 @Query 注解中的 SQL/JPQL

## API 规范

- 所有接口使用 `ResponseData` 包装返回值
- 分页接口使用 Spring Data 的 `Page` 对象
- 错误处理使用全局异常处理器
- **查询接口增强**：所有的查询接口（列表或详情）返回 `createUser`/`updateUser` 时，**必须**同时返回对应的用户中文名（如 `createUserName`/`updateUserName`）。需在 DTO 中添加相应字段并在 Service 层进行填充。
