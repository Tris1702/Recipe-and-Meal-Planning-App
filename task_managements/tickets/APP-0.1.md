---
id: APP-0.1
title: Khởi tạo dự án Flutter
slice: Phase 0 — Nền móng
track: APP
status: todo
depends_on: [BE-0.2]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md
---

# APP-0.1 · Khởi tạo dự án Flutter

**Input:** BE-0.2 xong.

**Việc cần làm:**
- `flutter create --platforms=ios,android src/frontend/app`.
- Thêm `flutter_riverpod`, `go_router`, `dio`, `flutter_secure_storage`, `intl`.
- `lib/core/api_client.dart`: dio với `baseUrl` từ `--dart-define=API_URL=...`; interceptor gắn token, 401 → đăng xuất.
  Android emulator dùng `http://10.0.2.2:8000`.
- Bottom navigation 4 tab (Hôm nay, Bữa ăn, Công thức, Hồ sơ). Tab đầu tạm gọi `/health`.

**Output:** `src/frontend/app/` chạy được trên emulator.

**Xong khi:** app hiện "API: ok". `flutter analyze` và `flutter test` pass.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
