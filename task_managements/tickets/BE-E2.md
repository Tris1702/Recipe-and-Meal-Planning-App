---
id: BE-E2
title: Tổng calo theo ngày
slice: Lát E — Bữa ăn và tổng calo
track: BE
status: todo
depends_on: [BE-E1, BE-B1]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md
---

# BE-E2 · Tổng calo theo ngày

**Input:** BE-E1, BE-B1.

**Rule:** `total_calories` = tổng calo các món trong ngày; `remaining_calories = goal - total` (có thể âm);
chưa đặt mục tiêu → `goal_calories` và `remaining_calories` là `null`. `by_meal_type` luôn đủ 4 khoá, bữa không ăn = 0.

**Output:** `GET /me/daily-summary?date=`.

**Xong khi:** test: ngày không có bữa nào → tổng 0, đủ 4 khoá; ăn quá mục tiêu → `remaining_calories` âm.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
