# Planning — Recipe & Meal Planning App

Bộ tài liệu chuẩn bị cho app công thức và kế hoạch bữa ăn: **FastAPI + PostgreSQL** cho backend, **Vue 3** cho
web, **Flutter** cho app iOS/Android.

> **Cập nhật 2026-10-09.** Stack đã đổi từ Dart Frog + Flutter-một-codebase sang FastAPI + Vue + Flutter, và phạm vi
> thu hẹp theo schema thật (nay ở `../src/backend/migrations/sql/0001_init.sql`). [05-implementation-plan.md](./05-implementation-plan.md) đã
> viết lại theo hướng mới và là tài liệu để làm theo. Tài liệu 01–04 viết cho phạm vi cũ: chỉ dùng để tham khảo
> rule và wireframe, phần nào mâu thuẫn với 05 thì theo 05.

`doc-id` dùng chung cho cả bộ: `2026-09-22-recipe-meal-planning-mvp`.

## Đọc theo thứ tự

| # | Tài liệu | Trả lời câu hỏi | Trạng thái |
|---|----------|-----------------|-----------|
| 1 | [01-spec.md](./01-spec.md) | Sản phẩm **phải làm gì** — 11 user story, 76 business rule kèm ví dụ ✅/❌, 11 NFR, phạm vi loại trừ | `draft` |
| 2 | [02-tech-design.md](./02-tech-design.md) | **Làm bằng cách nào** — kiến trúc, 10 quyết định kiến trúc kèm lý do, hợp đồng API, luồng dữ liệu, rủi ro | `draft` |
| 3 | [03-database.md](./03-database.md) | **Cơ sở dữ liệu** — 12 bảng kèm DDL và ràng buộc, index, ba truy vấn then chốt, danh sách migration | `draft` |
| 4 | [04-mock-ui.md](./04-mock-ui.md) | **Mock UI** — wireframe 12 màn hình ở ba dải bề rộng, kèm BR mà mỗi màn hình phải làm hiện ra được | `draft` |
| 5 | [05-implementation-plan.md](./05-implementation-plan.md) | **Các bước** — 6 lát cắt, 30 task chia BE / Web / App, mỗi task ghi rõ input và output | `draft` (rev 3) |

## Quyết định nền tảng đã chốt

| Hạng mục | Lựa chọn |
|----------|----------|
| Nền tảng | Web (Vue 3) + iOS/Android (Flutter) |
| Backend | FastAPI (Python 3.12), router → service, SQL viết tay bằng psycopg2 |
| Cơ sở dữ liệu | PostgreSQL 16, migration bằng Alembic, mỗi revision chạy một file SQL viết tay |
| Xác thực | Username/mật khẩu (argon2id), JWT access token |
| Multi-user | Nguyên liệu dùng chung; công thức, bữa ăn, cân nặng riêng từng user |

## Phạm vi MVP

Xem [05-implementation-plan.md](./05-implementation-plan.md) mục 1: tài khoản, hồ sơ và lịch sử cân nặng, danh mục
nguyên liệu dùng chung, công thức, nhật ký bữa ăn, tổng calo theo ngày so với mục tiêu.

## Bộ tài liệu này được dựng thế nào

Theo pipeline spec-driven: `discovery` → `to-spec` → `to-tech-design` → `to-plan`.

Bước `discovery` chạy **Three Amigos** bằng ba agent context sạch (Product, Developer, Tester), mỗi agent
soi cùng một brief qua một lăng kính. Các câu hỏi chặn mà cả ba cùng nêu đã được đưa cho người dùng quyết
bằng lựa chọn, ghi lại ở [01-spec.md](./01-spec.md) mục 6 (OQ-01…OQ-11).

Bỏ qua bước `to-bdd` (sinh `.feature` Gherkin cho 76 BR) vì yêu cầu là tài liệu planning. Đây là bước tiếp
theo của pipeline nếu muốn khoá hành vi thành living docs trước khi viết code.

## Trạng thái và bước tiếp theo

Đang làm theo [05-implementation-plan.md](./05-implementation-plan.md) (rev 3). Tiến độ từng task xem ở
[`../task_managements/process_task.md`](../task_managements/process_task.md) (BE-0.1 đã xong). 01–04 giữ ở
`status: draft` và chỉ dùng để tham khảo.

Việc còn treo:

| # | Việc | Trạng thái |
|---|------|-----------|
| TQ-02 | Nguồn dữ liệu dinh dưỡng nguyên liệu Việt | Tạm dùng USDA + Bảng thành phần thực phẩm VN cho danh mục trong migration `0002`; cần chốt nếu mở rộng danh mục |
| TQ-03 | Chọn nơi triển khai | Còn mở; OPS-1 mới chỉ chạy bằng Docker Compose |
| TQ-01 | Object storage và email | Ngoài phạm vi bản này (không có ảnh, quên mật khẩu) |
| TQ-04 | Chạy `to-bdd` trước khi code | Chưa chạy; hiện test viết theo mục "Xong khi" của từng task |
