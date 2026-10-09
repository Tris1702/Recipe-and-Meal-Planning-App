---
id: BE-B2
title: Lịch sử cân nặng
slice: Lát B — Hồ sơ và cân nặng
track: BE
status: todo
depends_on: [BE-0.1, BE-A2]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md#L325
---

# BE-B2 · Lịch sử cân nặng

**Input:** BE-0.1 (bảng `user_health_records`), BE-A2.

**Rule:**
- `weight_g` 20.000–400.000. `recorded_at` mặc định là hiện tại, không ở tương lai.
- Thêm bản ghi → cập nhật `users.weight_g` bằng bản ghi có `recorded_at` mới nhất (trùng giờ thì lấy `id` lớn
  hơn; DB cho phép hai lần cân cùng thời điểm), trong cùng transaction.
  Xoá bản ghi → tính lại `users.weight_g` theo bản ghi mới nhất còn lại (không còn bản ghi nào → `NULL`).
- Danh sách sắp `recorded_at` giảm dần; lọc `from`/`to` theo ngày.

**Output:** `GET/POST/DELETE /me/health-records`; `app/services/health_record_service.py`.

**Xong khi:** test: thêm 2 bản ghi khác ngày → `/me` trả cân nặng của bản mới nhất; xoá bản mới nhất →
`/me` quay về bản trước; xoá bản ghi của user khác → 404.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
