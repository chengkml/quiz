#!/bin/bash

# ===============================
# 停止 quiz 应用（Linux 版）
# ===============================

APP_NAME="quiz"
PID_FILE="/var/run/${APP_NAME}.pid"
LOG_DIR="/opt/quiz/logs"
LOG_FILE="$LOG_DIR/${APP_NAME}.log"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 检查 PID 文件是否存在
if [ ! -f "$PID_FILE" ]; then
    echo "[$(date)] No PID file found at $PID_FILE. Application may not be running."
    exit 0
fi

# 读取 PID
PID=$(cat "$PID_FILE")

# 检查进程是否存在
if ! ps -p "$PID" > /dev/null 2>&1; then
    echo "[$(date)] Process with PID $PID is not running. Cleaning up PID file."
    rm -f "$PID_FILE"
    exit 0
fi

# 尝试优雅停止
echo "[$(date)] Stopping $APP_NAME process with PID $PID..."
kill "$PID" 2>/dev/null

# 等待进程正常退出（最多等待 10 秒）
TIMEOUT=10
ELAPSED=0
while ps -p "$PID" > /dev/null 2>&1 && [ $ELAPSED -lt $TIMEOUT ]; do
    sleep 1
    ELAPSED=$((ELAPSED + 1))
    echo "[$(date)] Waiting for process to terminate... ($ELAPSED/$TIMEOUT)"
done

# 如果进程仍在运行，强制杀掉
if ps -p "$PID" > /dev/null 2>&1; then
    echo "[$(date)] Process $PID still running after $TIMEOUT seconds. Force killing..."
    kill -9 "$PID" 2>/dev/null
    sleep 1
fi

# 最后检查进程是否已停止
if ps -p "$PID" > /dev/null 2>&1; then
    echo "[$(date)] ERROR: Failed to stop process $PID!"
    exit 1
else
    echo "[$(date)] Process $PID stopped successfully."
    rm -f "$PID_FILE"
    echo "[$(date)] $APP_NAME stopped."
    exit 0
fi
