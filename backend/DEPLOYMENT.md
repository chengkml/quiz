# 外部配置部署说明

## 概述
自 1.0.0 版本起，`application.yml` 配置文件已从 JAR 包中排除，需要在外部配置目录中提供。

## 文件结构

### Linux 环境
```
/opt/quiz/
├── quiz-1.0.0.jar          # 应用主程序
├── lib/                     # 依赖包目录
│   ├── *.jar                # 所有依赖 JAR 文件
├── config/                  # ★★★ 配置文件目录
│   ├── application.yml      # ★★★ 必须！应用配置文件
├── logs/                    # 日志目录
│   └── quiz.log             # 应用运行日志
├── start.sh                 # 启动脚本
└── stop.sh                  # 停止脚本
```

### Windows 环境
```
C:\quiz\
├── quiz-1.0.0.jar          # 应用主程序
├── lib\                     # 依赖包目录
│   ├── *.jar                # 所有依赖 JAR 文件
├── config\                  # ★★★ 配置文件目录
│   ├── application.yml      # ★★★ 必须！应用配置文件
├── logs\                    # 日志目录
│   └── quiz.log             # 应用运行日志
├── start.bat                # 启动脚本
└── stop.bat                 # 停止脚本
```

## 部署步骤

### 1. 构建应用
```bash
cd backend
./gradlew clean build
```

### 2. 准备部署目录
**Linux:**
```bash
mkdir -p /opt/quiz/{lib,config,logs}
```

**Windows:**
```cmd
mkdir C:\quiz\lib
mkdir C:\quiz\config
mkdir C:\quiz\logs
```

### 3. 复制文件
**Linux:**
```bash
# 复制 JAR 和依赖
cp backend/build/libs/quiz-1.0.0.jar /opt/quiz/
cp -r backend/build/libs/lib/* /opt/quiz/lib/

# 复制启动和停止脚本
cp backend/start.sh /opt/quiz/
cp backend/stop.sh /opt/quiz/
chmod +x /opt/quiz/start.sh
chmod +x /opt/quiz/stop.sh

# 复制配置文件（编辑后放入）
cp backend/src/main/resources/application.yml /opt/quiz/config/
```

**Windows:**
```cmd
REM 复制 JAR 和依赖
copy backend\build\libs\quiz-1.0.0.jar C:\quiz\
xcopy backend\build\libs\lib\* C:\quiz\lib\ /Y

REM 复制启动和停止脚本
copy backend\start.bat C:\quiz\
copy backend\stop.bat C:\quiz\

REM 复制配置文件（编辑后放入）
copy backend\src\main\resources\application.yml C:\quiz\config\
```

### 4. 编辑配置文件

编辑 `config/application.yml`，修改以下关键配置：

```yaml
spring:
  datasource:
    url: jdbc:postgresql://your-db-host:5432/your-db
    username: your-db-user
    password: your-db-password
  ai:
    openai:
      api-key: your-api-key  # 如果需要
```

### 5. 启动应用

**Linux:**
```bash
cd /opt/quiz
./start.sh
```

**Windows:**
```cmd
C:\quiz\start.bat
```

### 6. 停止应用

**Linux:**
```bash
cd /opt/quiz
./stop.sh
```

**Windows:**
```cmd
C:\quiz\stop.bat
```

## 配置文件优先级

Spring Boot 会按以下优先级加载配置：
1. **外部配置目录** (`--spring.config.location=file:/opt/quiz/config/`) - 最高优先级
2. JAR 内部资源（已排除，不再适用）
3. 环境变量（如 `DB_USERNAME`, `DB_PASSWORD`）

## 修改配置后重启应用

修改配置文件后，需要重启应用才能生效：

**Linux:**
```bash
# 先停止
/opt/quiz/stop.sh

# 再启动
/opt/quiz/start.sh
```

**Windows:**
```cmd
REM 先停止
C:\quiz\stop.bat

REM 再启动
C:\quiz\start.bat
```

**Windows:**
- 手动关闭旧进程
- 重新运行 `start.bat`

## 故障排除

### 1. 找不到配置文件
**症状:** 应用启动失败，日志显示配置缺失

**解决:** 检查配置目录是否存在且包含 `application.yml`

**Linux:**
```bash
ls -la /opt/quiz/config/
```

**Windows:**
```cmd
dir C:\quiz\config\
```

### 2. 数据库连接失败
**症状:** 启动失败，提示数据库连接错误

**解决:** 验证 `application.yml` 中的数据库配置

```yaml
spring:
  datasource:
    url: jdbc:postgresql://host:5432/dbname
    username: username
    password: password
```

### 3. 权限问题 (Linux)
**症状:** 启动脚本执行失败

**解决:**
```bash
chmod +x /opt/quiz/start.sh
chmod 755 /opt/quiz/config/application.yml
```

## 环境变量覆盖

配置文件中支持环境变量：

```yaml
spring:
  datasource:
    username: ${DB_USERNAME:postgres}        # 未设置则用默认值
    password: ${DB_PASSWORD:1qazZAQ!}
```

启动时可设置环境变量覆盖：

**Linux:**
```bash
DB_USERNAME=myuser DB_PASSWORD=mypass /opt/quiz/start.sh
```

**Windows:**
```cmd
set DB_USERNAME=myuser
set DB_PASSWORD=mypass
start.bat
```

## 日志查看

**Linux:**
```bash
tail -f /opt/quiz/logs/quiz.log
```

**Windows:**
```cmd
type C:\quiz\logs\quiz.log
REM 或使用 PowerShell 实时查看
Get-Content -Path C:\quiz\logs\quiz.log -Wait
```
