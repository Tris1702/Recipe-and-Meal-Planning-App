# Migration (Alembic)

Mỗi revision trong `versions/` chạy một file SQL viết tay trong `sql/` và có `downgrade()`. Không dùng
`--autogenerate` (không có model SQLAlchemy). Kết nối lấy từ `.env`: `DB_HOST`, `DB_PORT` (mặc định 5432),
`DB_NAME`, `DB_USER`, `DB_PASSWORD`. Biến đã có trong shell được ưu tiên hơn `.env`; Alembic in DB đích ở dòng đầu.

Chạy trong `src/backend`:

| Việc | Lệnh |
|---|---|
| Tạo bảng + danh mục nguyên liệu | `uv run alembic upgrade head` |
| Thêm dữ liệu mẫu cho dev | `uv run python -m scripts.seed_dev` |
| Xem DB đang ở revision nào | `uv run alembic current` |
| Xem SQL sẽ chạy, không đụng DB | `uv run alembic upgrade head --sql` |
| Tạo revision mới | `uv run alembic revision -m "<mô tả>" --rev-id 0003` |

## Quy tắc

- Không sửa revision đã chạy trên DB của người khác; thay đổi thì tạo revision mới.
- SQL đi qua `op.execute`, tức `sqlalchemy.text()`: chuỗi `:ten` đứng sau ký tự không phải chữ/số (dấu cách,
  `(`, `,` …) bị hiểu là tham số bind. Giờ như `'07:30'` không sao (dấu `:` đứng sau chữ số). Cần `:` thật trước
  một từ thì viết `\:`.
- `0001` chạy `ALTER DATABASE … SET timezone`, nên user chạy migration phải là chủ sở hữu DB (hoặc superuser).
  Múi giờ mới chỉ áp cho phiên kết nối mở sau đó: revision nào cần `now()` theo giờ Việt Nam thì tự
  `SET LOCAL timezone = 'Asia/Ho_Chi_Minh'` ở đầu file SQL.
- `0001` đã được sửa sau lần chạy đầu (commit `3aa4e26`: index, CHECK, múi giờ). DB nào đã chạy `0001` trước
  commit đó phải tạo lại (drop DB rồi `upgrade head` + `seed_dev`), vì `upgrade head` sẽ báo không có gì mới.
- `downgrade` của `0002` dùng `DELETE` nên sẽ báo lỗi nếu công thức của user còn dùng nguyên liệu (cố ý, không
  xoá ngầm). DB đã chạy `seed_dev` muốn về trống thì drop DB rồi tạo lại thay vì `downgrade base`.
