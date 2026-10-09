---
id: APP-A1
title: Màn đăng nhập và đăng ký
slice: Lát A — Tài khoản
track: APP
status: todo
depends_on: [BE-A1, BE-A2, APP-0.1]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md
---

# APP-A1 · Màn đăng nhập và đăng ký

**Input:** BE-A1, BE-A2, APP-0.1.

**Việc cần làm:** giống WEB-A1 — `features/auth/login_screen.dart`, `register_screen.dart`, `auth_controller.dart`
(Riverpod). Token lưu bằng `flutter_secure_storage`. `go_router` redirect theo trạng thái đăng nhập.

**Output:** đăng ký, đăng nhập, đăng xuất chạy được trên app.

**Xong khi:** các kịch bản như WEB-A1 chạy được trên emulator Android và iOS simulator; widget test cho form.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
