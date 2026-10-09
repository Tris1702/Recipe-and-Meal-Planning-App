---
id: BE-0.2
title: Dọn nền backend
slice: Phase 0 — Nền móng
track: BE
status: todo
depends_on: []
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md
---

# BE-0.2 · Dọn nền backend

**Input:** code backend hiện tại; review auth ngày 2026-10-08.

**Việc cần làm:**
- `app/core/config.py`: đọc env bằng `pydantic-settings`, **fail ngay khi khởi động** nếu thiếu biến. Tên biến đã
  chốt ở BE-0.1: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`,
  `ACCESS_TOKEN_EXPIRE_MINUTES`; `app/db/database.py`, `auth_service.py` và `migrations/env.py` chuyển sang đọc
  từ config này. Chỉ chấp nhận `JWT_ALGORITHM` ∈ {HS256, HS384, HS512}, `JWT_SECRET_KEY` dài ≥ 32 ký tự.
- Thêm `.env.example` liệt kê đủ biến, không có giá trị thật.
- `app/core/errors.py`: exception handler chung — `AppException(status_code, message)` → JSON `{"detail": ...}`.
  Lỗi không lường trước → `logger.exception(...)` + 500. Bỏ các `try/except` trả `Response` trong router.
- Thay `print` bằng `logging`. Bỏ log có chứa password hash.
- `main.py`: bỏ `connect_to_database()` lúc import; dùng `psycopg2.pool.SimpleConnectionPool` mở trong
  `lifespan`; thêm CORS cho origin web (`http://localhost:5173`); thêm `GET /health`.
- Route nào gọi DB thì dùng `def`, không dùng `async def`.
- Thiết lập test: `pytest`, `httpx`, DB test riêng (`DB_NAME=recipe_test`); fixture chạy `alembic upgrade head`
  (qua `alembic.command.upgrade`) lên DB test một lần mỗi phiên, mỗi test chạy trong transaction rồi rollback.
  Không chạy `seed_dev.py` cho test: test tự tạo dữ liệu mình cần.

**Output:** `app/core/config.py`, `app/core/errors.py`, `.env.example`, `tests/conftest.py`, `pyproject.toml` có
nhóm dev `pytest`.

**Xong khi:**
- Xoá `JWT_SECRET_KEY` khỏi `.env` → app không khởi động được, báo rõ thiếu biến nào.
- `uv run pytest` chạy được, có test `GET /health` → 200.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
