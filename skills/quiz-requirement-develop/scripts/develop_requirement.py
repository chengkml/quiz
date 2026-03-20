#!/usr/bin/env python3
"""
quiz 需求开发执行脚本（最小闭环版）

流程：
1) login -> jwt
2) 查询待处理需求（默认 OPEN, IN_PROGRESS）或处理单条需求
3) 逐条读取需求详情（/get/{id}）并基于描述生成开发执行计划
4) 状态流转：开始前置为 IN_PROGRESS -> 关键阶段更新 progressPercent -> 完成置为 COMPLETED

说明：
- 结构化 JSON 输出每条需求的执行轨迹 trajectory。
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any, Dict, List, Optional, Sequence, Tuple
from urllib import error, parse, request

DEFAULT_BASE_URL = "https://www.quizck.cn"
DEFAULT_USER_ID = "openclaw"
DEFAULT_USER_PWD = "12345678"
DEFAULT_PROJECT_NAME = "quiz"
DEFAULT_STATUSES = ["OPEN", "IN_PROGRESS"]
DEFAULT_PAGE_SIZE = 50
DEFAULT_MAX_ITEMS = 20
DEFAULT_PROGRESS_MILESTONES = [30, 60, 90]

ALLOWED_STATUSES = {
    "PENDING_ANALYSIS",
    "PENDING_REVIEW",
    "PENDING_REVISION",
    "OPEN",
    "IN_PROGRESS",
    "COMPLETED",
    "CLOSED",
}

PRIORITY_ORDER = {
    "HIGH": 0,
    "MEDIUM": 1,
    "LOW": 2,
    "UNKNOWN": 3,
}


def print_json(data: Dict[str, Any], exit_code: int = 0) -> None:
    sys.stdout.write(json.dumps(data, ensure_ascii=False) + "\n")
    raise SystemExit(exit_code)


def fail(step: str, error_msg: str, details: Any = None, exit_code: int = 1) -> None:
    payload: Dict[str, Any] = {"ok": False, "step": step, "error": error_msg}
    if details is not None:
        payload["details"] = details
    print_json(payload, exit_code=exit_code)


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def normalize_priority(value: Any) -> str:
    text = normalize_text(value).upper()
    if not text:
        return "UNKNOWN"
    if text in {"HIGH", "MEDIUM", "LOW"}:
        return text
    return "UNKNOWN"


def sort_requirements_for_processing(requirements: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    indexed = list(enumerate(requirements))

    def sort_key(item: Tuple[int, Dict[str, Any]]) -> Tuple[int, str, str, int]:
        idx, req = item
        priority = normalize_priority(req.get("priority"))
        create_date = normalize_text(req.get("createDate")) or "9999-99-99T99:99:99"
        req_id = normalize_text(req.get("id")) or "~"
        return (PRIORITY_ORDER.get(priority, PRIORITY_ORDER["UNKNOWN"]), create_date, req_id, idx)

    indexed.sort(key=sort_key)
    return [req for _, req in indexed]


def normalize_base_url(raw: str) -> str:
    value = normalize_text(raw)
    if not value:
        raise ValueError("base-url 不能为空")
    return value.rstrip("/")


def parse_statuses(status_args: Optional[Sequence[str]]) -> List[str]:
    if not status_args:
        return list(DEFAULT_STATUSES)

    result: List[str] = []
    seen = set()
    for item in status_args:
        for part in (item or "").split(","):
            status = normalize_text(part).upper()
            if not status:
                continue
            if status not in ALLOWED_STATUSES:
                raise ValueError(f"status 非法: {status}")
            if status not in seen:
                seen.add(status)
                result.append(status)

    if not result:
        raise ValueError("status 不能为空")
    return result


def parse_progress_milestones(raw: Optional[str]) -> List[int]:
    if raw is None or normalize_text(raw) == "":
        return list(DEFAULT_PROGRESS_MILESTONES)

    vals: List[int] = []
    seen = set()
    for part in raw.split(","):
        part = normalize_text(part)
        if not part:
            continue
        try:
            num = int(part)
        except ValueError:
            raise ValueError(f"progress-milestones 非整数: {part}")

        if num < 1 or num > 99:
            raise ValueError("progress-milestones 取值范围必须是 1-99")

        if num not in seen:
            seen.add(num)
            vals.append(num)

    if not vals:
        raise ValueError("progress-milestones 不能为空")

    vals.sort()
    return vals


def http_json(
    opener: request.OpenerDirector,
    method: str,
    url: str,
    *,
    headers: Optional[Dict[str, str]] = None,
    json_body: Optional[Dict[str, Any]] = None,
    timeout: int = 15,
) -> Dict[str, Any]:
    req_headers = {"Accept": "application/json"}
    if headers:
        req_headers.update(headers)

    body_bytes = None
    if json_body is not None:
        req_headers["Content-Type"] = "application/json"
        body_bytes = json.dumps(json_body, ensure_ascii=False).encode("utf-8")

    req = request.Request(url=url, data=body_bytes, headers=req_headers, method=method)
    try:
        with opener.open(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            content_type = resp.headers.get("Content-Type", "")
            if "application/json" in content_type:
                try:
                    body: Any = json.loads(raw)
                except json.JSONDecodeError:
                    body = raw
            else:
                body = raw
            return {"status": resp.status, "body": body}
    except error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        err_body: Any = raw
        try:
            err_body = json.loads(raw)
        except Exception:
            pass
        return {"status": e.code, "body": err_body, "http_error": True}


def extract_data_body(body: Any) -> Any:
    if isinstance(body, dict) and body.get("data") is not None:
        return body.get("data")
    return body


def ensure_2xx(step: str, resp: Dict[str, Any], error_msg: str) -> Any:
    status = int(resp.get("status", 0) or 0)
    if 200 <= status < 300:
        return extract_data_body(resp.get("body"))
    fail(step, error_msg, {"status": status, "body": resp.get("body")})


def auth_headers(token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def login_and_get_token(
    opener: request.OpenerDirector,
    *,
    base_url: str,
    user_id: str,
    user_pwd: str,
    timeout: int,
) -> str:
    login_resp = http_json(
        opener,
        "POST",
        f"{base_url}/api/user/login",
        json_body={"userId": user_id, "userPwd": user_pwd},
        timeout=timeout,
    )
    ensure_2xx("login", login_resp, "登录失败（账号/密码或服务异常）")

    jwt_url = f"{base_url}/api/jwt/generate?userId={parse.quote(user_id)}"
    jwt_resp = http_json(opener, "POST", jwt_url, timeout=timeout)
    jwt_body = ensure_2xx("jwt", jwt_resp, "JWT 生成失败（会话或接口异常）")
    token = normalize_text(jwt_body)
    if not token:
        fail("jwt", "JWT 生成失败：返回 token 为空")
    return token


def query_requirements_by_status(
    opener: request.OpenerDirector,
    *,
    base_url: str,
    token: str,
    project_name: str,
    statuses: Sequence[str],
    page_size: int,
    max_items: int,
    timeout: int,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    url = f"{base_url}/api/project/requirement/search"
    merged: List[Dict[str, Any]] = []
    seen_ids = set()
    trace: List[Dict[str, Any]] = []

    for status in statuses:
        page_num = 1
        while True:
            payload = {
                "projectName": project_name,
                "status": status,
                "pageNum": page_num,
                "pageSize": page_size,
            }
            resp = http_json(
                opener,
                "POST",
                url,
                headers=auth_headers(token),
                json_body=payload,
                timeout=timeout,
            )
            body = ensure_2xx("search", resp, "查询需求列表失败")
            if not isinstance(body, dict):
                fail("search", "需求查询返回格式异常", body)

            content = body.get("content")
            if not isinstance(content, list):
                content = []

            trace.append(
                {
                    "status": status,
                    "pageNum": page_num,
                    "returned": len(content),
                    "totalElements": body.get("totalElements"),
                    "totalPages": body.get("totalPages"),
                }
            )

            for item in content:
                if not isinstance(item, dict):
                    continue
                rid = normalize_text(item.get("id"))
                if not rid or rid in seen_ids:
                    continue
                seen_ids.add(rid)
                merged.append(item)
                if len(merged) >= max_items:
                    return merged, trace

            total_pages = body.get("totalPages")
            if not content:
                break
            if isinstance(total_pages, int) and total_pages > 0 and page_num >= total_pages:
                break
            if len(content) < page_size:
                break
            page_num += 1

    return merged, trace


def fetch_requirement_detail(
    opener: request.OpenerDirector,
    *,
    base_url: str,
    token: str,
    requirement_id: str,
    timeout: int,
) -> Dict[str, Any]:
    url = f"{base_url}/api/project/requirement/get/{parse.quote(requirement_id)}"
    resp = http_json(opener, "GET", url, headers=auth_headers(token), timeout=timeout)
    body = ensure_2xx("get_requirement", resp, "查询需求详情失败")
    if not isinstance(body, dict):
        fail("get_requirement", "需求详情返回格式异常", body)
    return body


def update_status(
    opener: request.OpenerDirector,
    *,
    base_url: str,
    token: str,
    requirement_id: str,
    status: str,
    progress_percent: Optional[int],
    result_msg: Optional[str],
    timeout: int,
) -> Dict[str, Any]:
    query = {"status": status}
    if progress_percent is not None:
        query["progressPercent"] = str(progress_percent)
    if normalize_text(result_msg):
        query["resultMsg"] = normalize_text(result_msg)

    url = f"{base_url}/api/project/requirement/{parse.quote(requirement_id)}/status?{parse.urlencode(query)}"
    resp = http_json(opener, "POST", url, headers=auth_headers(token), timeout=timeout)
    ensure_2xx("update_status", resp, f"更新需求状态失败: {requirement_id} -> {status}")

    return {
        "httpStatus": resp.get("status"),
        "response": resp.get("body"),
        "request": {
            "status": status,
            "progressPercent": progress_percent,
            "resultMsg": normalize_text(result_msg) or None,
        },
    }


def build_development_plan(requirement: Dict[str, Any]) -> Dict[str, Any]:
    title = normalize_text(requirement.get("title")) or "（未命名需求）"
    descr = normalize_text(requirement.get("descr"))
    descr_preview = descr[:200] + ("..." if len(descr) > 200 else "") if descr else "（描述为空）"

    return {
        "objective": title,
        "descriptionPreview": descr_preview,
        "basedOnDescr": bool(descr),
        "suggestedPhases": [
            "需求澄清与边界确认",
            "后端接口/数据层实现",
            "前端页面与交互实现",
            "联调与回归验证",
        ],
    }


def build_transition_plan(action: str, milestones: Sequence[int], start_progress: int) -> List[Dict[str, Any]]:
    plan: List[Dict[str, Any]] = []

    if action == "query":
        return plan

    if action in {"start", "full"}:
        plan.append(
            {
                "phase": "start",
                "targetStatus": "IN_PROGRESS",
                "progressPercent": start_progress,
                "resultMsg": "开始开发：状态置为 IN_PROGRESS",
            }
        )

    if action in {"progress", "full"}:
        for p in milestones:
            plan.append(
                {
                    "phase": "progress",
                    "targetStatus": "IN_PROGRESS",
                    "progressPercent": p,
                    "resultMsg": f"开发进度更新：{p}%",
                }
            )

    if action in {"complete", "full"}:
        plan.append(
            {
                "phase": "complete",
                "targetStatus": "COMPLETED",
                "progressPercent": 100,
                "resultMsg": "开发完成：状态置为 COMPLETED",
            }
        )

    return plan


def execute_for_requirement(
    opener: request.OpenerDirector,
    *,
    base_url: str,
    token: str,
    requirement_id: str,
    action: str,
    milestones: Sequence[int],
    start_progress: int,
    timeout: int,
    process_order: Optional[int] = None,
    force_complete_if_already_completed: bool = False,
) -> Dict[str, Any]:
    requirement = fetch_requirement_detail(
        opener,
        base_url=base_url,
        token=token,
        requirement_id=requirement_id,
        timeout=timeout,
    )

    current_status = normalize_text(requirement.get("status")).upper()
    title = normalize_text(requirement.get("title"))
    plan = build_development_plan(requirement)
    transitions = build_transition_plan(action, milestones, start_progress)

    if force_complete_if_already_completed and current_status == "COMPLETED":
        transitions = [
            {
                "phase": "complete",
                "targetStatus": "COMPLETED",
                "progressPercent": 100,
                "resultMsg": "开发完成：状态置为 COMPLETED",
            }
        ]

    trajectory: List[Dict[str, Any]] = []

    for step in transitions:
        exec_result = update_status(
            opener,
            base_url=base_url,
            token=token,
            requirement_id=requirement_id,
            status=step["targetStatus"],
            progress_percent=step["progressPercent"],
            result_msg=step["resultMsg"],
            timeout=timeout,
        )
        current_status = step["targetStatus"]
        trajectory.append(
            {
                "phase": step["phase"],
                **exec_result,
            }
        )

    return {
        "processOrder": process_order,
        "requirementId": requirement_id,
        "title": title,
        "initialStatus": normalize_text(requirement.get("status")),
        "priority": normalize_priority(requirement.get("priority")),
        "createDate": normalize_text(requirement.get("createDate")),
        "finalStatusPlanned": current_status,
        "developmentPlan": plan,
        "transitionPlan": transitions,
        "trajectory": trajectory,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="quiz 需求开发执行：login -> jwt -> query/get -> status progress update",
    )

    parser.add_argument(
        "--action",
        choices=["query", "start", "progress", "complete", "full"],
        default="full",
        help="执行动作：query(仅查询) / start / progress / complete / full(默认完整流程)",
    )

    parser.add_argument("--auto-query", action="store_true", help="批量模式：先查询再逐条处理")
    parser.add_argument("--requirement-id", help="单条模式需求 ID（不启用 --auto-query 时必填）")

    parser.add_argument(
        "--status",
        action="append",
        help="查询状态（可重复或逗号分隔），默认 OPEN,IN_PROGRESS",
    )
    parser.add_argument("--project-name", default=DEFAULT_PROJECT_NAME, help="项目名过滤，默认 quiz")
    parser.add_argument("--page-size", type=int, default=DEFAULT_PAGE_SIZE, help=f"查询分页大小，默认 {DEFAULT_PAGE_SIZE}")
    parser.add_argument("--max-items", type=int, default=DEFAULT_MAX_ITEMS, help=f"批量最大处理数，默认 {DEFAULT_MAX_ITEMS}")

    parser.add_argument(
        "--progress-milestones",
        default=",".join(str(x) for x in DEFAULT_PROGRESS_MILESTONES),
        help="关键进度里程碑（逗号分隔，1-99），默认 30,60,90",
    )
    parser.add_argument(
        "--start-progress",
        type=int,
        default=0,
        help="start 阶段写入的进度值（0-99），默认 0",
    )

    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="服务地址，默认 https://www.quizck.cn")
    parser.add_argument("--user-id", default=DEFAULT_USER_ID, help="登录账号，默认 openclaw")
    parser.add_argument("--user-pwd", default=DEFAULT_USER_PWD, help="登录密码，默认 12345678")
    parser.add_argument("--timeout", type=int, default=15, help="HTTP 超时秒数，默认 15")

    parser.add_argument(
        "--force-complete-if-already-completed",
        action="store_true",
        help="当需求已是 COMPLETED 时，complete/full 仍执行一次 COMPLETED(100) 写回",
    )
    return parser


def validate_args(args: argparse.Namespace) -> Dict[str, Any]:
    try:
        cfg = {
            "action": args.action,
            "auto_query": bool(args.auto_query),
            "requirement_id": normalize_text(args.requirement_id),
            "statuses": parse_statuses(args.status),
            "project_name": normalize_text(args.project_name) or DEFAULT_PROJECT_NAME,
            "page_size": args.page_size,
            "max_items": args.max_items,
            "milestones": parse_progress_milestones(args.progress_milestones),
            "start_progress": args.start_progress,
            "base_url": normalize_base_url(args.base_url),
            "user_id": normalize_text(args.user_id),
            "user_pwd": args.user_pwd or "",
            "timeout": args.timeout,
            "force_complete_if_already_completed": bool(args.force_complete_if_already_completed),
        }

        if not cfg["auto_query"] and not cfg["requirement_id"]:
            raise ValueError("非 auto-query 模式下 requirement-id 不能为空")

        if not cfg["user_id"]:
            raise ValueError("user-id 不能为空")
        if not cfg["user_pwd"]:
            raise ValueError("user-pwd 不能为空")

        if cfg["timeout"] <= 0:
            raise ValueError("timeout 必须大于 0")
        if cfg["page_size"] <= 0:
            raise ValueError("page-size 必须大于 0")
        if cfg["max_items"] <= 0:
            raise ValueError("max-items 必须大于 0")

        if cfg["start_progress"] < 0 or cfg["start_progress"] > 99:
            raise ValueError("start-progress 必须在 0-99 之间")

        if cfg["action"] == "query" and not cfg["auto_query"] and not cfg["requirement_id"]:
            raise ValueError("query 单条模式下 requirement-id 不能为空")

        return cfg
    except ValueError as e:
        fail("validate", str(e), exit_code=2)


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    cfg = validate_args(args)

    opener = request.build_opener(request.HTTPCookieProcessor())

    token = login_and_get_token(
        opener,
        base_url=cfg["base_url"],
        user_id=cfg["user_id"],
        user_pwd=cfg["user_pwd"],
        timeout=cfg["timeout"],
    )

    items: List[Dict[str, Any]] = []
    query_trace: List[Dict[str, Any]] = []

    if cfg["auto_query"]:
        queried, query_trace = query_requirements_by_status(
            opener,
            base_url=cfg["base_url"],
            token=token,
            project_name=cfg["project_name"],
            statuses=cfg["statuses"],
            page_size=cfg["page_size"],
            max_items=cfg["max_items"],
            timeout=cfg["timeout"],
        )
        ordered = sort_requirements_for_processing(queried)

        for process_order, req in enumerate(ordered, start=1):
            rid = normalize_text(req.get("id"))
            if not rid:
                continue
            item = execute_for_requirement(
                opener,
                base_url=cfg["base_url"],
                token=token,
                requirement_id=rid,
                action=cfg["action"],
                milestones=cfg["milestones"],
                start_progress=cfg["start_progress"],
                timeout=cfg["timeout"],
                process_order=process_order,
                force_complete_if_already_completed=cfg["force_complete_if_already_completed"],
            )
            if not item.get("priority"):
                item["priority"] = normalize_priority(req.get("priority"))
            items.append(item)
    else:
        items.append(
            execute_for_requirement(
                opener,
                base_url=cfg["base_url"],
                token=token,
                requirement_id=cfg["requirement_id"],
                action=cfg["action"],
                milestones=cfg["milestones"],
                start_progress=cfg["start_progress"],
                timeout=cfg["timeout"],
                force_complete_if_already_completed=cfg["force_complete_if_already_completed"],
            )
        )

    print_json(
        {
            "ok": True,
            "mode": "auto-query" if cfg["auto_query"] else "single",
            "action": cfg["action"],
            "projectName": cfg["project_name"],
            "statuses": cfg["statuses"],
            "processingOrderRule": "priority(HIGH>MEDIUM>LOW) then createDate then id" if cfg["auto_query"] else None,
            "priorityProcessingRule": {
                "order": ["HIGH", "MEDIUM", "LOW", "UNKNOWN"],
                "stableWithinPriority": "createDate asc, id asc, fallback query order",
            } if cfg["auto_query"] else None,
            "queryTrace": query_trace,
            "count": len(items),
            "items": items,
        }
    )


if __name__ == "__main__":
    main()
