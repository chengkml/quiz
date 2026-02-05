#!/bin/bash

# ============================================================
# 启动 quiz 应用（2G内存优化版）
# ============================================================

# 1. 环境变量设置
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

# 2. 基础路径配置
APP_NAME="quiz"
BASE_DIR="/opt/quiz"
JAR_FILE="$BASE_DIR/quiz-1.0.0.jar"
LIB_DIR="$BASE_DIR/lib"
CONFIG_DIR="$BASE_DIR/"
MAIN_CLASS="com.ck.quiz.QuizApplication"

# 3. 运行环境配置
PORT=${PORT:-8089}
PROFILE=${SPRING_PROFILES_ACTIVE:-prod}
LOG_DIR="$BASE_DIR/logs"
LOG_FILE="$LOG_DIR/${APP_NAME}.log"
PID_FILE="/var/run/${APP_NAME}.pid"

# 4. JVM 内存优化参数
JAVA_OPTS="-Xms1024m -Xmx1024m \
-XX:MetaspaceSize=128m \
-XX:MaxMetaspaceSize=256m \
-XX:MaxDirectMemorySize=256m \
-XX:+HeapDumpOnOutOfMemoryError \
-XX:HeapDumpPath=$LOG_DIR/oom_dump.hprof \
-Dfile.encoding=UTF-8"

# --- 脚本逻辑开始 ---

# 创建日志目录
mkdir -p "$LOG_DIR"

# 检查并清理旧进程
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 正在停止旧进程 PID: $PID..."
        kill "$PID" 2>/dev/null || true
        sleep 5
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] 进程未停止，强制执行 kill -9..."
            kill -9 "$PID" 2>/dev/null || true
        fi
    fi
    rm -f "$PID_FILE"
fi

# 启动新进程
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 正在启动 $APP_NAME..."
echo "端口: $PORT | Profile: $PROFILE"
echo "内存配置: Xmx=1024m"

cd "$BASE_DIR" || exit

# 启动命令
nohup java $JAVA_OPTS -cp "$JAR_FILE:$LIB_DIR/*" "$MAIN_CLASS" \
    --server.port="$PORT" \
    --spring.profiles.active="$PROFILE" \
    --spring.config.location="classpath:/,file:$CONFIG_DIR" \
    >> "$LOG_FILE" 2>&1 &

# 保存 PID
NEW_PID=$!
echo $NEW_PID > "$PID_FILE"

# 验证是否启动成功 (修复后的部分)
sleep 2
if ps -p $NEW_PID > /dev/null 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 启动成功！PID: $NEW_PID"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 启动失败，请检查日志: $LOG_FILE"
    exit 1
fi