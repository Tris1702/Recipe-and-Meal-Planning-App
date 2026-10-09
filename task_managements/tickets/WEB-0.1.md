---
id: WEB-0.1
title: Khởi tạo dự án Vue
slice: Phase 0 — Nền móng
track: WEB
status: todo
depends_on: [BE-0.2]
assignee:
updated: 2026-10-09
source: planning/05-implementation-plan.md#L203
---

# WEB-0.1 · Khởi tạo dự án Vue

**Input:** BE-0.2 xong (có CORS và `/health`).

**Việc cần làm:**
- `npm create vue@latest src/frontend/web` (chọn TypeScript, Router, Pinia, Vitest, ESLint).
- `src/api/http.ts`: axios instance, `baseURL` lấy từ `VITE_API_URL`; interceptor gắn `Authorization` nếu có token;
  nhận 401 → xoá token, chuyển về `/login`.
- Layout chung: thanh điều hướng (Hôm nay, Bữa ăn, Công thức, Hồ sơ), vùng nội dung. Responsive ≥ 360px.
- Trang `/` tạm gọi `/health` và hiện kết quả.

**Output:** `src/frontend/web/` chạy được bằng `npm run dev`.

**Xong khi:** mở `http://localhost:5173` thấy "API: ok". `npm run build` và `npm run test:unit` pass.

## Ghi chú

<!-- Tiến độ, quyết định, link commit/MR -->
