---
id: WEB-D1
title: Danh sách và chi tiết công thức
slice: Lát D — Công thức
track: WEB
status: todo
depends_on: [BE-D1, BE-D2, WEB-A1]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md#L463
---

# WEB-D1 · Danh sách và chi tiết công thức

**Input:** BE-D1, BE-D2, WEB-A1. Wireframe S-05, S-06.

**Việc cần làm:** `views/RecipeListView.vue` (ô tìm, thẻ công thức hiện tổng calo và giá, phân trang),
`views/RecipeDetailView.vue` (bảng nguyên liệu, cách làm, nút Sửa / Xoá; xoá gặp 409 thì hiện thông điệp).

**Output:** xem và xoá công thức trên web.

**Xong khi:** tìm "gà" lọc đúng; xoá công thức chưa dùng → biến mất khỏi danh sách; xoá công thức đã dùng → báo lỗi,
không mất.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
