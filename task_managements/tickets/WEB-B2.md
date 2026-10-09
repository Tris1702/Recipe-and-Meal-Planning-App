---
id: WEB-B2
title: Trang cân nặng
slice: Lát B — Hồ sơ và cân nặng
track: WEB
status: todo
depends_on: [BE-B2, WEB-B1]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md#L354
---

# WEB-B2 · Trang cân nặng

**Input:** BE-B2, WEB-B1.

**Việc cần làm:** `views/WeightView.vue` — form thêm cân nặng (nhập kg, gửi gram), danh sách các lần cân, nút xoá,
biểu đồ đường theo thời gian (`chart.js` + `vue-chartjs`).

**Output:** quản lý lịch sử cân nặng trên web.

**Xong khi:** nhập 65,5 kg → API nhận `65500`; biểu đồ cập nhật ngay; xoá một dòng → biểu đồ và hồ sơ cập nhật.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
