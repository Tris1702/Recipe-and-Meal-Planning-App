---
id: WEB-D2
title: Soạn và sửa công thức
slice: Lát D — Công thức
track: WEB
status: todo
depends_on: [WEB-C1, WEB-D1]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md
---

# WEB-D2 · Soạn và sửa công thức

**Input:** WEB-C1, WEB-D1. Wireframe S-07.

**Việc cần làm:** `views/RecipeEditorView.vue` dùng cho cả tạo và sửa — tên, cách làm, danh sách nguyên liệu (thêm
bằng `ProductPicker`, nhập số lượng, xoá dòng). Tổng calo và giá **ước tính** ngay trên form; sau khi lưu hiện số
từ BE. Rời trang khi chưa lưu → hỏi xác nhận (dùng modal của trang, không dùng `window.confirm`).

**Output:** tạo và sửa công thức trên web.

**Xong khi:** tạo công thức 3 nguyên liệu → trang chi tiết hiện đúng tổng; sửa bớt 1 nguyên liệu → tổng giảm đúng;
chọn trùng nguyên liệu → form chặn trước khi gửi.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
