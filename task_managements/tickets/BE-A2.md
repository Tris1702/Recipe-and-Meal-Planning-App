---
id: BE-A2
title: Bảo vệ route bằng token
slice: Lát A — Tài khoản
track: BE
status: todo
depends_on: [BE-A1]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md#L259
---

# BE-A2 · Bảo vệ route bằng token

**Input:** BE-A1.

**Việc cần làm:**
- `app/core/security.py`: `get_current_user(token) -> CurrentUser(user_id)` dùng `HTTPBearer`, gọi
  `decode_access_token` (đã có ở `auth_service`, trả `TokenClaims`). Token hết hạn / sai chữ ký / thiếu → 401 kèm header `WWW-Authenticate: Bearer`.
- Token mang `sub = auth.id`; dependency tra ra `user_id` tương ứng.
- `GET /me` trả `User`.
- Gắn dependency vào router `products` và mọi router sau này.

**Output:** `app/core/security.py`, `app/routers/me.py`.

**Xong khi:** test: không token → 401; token hết hạn → 401; token hợp lệ → `/me` trả đúng user; `GET /products`
không token → 401.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
