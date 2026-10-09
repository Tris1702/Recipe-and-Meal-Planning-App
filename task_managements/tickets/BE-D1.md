---
id: BE-D1
title: CRUD công thức
slice: Lát D — Công thức
track: BE
status: todo
depends_on: [BE-0.1, BE-C1]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md
---

# BE-D1 · CRUD công thức

**Input:** BE-0.1 (cột `recipes.user_id`), BE-C1.

**Rule:**
- Công thức thuộc user tạo ra; user khác đọc/sửa/xoá → 404.
- `name` 1–200 ký tự, bắt buộc. `detail_recipe` tuỳ chọn, tối đa 10.000 ký tự.
- `items` có ít nhất 1 dòng. Mỗi `product_nutrition_id` chỉ xuất hiện 1 lần (trùng → 400). `quantity > 0`.
  `product_nutrition_id` không tồn tại → 400.
- Tạo / sửa = ghi `recipes` + thay toàn bộ `recipe_items` trong một transaction.
- Xoá công thức đang có trong `meal_items` → 409 "Công thức đang được dùng trong nhật ký bữa ăn".
- Danh sách tìm theo tên (`?q=`), sắp theo `updated_at` giảm dần. `updated_at` do trigger DB tự gán khi UPDATE
  `recipes`; code chỉ cần UPDATE dòng `recipes` (kể cả khi chỉ đổi nguyên liệu) để thời điểm sửa được ghi lại.

**Output:** `app/routers/recipes.py`, `app/services/recipe_service.py`, các endpoint `/recipes` theo mục 4.

**Xong khi:** test cho từng rule trên, trong đó có: sửa công thức có lỗi ở dòng nguyên liệu thứ 2 → công thức giữ
nguyên như trước khi sửa.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
