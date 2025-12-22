#!/bin/bash

# ===============================
# 启动 quiz 应用（Linux 版）
# ===============================

APP_NAME="quiz"
JAR_FILE="/opt/quiz/quiz-1.0.0.jar"
LIB_DIR="/opt/quiz/lib"        # 依赖 Jar 所在目录
MAIN_CLASS="com.ck.quiz.QuizApplication"
PORT=8088
LOG_DIR="/opt/quiz/logs"
LOG_FILE="$LOG_DIR/${APP_NAME}.log"
PID_FILE="/var/run/${APP_NAME}.pid"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 如果 PID 文件存在，尝试杀掉旧进程
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "[$(date)] Stopping existing $APP_NAME process with PID $PID..."
        kill "$PID" 2>/dev/null || true
        sleep 2
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "[$(date)] Process $PID still running, force kill..."
            kill -9 "$PID" 2>/dev/null || true
        fi
    fi
    rm -f "$PID_FILE"
fi

# 启动新进程（考虑依赖目录）
echo "[$(date)] Starting $MAIN_CLASS on port $PORT ..."
nohup java -Dfile.encoding=UTF-8 -cp "$JAR_FILE:$LIB_DIR/*" "$MAIN_CLASS" --server.port="$PORT" >> "$LOG_FILE" 2>&1 &

# 写入 PID 文件
echo $! > "$PID_FILE"

echo "[$(date)] $APP_NAME started in background. PID: $(cat $PID_FILE)"
echo "Log file: $LOG_FILE"
