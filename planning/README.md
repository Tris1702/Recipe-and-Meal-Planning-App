# Planning — Recipe & Meal Planning App

Bộ tài liệu chuẩn bị cho một sản phẩm fullstack Dart: **Flutter** cho giao diện (iOS, Android, Web từ một
codebase) và **Dart Frog + PostgreSQL** cho backend.

`doc-id` dùng chung cho cả bộ: `2026-09-22-recipe-meal-planning-mvp`.

## Đọc theo thứ tự

| # | Tài liệu | Trả lời câu hỏi | Trạng thái |
|---|----------|-----------------|-----------|
| 1 | [01-spec.md](./01-spec.md) | Sản phẩm **phải làm gì** — 11 user story, 76 business rule kèm ví dụ ✅/❌, 11 NFR, phạm vi loại trừ | `draft` |
| 2 | [02-tech-design.md](./02-tech-design.md) | **Làm bằng cách nào** — kiến trúc, 10 quyết định kiến trúc kèm lý do, hợp đồng API, luồng dữ liệu, rủi ro | `draft` |
| 3 | [03-database.md](./03-database.md) | **Cơ sở dữ liệu** — 12 bảng kèm DDL và ràng buộc, index, ba truy vấn then chốt, danh sách migration | `draft` |
| 4 | [04-mock-ui.md](./04-mock-ui.md) | **Mock UI** — wireframe 12 màn hình ở ba dải bề rộng, kèm BR mà mỗi màn hình phải làm hiện ra được | `draft` |
| 5 | [05-implementation-plan.md](./05-implementation-plan.md) | **Các bước** — 8 lát cắt dọc, 65 task, mỗi BR thuộc đúng một task | `draft` |

## Quyết định nền tảng đã chốt

| Hạng mục | Lựa chọn |
|----------|----------|
| Nền tảng | iOS + Android + Web, **một** codebase Flutter, responsive ba dải |
| Backend | Dart Frog (REST), ba lớp route → service → repository, SQL viết tay |
| Cơ sở dữ liệu | PostgreSQL 16 (`unaccent`, `pg_trgm`, `citext`) |
| Dữ liệu | Online-only; ngoại lệ duy nhất là **nháp công thức lưu trên máy chủ** |
| Xác thực | Email/mật khẩu tự quản lý, JWT access 15 phút + refresh 30 ngày xoay vòng |
| Multi-user | Một tài khoản = một kho dữ liệu; không chia sẻ giữa các tài khoản |
| Nguyên liệu | Danh mục do hệ thống seed sẵn + nguyên liệu riêng của người dùng |
| Lịch sử | Mục lịch ngày quá khứ giữ snapshot số liệu; hôm nay và tương lai tham chiếu sống |

## Phạm vi MVP

**Trong phạm vi:** công thức (CRUD, nháp, nhân bản, ảnh, tag) · tìm kiếm không dấu theo tên/nguyên liệu/tag ·
kế hoạch bữa ăn theo lịch tuần, bốn bữa, nhiều món mỗi bữa, sao chép tuần · dinh dưỡng (calo và ba macro,
theo công thức và theo ngày, mục tiêu calo) · tủ đồ (lô theo hạn dùng, đối chiếu "thiếu gì, thiếu bao nhiêu",
lọc "nấu được với đồ đang có") · tài khoản (đăng ký, đăng nhập, quên mật khẩu, xoá tài khoản).

**Ngoài phạm vi:** shopping list có vòng đời · household nhiều tài khoản · cộng đồng và công thức công khai ·
import từ URL/ảnh · offline · pantry tự trừ tồn · vi chất · đa ngôn ngữ · công thức lồng công thức.
Danh sách đầy đủ ở [01-spec.md](./01-spec.md) mục 5.

## Bộ tài liệu này được dựng thế nào

Theo pipeline spec-driven: `discovery` → `to-spec` → `to-tech-design` → `to-plan`.

Bước `discovery` chạy **Three Amigos** bằng ba agent context sạch (Product, Developer, Tester), mỗi agent
soi cùng một brief qua một lăng kính. Các câu hỏi chặn mà cả ba cùng nêu đã được đưa cho người dùng quyết
bằng lựa chọn, ghi lại ở [01-spec.md](./01-spec.md) mục 6 (OQ-01…OQ-11).

Bỏ qua bước `to-bdd` (sinh `.feature` Gherkin cho 76 BR) vì yêu cầu là tài liệu planning. Đây là bước tiếp
theo của pipeline nếu muốn khoá hành vi thành living docs trước khi viết code.

## Trạng thái và bước tiếp theo

Cả năm tài liệu đang ở `status: draft`. Theo pipeline, **chỉ người dùng** mới được đổi sang `ready`, và
`exec-plan` chỉ chạy khi spec + tech-design + plan đều `ready`.

Việc còn treo trước khi viết dòng code đầu tiên:

| # | Việc | Chặn gì |
|---|------|---------|
| TQ-02 | Chốt nguồn dữ liệu dinh dưỡng nguyên liệu Việt | Lát cắt dinh dưỡng và cold start |
| TQ-01 | Chọn nhà cung cấp object storage và email | Ảnh công thức, đặt lại mật khẩu |
| TQ-03 | Chọn nơi triển khai | Chỉ khâu deploy |
| TQ-04 | Có chạy `to-bdd` trước khi code không | Hình dạng khâu test E2E |
