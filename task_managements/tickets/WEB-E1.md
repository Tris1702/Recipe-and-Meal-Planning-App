---
id: WEB-E1
title: Nhật ký bữa ăn theo ngày
slice: Lát E — Bữa ăn và tổng calo
track: WEB
status: todo
depends_on: [BE-E1, WEB-D1]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md
---

# WEB-E1 · Nhật ký bữa ăn theo ngày

**Input:** BE-E1, WEB-D1. Wireframe S-04, S-10.

**Việc cần làm:** `views/MealDiaryView.vue` — chọn ngày (nút ngày trước / sau / hôm nay), 4 nhóm bữa, mỗi bữa liệt kê
món và calo. Nút "Thêm món" mở dialog chọn công thức + phần ăn + giờ ăn. Sửa / xoá bữa.

**Output:** ghi nhật ký bữa ăn trên web.

**Xong khi:** thêm bữa sáng 1 món → hiện đúng nhóm, đúng calo; chuyển sang ngày hôm sau không thấy bữa đó.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
