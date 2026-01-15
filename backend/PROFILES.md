# 多环境配置管理

## 配置文件说明

Quiz 应用支持多环境配置，通过 Spring Profiles 进行管理。

### 配置文件列表

| 文件名 | 说明 | 场景 |
|--------|------|------|
| `application.yml` | 通用基础配置 | 所有环境通用 |
| `application-dev.yml` | 开发环境配置 | 本地开发 |
| `application-prod.yml` | 生产环境配置 | 生产部署 |
| `application-test.yml` | 测试环境配置 | 单元测试 |

## 环境对比

### 开发环境 (dev)

**特点：**
- 本地 PostgreSQL 数据库 (`localhost:5432`)
- SQL 显示和格式化：便于调试
- 详细日志输出（DEBUG 级别）
- `ddl-auto: update` 自动更新表结构
- 较小的数据库连接池（10）

**使用场景：**
```bash
# Linux
export SPRING_PROFILES_ACTIVE=dev
./start.sh

# Windows
set SPRING_PROFILES_ACTIVE=dev
start.bat

# 或直接在命令行指定
java ... --spring.profiles.active=dev
```

### 生产环境 (prod)

**特点：**
- 远程 PostgreSQL 数据库（通过环境变量配置）
- SQL 不显示（性能考虑）
- 最少日志输出（INFO 级别）
- `ddl-auto: validate` 仅验证表结构
- 大连接池（30）和连接优化
- HTTP 响应压缩
- 日志文件持久化

**使用场景：**
```bash
# Linux - 使用默认配置（prod）
./start.sh

# Linux - 设置数据库连接信息
export SPRING_PROFILES_ACTIVE=prod
export DB_HOST=db.example.com
export DB_PORT=5432
export DB_NAME=quiz_prod
export DB_USERNAME=produser
export DB_PASSWORD=securepass
export OPENAI_API_KEY=sk-xxx
./start.sh

# Windows - 使用默认配置
start.bat

# Windows - 设置环境变量后启动
set SPRING_PROFILES_ACTIVE=prod
set DB_HOST=db.example.com
set DB_USERNAME=produser
set DB_PASSWORD=securepass
start.bat
```

## 环境变量配置

### 开发环境变量

```bash
# 可选，默认为 localhost
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=quiz_dev
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export OPENAI_API_KEY=sk-test-key
```

### 生产环境变量

```bash
# 必须设置
export DB_HOST=your-production-db-host
export DB_PORT=5432
export DB_NAME=your-database-name
export DB_SCHEMA=public
export DB_USERNAME=production-user
export DB_PASSWORD=production-password
export OPENAI_API_KEY=sk-production-key
export SPRING_PROFILES_ACTIVE=prod
```

## 快速启动示例

### Linux 开发环境

```bash
cd /opt/quiz
# 使用开发配置启动
SPRING_PROFILES_ACTIVE=dev ./start.sh
```

### Linux 生产环境

```bash
cd /opt/quiz
# 设置数据库信息后启动
export DB_HOST=223.109.142.84
export DB_USERNAME=dbuser
export DB_PASSWORD=dbpass123
export OPENAI_API_KEY=sk-xxx
./start.sh  # 默认使用 prod
```

### Windows 开发环境

```cmd
cd C:\quiz
set SPRING_PROFILES_ACTIVE=dev
start.bat
```

### Windows 生产环境

```cmd
cd C:\quiz
set SPRING_PROFILES_ACTIVE=prod
set DB_HOST=223.109.142.84
set DB_USERNAME=dbuser
set DB_PASSWORD=dbpass123
start.bat
```

## 各环境配置差异详解

### 数据库配置

| 配置项 | 开发 (dev) | 生产 (prod) |
|--------|-----------|-----------|
| URL | localhost:5432 | 环境变量 ${DB_HOST} |
| ddl-auto | update | validate |
| show-sql | true | false |
| format_sql | true | false |
| max-pool-size | 10 | 30 |
| idle-timeout | default | 10分钟 |

### 日志配置

| 配置项 | 开发 (dev) | 生产 (prod) |
|--------|-----------|-----------|
| com.ck 级别 | DEBUG | INFO |
| Spring 级别 | DEBUG | WARN |
| Hibernate 级别 | DEBUG | WARN |
| 输出目标 | 控制台 | 文件 + 控制台 |
| 文件位置 | 无 | /opt/quiz/logs/quiz.log |
| 日志保留 | 无限制 | 30天/10GB |

### 性能配置

| 配置项 | 开发 (dev) | 生产 (prod) |
|--------|-----------|-----------|
| HTTP 压缩 | 无 | 启用 (≥1KB) |
| 批处理大小 | 10 | 20 |
| Fetch Size | 50 | 100 |
| 统计信息 | 可能 | 禁用 |
| SQL 注释 | 可能 | 禁用 |

## 配置优先级

从高到低：
1. **命令行参数** - `--spring.profiles.active=dev`
2. **环境变量** - `SPRING_PROFILES_ACTIVE=dev`
3. **application.yml** 中的 `spring.profiles.active`
4. **默认值** - dev（当未指定时）

示例：
```bash
# 用命令行参数覆盖环境变量
export SPRING_PROFILES_ACTIVE=dev
java ... --spring.profiles.active=prod  # 会使用 prod
```

## 常见问题

### Q: 如何切换环境？
**A:** 修改 `SPRING_PROFILES_ACTIVE` 环境变量或使用启动参数：
```bash
export SPRING_PROFILES_ACTIVE=prod
./start.sh
```

### Q: 生产环境配置哪些变量是必须的？
**A:** 以下为必须：
- `DB_HOST` - 数据库服务器地址
- `DB_USERNAME` - 数据库用户名
- `DB_PASSWORD` - 数据库密码
- `OPENAI_API_KEY` - 如果使用 AI 功能

### Q: 开发环境本地 PostgreSQL 不运行怎么办？
**A:** 使用 Docker 快速启动：
```bash
docker run --name quiz-db -e POSTGRES_DB=quiz_dev \
  -e POSTGRES_PASSWORD=postgres -p 5432:5432 \
  -d postgres:15
```

### Q: 如何在 IDE 中指定开发环境？
**A:** 在 IDE 的运行配置中添加 VM 参数：
```
-Dspring.profiles.active=dev
```

### Q: 生产环境日志如何查看？
**A:** 
```bash
# Linux
tail -f /opt/quiz/logs/quiz.log

# Windows PowerShell
Get-Content -Path C:\quiz\logs\quiz.log -Wait
```

## 扩展配置

如需添加其他环境（如测试、预发布），可创建对应的配置文件：

```bash
# 创建预发布环境配置
touch src/main/resources/application-staging.yml
```

然后在启动时指定：
```bash
export SPRING_PROFILES_ACTIVE=staging
./start.sh
```
