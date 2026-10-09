---
id: OPS-1
title: Chạy toàn bộ bằng Docker Compose
slice: Phase cuối — Đóng gói
track: OPS
status: todo
depends_on: [BE-0.1, BE-0.2, WEB-0.1, BE-A1, BE-A2, WEB-A1, BE-B1, BE-B2, WEB-B1, WEB-B2, BE-C1, WEB-C1, BE-D1, BE-D2, WEB-D1, WEB-D2, BE-E1, BE-E2, WEB-E1, WEB-E2]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md
---

# OPS-1 · Chạy toàn bộ bằng Docker Compose

**Input:** tất cả task BE và WEB.

**Việc cần làm:** `docker-compose.yml` ở gốc gồm `db` (postgres:16), `api` (chạy `alembic upgrade head` rồi
`fastapi run`; không chạy `seed_dev.py`), `web` (build Vite, phục vụ bằng nginx). README gốc hướng dẫn chạy và trỏ
app Flutter tới API.

**Output:** `docker compose up` dựng được cả hệ thống từ máy sạch.

**Xong khi:** trên máy chưa cài gì ngoài Docker: `docker compose up` → mở web, đăng ký, tạo công thức, ghi bữa ăn,
thấy tổng calo.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
