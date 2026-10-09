---
id: WEB-E2
title: Trang "Hôm nay"
slice: Lát E — Bữa ăn và tổng calo
track: WEB
status: todo
depends_on: [BE-E2, WEB-E1]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md#L551
---

# WEB-E2 · Trang "Hôm nay"

**Input:** BE-E2, WEB-E1. Wireframe S-03 (rút gọn).

**Việc cần làm:** `views/TodayView.vue` là trang chủ — vòng tiến độ calo đã ăn / mục tiêu, số còn lại, calo theo
từng bữa, lối tắt "Thêm bữa ăn". Chưa đặt mục tiêu → hiện lời nhắc sang trang Hồ sơ.

**Output:** trang chủ web.

**Xong khi:** thêm một bữa ở WEB-E1 rồi quay lại trang chủ → số liệu cập nhật; ăn quá mục tiêu → hiện "Vượt X kcal".

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
