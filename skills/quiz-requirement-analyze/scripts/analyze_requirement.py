#!/usr/bin/env python3
"""
调用 quiz 需求分析接口：login -> jwt -> query/list -> analyze

核心能力：
1) 单条分析写回（兼容旧参数）
2) 批量自动查询待处理需求（PENDING_ANALYSIS / PENDING_REVISION）并逐条分析
3) 对 PENDING_REVISION 在分析前强制读取评审备注（resultMsg + lifecycle REVIEW remark）
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
DEFAULT_STATUSES = ["PENDING_ANALYSIS", "PENDING_REVISION"]
DEFAULT_PAGE_SIZE = 50
DEFAULT_MAX_ITEMS = 100

CODE_UNDERSTANDING_DEFAULT = """\
quiz 工程关键定位：
- 前端需求页面：frontend/src/pages/Requirement/index.tsx
- 前端需求 API：frontend/src/pages/Requirement/api/index.ts
- 前端路由入口：frontend/src/router/index.tsx（/frame/requirement）
- 后端需求 Controller：backend/src/main/java/com/ck/quiz/project/controller/RequirementController.java
- 后端需求 Service：backend/src/main/java/com/ck/quiz/project/service/impl/RequirementServiceImpl.java
- 后端需求 DTO/实体：backend/src/main/java/com/ck/quiz/project/dto/Requirement*.java
"""


def print_json(data: Dict[str, Any], exit_code: int = 0) -> None:
    sys.stdout.write(json.dumps(data, ensure_ascii=False) + "\n")
    raise SystemExit(exit_code)


def normalize_base_url(raw: str) -> str:
    value = (raw or "").strip()
    if not value:
        raise ValueError("base-url 不能为空")
    return value.rstrip("/")


def validate_progress(progress_percent: Optional[int]) -> None:
    if progress_percent is None:
        return
    if progress_percent < 0 or progress_percent > 100:
        raise ValueError("progress-percent 必须在 0-100 之间")


def parse_statuses(status_args: Optional[Sequence[str]]) -> List[str]:
    if not status_args:
        return list(DEFAULT_STATUSES)

    result: List[str] = []
    seen = set()
    for item in status_args:
        for part in (item or "").split(","):
            s = part.strip().upper()
            if not s:
                continue
            if s not in seen:
                seen.add(s)
                result.append(s)

    if not result:
        raise ValueError("status 不能为空")
    return result


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def extract_data_body(body: Any) -> Any:
    """兼容直接返回与统一包装返回（{data: ...}）。"""
    if isinstance(body, dict) and "data" in body and body.get("data") is not None:
        return body.get("data")
    return body


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
                    return {"status": resp.status, "body": json.loads(raw)}
                except json.JSONDecodeError:
                    return {"status": resp.status, "body": raw}
            return {"status": resp.status, "body": raw}
    except error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        err_body: Any = raw
        try:
            err_body = json.loads(raw)
        except Exception:
            pass
        return {"status": e.code, "body": err_body, "http_error": True}


def ensure_2xx(step: str, resp: Dict[str, Any], error_msg: str) -> Any:
    status = int(resp.get("status", 0) or 0)
    if 200 <= status < 300:
        return extract_data_body(resp.get("body"))

    print_json(
        {
            "ok": False,
            "step": step,
            "status": status,
            "error": error_msg,
            "details": resp.get("body"),
        },
        exit_code=1,
    )


def login_and_get_token(
    opener: request.OpenerDirector,
    *,
    base_url: str,
    user_id: str,
    user_pwd: str,
    timeout: int,
) -> str:
    login_url = f"{base_url}/api/user/login"
    login_result = http_json(
        opener,
        "POST",
        login_url,
        json_body={"userId": user_id, "userPwd": user_pwd},
        timeout=timeout,
    )
    ensure_2xx("login", login_result, "登录失败（账号/密码或服务异常）")

    jwt_url = f"{base_url}/api/jwt/generate?userId={parse.quote(user_id)}"
    jwt_result = http_json(opener, "POST", jwt_url, timeout=timeout)
    token_body = ensure_2xx("jwt", jwt_result, "JWT 生成失败（会话或接口异常）")

    token = normalize_text(token_body)
    if not token:
        print_json(
            {
                "ok": False,
                "step": "jwt",
                "status": jwt_result.get("status"),
                "error": "JWT 生成失败：返回 token 为空",
            },
            exit_code=1,
        )
    return token


def auth_headers(token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


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
    body = ensure_2xx("fetch_requirement", resp, "查询需求详情失败")
    if not isinstance(body, dict):
        print_json(
            {
                "ok": False,
                "step": "fetch_requirement",
                "status": resp.get("status"),
                "error": "需求详情返回格式异常",
                "details": body,
            },
            exit_code=1,
        )
    return body


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
    query_trace: List[Dict[str, Any]] = []

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
            page_body = ensure_2xx("query", resp, "查询需求列表失败")
            if not isinstance(page_body, dict):
                print_json(
                    {
                        "ok": False,
                        "step": "query",
                        "status": resp.get("status"),
                        "error": "需求查询返回格式异常",
                        "details": page_body,
                    },
                    exit_code=1,
                )

            content = page_body.get("content")
            if not isinstance(content, list):
                content = []

            query_trace.append(
                {
                    "status": status,
                    "pageNum": page_num,
                    "returned": len(content),
                    "totalElements": page_body.get("totalElements"),
                    "totalPages": page_body.get("totalPages"),
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
                    return merged, query_trace

            total_pages = page_body.get("totalPages")
            if not content:
                break
            if isinstance(total_pages, int) and total_pages > 0 and page_num >= total_pages:
                break
            if len(content) < page_size:
                break
            page_num += 1

    return merged, query_trace


def fetch_lifecycle(
    opener: request.OpenerDirector,
    *,
    base_url: str,
    token: str,
    requirement_id: str,
    timeout: int,
) -> List[Dict[str, Any]]:
    url = f"{base_url}/api/project/requirement/{parse.quote(requirement_id)}/lifecycle"
    resp = http_json(opener, "GET", url, headers=auth_headers(token), timeout=timeout)
    body = ensure_2xx("fetch_lifecycle", resp, "查询需求生命周期失败")
    if isinstance(body, list):
        return [x for x in body if isinstance(x, dict)]
    return []


def collect_review_remark(
    opener: request.OpenerDirector,
    *,
    base_url: str,
    token: str,
    requirement: Dict[str, Any],
    timeout: int,
) -> Dict[str, Any]:
    status = normalize_text(requirement.get("status")).upper()
    required = status == "PENDING_REVISION"
    requirement_id = normalize_text(requirement.get("id"))

    checked_sources: List[str] = ["requirement.resultMsg"]
    source_values: Dict[str, str] = {}

    result_msg = normalize_text(requirement.get("resultMsg"))
    if result_msg:
        source_values["requirement.resultMsg"] = result_msg

    lifecycle_checked = False
    lifecycle_review_remark = ""
    latest_review_log: Optional[Dict[str, Any]] = None

    if required:
        lifecycle_checked = True
        checked_sources.append("lifecycle.REVIEW.remark")
        logs = fetch_lifecycle(
            opener,
            base_url=base_url,
            token=token,
            requirement_id=requirement_id,
            timeout=timeout,
        )
        review_logs = [x for x in logs if normalize_text(x.get("eventType")).upper() == "REVIEW"]
        if review_logs:
            latest_review_log = review_logs[-1]
            lifecycle_review_remark = normalize_text(latest_review_log.get("remark"))
            if lifecycle_review_remark:
                source_values["lifecycle.REVIEW.remark"] = lifecycle_review_remark

    matched_sources = list(source_values.keys())

    # 去重后拼接
    dedup: List[str] = []
    seen = set()
    for source_key in checked_sources:
        key = normalize_text(source_values.get(source_key))
        if not key or key in seen:
            continue
        seen.add(key)
        dedup.append(key)

    remark_text = "\n".join(dedup)

    return {
        "required": required,
        "lifecycleChecked": lifecycle_checked,
        "checkedSources": checked_sources,
        "sources": matched_sources,
        "sourceValues": source_values,
        "remark": remark_text,
        "latestReview": latest_review_log,
    }


def build_review_basis_block(review_remark_info: Dict[str, Any]) -> str:
    checked_sources = review_remark_info.get("checkedSources") or []
    matched_sources = review_remark_info.get("sources") or []
    checked_text = ", ".join(checked_sources) if checked_sources else "（无）"
    matched_text = ", ".join(matched_sources) if matched_sources else "（无匹配值）"
    remark_text = normalize_text(review_remark_info.get("remark"))

    if not remark_text:
        remark_text = "未读取到明确评审意见（已检查 requirement.resultMsg 与 lifecycle.REVIEW.remark）。建议补充评审意见后再提交评审。"

    return (
        "## 评审意见纳入依据\n"
        f"- 评审备注检查来源：{checked_text}\n"
        f"- 评审备注命中来源：{matched_text}\n"
        f"- 评审意见摘要：{remark_text}\n"
    )


def ensure_revision_basis_in_descr(descr: str, review_remark_info: Dict[str, Any]) -> str:
    if not bool(review_remark_info.get("required")):
        return descr

    if "## 评审意见纳入依据" in descr:
        return descr

    block = build_review_basis_block(review_remark_info)
    return f"{descr.rstrip()}\n\n{block}".strip()


def build_generated_descr(
    requirement: Dict[str, Any],
    *,
    review_remark_info: Dict[str, Any],
    code_context: str,
) -> str:
    rid = normalize_text(requirement.get("id"))
    title = normalize_text(requirement.get("title")) or "（未命名需求）"
    current_descr = normalize_text(requirement.get("descr")) or "（当前描述为空）"
    status = normalize_text(requirement.get("status")).upper()

    sections: List[str] = []
    sections.append(f"# 需求分析（{rid}）")
    sections.append("## 改造目标")
    sections.append(f"- 需求标题：{title}")
    sections.append(f"- 当前状态：{status}")
    sections.append("- 目标：基于现有描述与 quiz 工程结构，形成可直接进入开发/评审的实现方案说明。")

    sections.append("## 现状摘要")
    sections.append(f"- 当前需求描述：{current_descr}")

    if review_remark_info.get("required"):
        sections.append(build_review_basis_block(review_remark_info).rstrip())

    sections.append("## 定位链路")
    sections.append(code_context.strip())

    sections.append("## 实施步骤")
    sections.append("1. 页面层：在 Requirement 页面补齐字段交互与状态提示，确保分析结果可见且可回溯。")
    sections.append("2. API 层：复用 /api/project/requirement/search 与 /{id}/analyze，保持 descr 作为分析主字段。")
    sections.append("3. 后端层：在 RequirementServiceImpl.analyze 保持状态流转到 PENDING_REVIEW，并校验进度范围。")
    sections.append("4. 生命周期：确保 analyze/review 生命周期日志可用于后续追踪与复盘。")

    sections.append("## 风险/回滚")
    sections.append("- 风险：描述改写偏离业务真实意图；状态误流转导致需求提前进入评审。")
    sections.append("- 回滚：可通过需求编辑接口回滚 descr，并将状态调整回待分析/待修订后重新处理。")

    sections.append("## 验收标准")
    sections.append("- 分析描述包含明确改造目标、模块定位、实施步骤、风险与回滚、验收标准。")
    sections.append("- 调用 /api/project/requirement/{id}/analyze 成功，需求状态流转为 PENDING_REVIEW。")
    sections.append("- 对 PENDING_REVISION，描述中明确纳入评审备注来源与修订依据。")

    return "\n".join(sections).strip()


def analyze_requirement(
    opener: request.OpenerDirector,
    *,
    base_url: str,
    token: str,
    requirement_id: str,
    descr: str,
    progress_percent: Optional[int],
    timeout: int,
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {"descr": descr}
    if progress_percent is not None:
        payload["progressPercent"] = progress_percent

    url = f"{base_url}/api/project/requirement/{parse.quote(requirement_id)}/analyze"
    resp = http_json(
        opener,
        "POST",
        url,
        headers=auth_headers(token),
        json_body=payload,
        timeout=timeout,
    )
    body = ensure_2xx("analyze", resp, "需求分析调用失败")
    return {
        "status": resp.get("status"),
        "payload": payload,
        "result": body,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="调用 quiz 需求分析接口（login -> jwt -> query/list -> analyze），仅写 descr（可选 progressPercent）",
    )

    # 单条模式
    parser.add_argument("--requirement-id", help="需求 ID（单条模式必填）")
    parser.add_argument("--descr", help="分析后的需求描述（可选；为空时自动生成模板描述）")

    # 批量模式
    parser.add_argument("--auto-query", action="store_true", help="启用自动查询并批量处理")
    parser.add_argument(
        "--status",
        action="append",
        help="查询状态（可重复或逗号分隔），默认 PENDING_ANALYSIS,PENDING_REVISION",
    )
    parser.add_argument("--project-name", default=DEFAULT_PROJECT_NAME, help="项目名过滤，默认 quiz")
    parser.add_argument("--page-size", type=int, default=DEFAULT_PAGE_SIZE, help=f"查询分页大小，默认 {DEFAULT_PAGE_SIZE}")
    parser.add_argument("--max-items", type=int, default=DEFAULT_MAX_ITEMS, help=f"批量最大处理数，默认 {DEFAULT_MAX_ITEMS}")
    parser.add_argument("--list-only", action="store_true", help="仅查询/预览，不执行 analyze 写回")

    # 公共参数
    parser.add_argument("--progress-percent", type=int, default=None, help="进度百分比（0-100，可选）")
    parser.add_argument("--code-context", default=CODE_UNDERSTANDING_DEFAULT, help="描述中使用的代码结构理解文本")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="服务地址，默认 https://www.quizck.cn")
    parser.add_argument("--user-id", default=DEFAULT_USER_ID, help="登录账号，默认 openclaw")
    parser.add_argument("--user-pwd", default=DEFAULT_USER_PWD, help="登录密码，默认 12345678")
    parser.add_argument("--timeout", type=int, default=15, help="HTTP 超时秒数，默认 15")
    parser.add_argument("--dry-run", action="store_true", help="仅参数校验并输出计划，不发起真实请求")
    return parser


def validate_args(args: argparse.Namespace) -> Dict[str, Any]:
    try:
        requirement_id = normalize_text(args.requirement_id)
        descr = normalize_text(args.descr)
        user_id = normalize_text(args.user_id)
        user_pwd = args.user_pwd or ""
        base_url = normalize_base_url(args.base_url)
        statuses = parse_statuses(args.status)
        project_name = normalize_text(args.project_name) or DEFAULT_PROJECT_NAME

        if not args.auto_query and not requirement_id:
            raise ValueError("非 auto-query 模式下 requirement-id 不能为空")
        if not user_id:
            raise ValueError("user-id 不能为空")
        if not user_pwd:
            raise ValueError("user-pwd 不能为空")
        if args.timeout <= 0:
            raise ValueError("timeout 必须大于 0")
        if args.page_size <= 0:
            raise ValueError("page-size 必须大于 0")
        if args.max_items <= 0:
            raise ValueError("max-items 必须大于 0")

        validate_progress(args.progress_percent)

        return {
            "requirement_id": requirement_id,
            "descr": descr,
            "user_id": user_id,
            "user_pwd": user_pwd,
            "base_url": base_url,
            "statuses": statuses,
            "project_name": project_name,
        }
    except ValueError as ve:
        print_json(
            {
                "ok": False,
                "step": "validate",
                "error": str(ve),
            },
            exit_code=2,
        )


def dry_run_output(args: argparse.Namespace, cfg: Dict[str, Any]) -> None:
    endpoints = {
        "login": "/api/user/login",
        "jwt": f"/api/jwt/generate?userId={parse.quote(cfg['user_id'])}",
        "search": "/api/project/requirement/search",
        "get": "/api/project/requirement/get/{id}",
        "lifecycle": "/api/project/requirement/{id}/lifecycle",
        "analyze": "/api/project/requirement/{id}/analyze",
    }

    mode = "auto-query" if args.auto_query else "single"
    steps: List[str] = [
        "1) login",
        "2) jwt",
    ]

    if args.auto_query:
        steps.extend(
            [
                "3) 按状态查询需求列表（projectName + status）",
                "4) 逐条处理：读取详情；若状态为 PENDING_REVISION，必须读取评审备注（resultMsg + lifecycle.REVIEW.remark）",
                "5) 生成/合并 descr 模板",
                "6) list-only=false 时调用 analyze 写回（仅 descr，可选 progressPercent）",
            ]
        )
    else:
        steps.extend(
            [
                "3) 查询单条需求详情",
                "4) 若状态为 PENDING_REVISION，必须读取评审备注（resultMsg + lifecycle.REVIEW.remark）",
                "5) 生成/合并 descr 模板",
                "6) 调用 analyze 写回（仅 descr，可选 progressPercent）",
            ]
        )

    print_json(
        {
            "ok": True,
            "dryRun": True,
            "mode": mode,
            "plan": {
                "baseUrl": cfg["base_url"],
                "userId": cfg["user_id"],
                "projectName": cfg["project_name"],
                "statuses": cfg["statuses"],
                "requirementId": cfg["requirement_id"] or None,
                "listOnly": bool(args.list_only),
                "endpoints": endpoints,
                "steps": steps,
                "progressPercent": args.progress_percent,
                "providedDescr": bool(cfg["descr"]),
                "reviewRemarkSourcePolicy": {
                    "forStatus": "PENDING_REVISION",
                    "required": True,
                    "sources": ["requirement.resultMsg", "lifecycle.REVIEW.remark"],
                },
            },
        }
    )


def process_single(
    opener: request.OpenerDirector,
    *,
    base_url: str,
    token: str,
    requirement_id: str,
    provided_descr: str,
    progress_percent: Optional[int],
    timeout: int,
    code_context: str,
) -> Dict[str, Any]:
    req = fetch_requirement_detail(
        opener,
        base_url=base_url,
        token=token,
        requirement_id=requirement_id,
        timeout=timeout,
    )

    review_info = collect_review_remark(
        opener,
        base_url=base_url,
        token=token,
        requirement=req,
        timeout=timeout,
    )

    if provided_descr:
        final_descr = ensure_revision_basis_in_descr(provided_descr, review_info)
    else:
        final_descr = build_generated_descr(
            req,
            review_remark_info=review_info,
            code_context=code_context,
        )

    analyze_result = analyze_requirement(
        opener,
        base_url=base_url,
        token=token,
        requirement_id=requirement_id,
        descr=final_descr,
        progress_percent=progress_percent,
        timeout=timeout,
    )

    return {
        "requirementId": requirement_id,
        "status": normalize_text(req.get("status")),
        "reviewRemarkRequired": bool(review_info.get("required")),
        "reviewRemarkCheckedSources": review_info.get("checkedSources"),
        "reviewRemarkSources": review_info.get("sources"),
        "reviewRemarkSourceValues": review_info.get("sourceValues"),
        "reviewRemark": review_info.get("remark"),
        "payload": analyze_result.get("payload"),
        "result": analyze_result.get("result"),
    }


def process_batch(
    opener: request.OpenerDirector,
    *,
    base_url: str,
    token: str,
    project_name: str,
    statuses: Sequence[str],
    page_size: int,
    max_items: int,
    list_only: bool,
    provided_descr: str,
    progress_percent: Optional[int],
    timeout: int,
    code_context: str,
) -> Dict[str, Any]:
    queried, query_trace = query_requirements_by_status(
        opener,
        base_url=base_url,
        token=token,
        project_name=project_name,
        statuses=statuses,
        page_size=page_size,
        max_items=max_items,
        timeout=timeout,
    )

    items: List[Dict[str, Any]] = []
    analyzed_count = 0

    for req in queried:
        rid = normalize_text(req.get("id"))
        status = normalize_text(req.get("status")).upper()
        title = normalize_text(req.get("title"))

        review_info = collect_review_remark(
            opener,
            base_url=base_url,
            token=token,
            requirement=req,
            timeout=timeout,
        )

        if provided_descr:
            final_descr = ensure_revision_basis_in_descr(provided_descr, review_info)
        else:
            final_descr = build_generated_descr(
                req,
                review_remark_info=review_info,
                code_context=code_context,
            )

        record: Dict[str, Any] = {
            "requirementId": rid,
            "title": title,
            "status": status,
            "reviewRemarkRequired": bool(review_info.get("required")),
            "reviewRemarkCheckedSources": review_info.get("checkedSources"),
            "reviewRemarkSources": review_info.get("sources"),
            "reviewRemarkSourceValues": review_info.get("sourceValues"),
            "reviewRemark": review_info.get("remark"),
            "payloadPreview": {
                "descr": final_descr,
                "progressPercent": progress_percent,
            },
        }

        if not list_only:
            analyze_result = analyze_requirement(
                opener,
                base_url=base_url,
                token=token,
                requirement_id=rid,
                descr=final_descr,
                progress_percent=progress_percent,
                timeout=timeout,
            )
            record["analyzeStatus"] = analyze_result.get("status")
            record["analyzeResult"] = analyze_result.get("result")
            analyzed_count += 1

        items.append(record)

    return {
        "queriedCount": len(queried),
        "analyzedCount": analyzed_count,
        "listOnly": list_only,
        "queryTrace": query_trace,
        "items": items,
    }


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    cfg = validate_args(args)

    if args.dry_run:
        dry_run_output(args, cfg)

    cookie_jar = request.HTTPCookieProcessor()
    opener = request.build_opener(cookie_jar)

    token = login_and_get_token(
        opener,
        base_url=cfg["base_url"],
        user_id=cfg["user_id"],
        user_pwd=cfg["user_pwd"],
        timeout=args.timeout,
    )

    if args.auto_query:
        batch_result = process_batch(
            opener,
            base_url=cfg["base_url"],
            token=token,
            project_name=cfg["project_name"],
            statuses=cfg["statuses"],
            page_size=args.page_size,
            max_items=args.max_items,
            list_only=bool(args.list_only),
            provided_descr=cfg["descr"],
            progress_percent=args.progress_percent,
            timeout=args.timeout,
            code_context=args.code_context,
        )

        print_json(
            {
                "ok": True,
                "mode": "auto-query",
                "projectName": cfg["project_name"],
                "statuses": cfg["statuses"],
                **batch_result,
            }
        )

    single_result = process_single(
        opener,
        base_url=cfg["base_url"],
        token=token,
        requirement_id=cfg["requirement_id"],
        provided_descr=cfg["descr"],
        progress_percent=args.progress_percent,
        timeout=args.timeout,
        code_context=args.code_context,
    )

    print_json(
        {
            "ok": True,
            "mode": "single",
            **single_result,
        }
    )


if __name__ == "__main__":
    main()
