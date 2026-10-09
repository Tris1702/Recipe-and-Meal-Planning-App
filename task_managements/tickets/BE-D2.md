---
id: BE-D2
title: Tính calo và giá cho công thức
slice: Lát D — Công thức
track: BE
status: todo
depends_on: [BE-D1]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md
---

# BE-D2 · Tính calo và giá cho công thức

**Input:** BE-D1.

**Việc cần làm:** một hàm SQL hoặc Python duy nhất tính `calories`, `price` mỗi dòng và `total_calories`,
`total_price` theo công thức ở mục 3. Dùng cho cả `RecipeSummary` (danh sách) và `RecipeDetail`. Danh sách phải
tính bằng một câu SQL có `GROUP BY`, không gọi lặp từng công thức.

**Output:** các trường `total_calories`, `total_price`, `items[].calories`, `items[].price` có giá trị đúng.

**Xong khi:** test với ví dụ ở mục 3 (250 g ức gà → 412,5 kcal, 30.000đ); công thức 2 nguyên liệu cộng đúng;
nguyên liệu có `price` NULL → giá dòng đó là NULL, tổng giá chỉ cộng các dòng có giá.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
