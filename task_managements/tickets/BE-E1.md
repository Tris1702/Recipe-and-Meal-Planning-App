---
id: BE-E1
title: Nhật ký bữa ăn
slice: Lát E — Bữa ăn và tổng calo
track: BE
status: todo
depends_on: [BE-0.1, BE-D2]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md
---

# BE-E1 · Nhật ký bữa ăn

**Input:** BE-0.1 (cột `meal_items.portion`), BE-D2.

**Rule:**
- `meal_type` ∈ breakfast / lunch / dinner / snack, bắt buộc. `eaten_at` bắt buộc, không quá hiện tại + 7 ngày.
- `items` ít nhất 1 dòng; `recipe_id` phải là công thức của chính user (không phải → 400); `portion` 0,1–10.
- Tạo / sửa ghi `meals` + thay toàn bộ `meal_items` trong một transaction.
- `GET /meals?date=` trả các bữa của ngày đó, sắp theo `eaten_at`, mỗi món có `calories = calo công thức × portion`.
- Calo luôn tính theo công thức **hiện tại**: sửa công thức thì nhật ký các ngày cũ cũng đổi theo. Đây là giới hạn có
  chủ ý của bản này, ghi lại để không ai coi là bug.

**Output:** `app/routers/meals.py`, `app/services/meal_service.py`.

**Xong khi:** test: tạo bữa trưa 2 món, 1 món ăn nửa phần → tổng đúng; dùng công thức của user khác → 400; xoá bữa →
các `meal_items` cũng mất; lấy theo ngày không lẫn bữa của ngày bên cạnh (23:59 và 00:00).

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
