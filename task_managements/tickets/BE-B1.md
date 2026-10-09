---
id: BE-B1
title: Sửa hồ sơ
slice: Lát B — Hồ sơ và cân nặng
track: BE
status: todo
depends_on: [BE-A2]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md
---

# BE-B1 · Sửa hồ sơ

**Input:** BE-A2.

**Rule:**
- Sửa được `name`, `birth_date`, `gender`, `height_cm`, `daily_calorie_goals`. Không sửa `weight_g` ở đây
  (cân nặng đi qua BE-B2).
- `name` 1–100 ký tự; `height_cm` 50–250; `daily_calorie_goals` 800–6000; `birth_date` kiểu ngày (`YYYY-MM-DD`, cột `date`), không ở tương lai.
- Chỉ trường có trong body mới được cập nhật (`model_dump(exclude_unset=True)`).

**Output:** `PATCH /me` → `User` sau khi sửa.

**Xong khi:** test: sửa 1 trường giữ nguyên trường khác; giá trị ngoài khoảng → 422; gửi `weight_g` bị bỏ qua.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
