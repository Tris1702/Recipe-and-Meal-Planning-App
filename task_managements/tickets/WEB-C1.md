---
id: WEB-C1
title: Ô chọn nguyên liệu
slice: Lát C — Nguyên liệu
track: WEB
status: todo
depends_on: [BE-C1, WEB-A1]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md
---

# WEB-C1 · Ô chọn nguyên liệu

**Input:** BE-C1, WEB-A1. Wireframe S-08.

**Việc cần làm:** `components/ProductPicker.vue` — ô tìm kiếm (debounce 300 ms), chọn nguyên liệu, rồi chọn một
định lượng (ví dụ "100 gram – 165 kcal – 12.000đ"). Emit `{product_nutrition_id, product_name, measure_unit, measurement}`.
Component này chỉ dùng trong màn soạn công thức (WEB-D2), chưa cần trang riêng.

**Output:** component dùng lại được.

**Xong khi:** gõ "ga" → hiện danh sách sau 300 ms; chọn xong emit đúng dữ liệu (unit test với API giả).

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
