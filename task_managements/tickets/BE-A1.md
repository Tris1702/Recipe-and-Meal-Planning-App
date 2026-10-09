---
id: BE-A1
title: Hoàn thiện đăng ký và đăng nhập
slice: Lát A — Tài khoản
track: BE
status: todo
depends_on: [BE-0.1, BE-0.2]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md#L241
---

# BE-A1 · Hoàn thiện đăng ký và đăng nhập

**Input:** BE-0.1, BE-0.2; code hiện có ở `app/services/auth_service.py`, `app/routers/auth.py`.

**Rule:**
- Username 3–30 ký tự, chỉ gồm `a-z 0-9 . _`, lưu dạng chữ thường. ✅ `Hoa.CTP` → lưu `hoa.ctp`. ❌ `ab`, `hoa ctp`.
- Password 8–128 ký tự. `confirm_password` phải khớp.
- Username đã tồn tại → 409. Hai lượt đăng ký cùng lúc cùng username: một lượt thành công, lượt kia 409 (bắt
  `UniqueViolation`, không chỉ dựa vào câu SELECT kiểm tra trước).
- Sai username hoặc password → cùng một thông điệp 401 "Sai tên đăng nhập hoặc mật khẩu".
- Tạo `users` + `auths` trong một transaction (đã làm).

**Output:** `POST /sign-up` → 201 `{id}`; `POST /login` → `{access_token, token_type: "bearer"}`, token hết hạn sau
`ACCESS_TOKEN_EXPIRE_MINUTES`. Validate bằng `Field(...)` trong `routers/request/*.py`.

**Xong khi:** test trong `tests/test_auth.py` pass cho các trường hợp: đăng ký ok, trùng username, password ngắn,
confirm sai, login ok, sai password, user không tồn tại, lỗi giữa chừng không để lại dòng `users` mồ côi.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
