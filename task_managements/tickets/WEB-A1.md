---
id: WEB-A1
title: Màn đăng nhập và đăng ký
slice: Lát A — Tài khoản
track: WEB
status: todo
depends_on: [BE-A1, BE-A2, WEB-0.1]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md
---

# WEB-A1 · Màn đăng nhập và đăng ký

**Input:** BE-A1, BE-A2, WEB-0.1. Tham khảo wireframe S-01 trong [04-mock-ui.md](./04-mock-ui.md).

**Việc cần làm:**
- `views/LoginView.vue`, `views/RegisterView.vue`: validate giống rule BE-A1 ngay trên form; hiện lỗi từ `detail`.
- `stores/auth.ts` (Pinia): `login()`, `register()`, `logout()`, `me`. Token lưu `localStorage`.
- Router guard: chưa có token → chuyển `/login`; đã đăng nhập mà vào `/login` → chuyển `/`.
- Đăng ký xong tự đăng nhập luôn.

**Output:** đăng ký, đăng nhập, đăng xuất chạy được trên web.

**Xong khi:** đăng ký user mới → vào trang chủ thấy tên; reload vẫn đăng nhập; đăng xuất → về `/login`; token hết
hạn → tự về `/login`. Unit test cho validate form.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
