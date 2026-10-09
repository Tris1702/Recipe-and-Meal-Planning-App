---
id: BE-C1
title: Danh mục nguyên liệu dùng chung
slice: Lát C — Nguyên liệu
track: BE
status: todo
depends_on: [BE-0.1, BE-A2]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md
---

# BE-C1 · Danh mục nguyên liệu dùng chung

**Input:** BE-0.1, BE-A2; code hiện có `app/routers/product.py`.

**Việc cần làm:**
- Danh mục nguyên liệu đã được migration `0002` (BE-0.1) nạp sẵn: 29 nguyên liệu, 32 định lượng. Muốn thêm hoặc
  sửa nguyên liệu thì viết migration mới, không sửa `0002`.
- `GET /products?q=` tìm theo tên, không phân biệt hoa thường (`ILIKE`), có phân trang.
- `GET /products/{id}` trả kèm danh sách `nutritions`.
- Người dùng chỉ đọc; không có API tạo/sửa nguyên liệu ở bản này.

**Output:** `GET /products`, `GET /products/{id}`.

**Xong khi:** `GET /products?q=gà` trả các nguyên liệu có "gà" trong tên (không phân biệt hoa thường); phân trang
đúng `total`; id không tồn tại → 404.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
