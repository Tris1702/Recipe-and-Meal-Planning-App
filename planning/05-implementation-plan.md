---
doc-id: 2026-09-22-recipe-meal-planning-mvp
status: draft
revision: 3 — 2026-10-09, migration bằng Alembic; schema chuẩn ở `src/backend/migrations/sql/0001_init.sql`
inputs:
  - ../src/backend/migrations/sql/0001_init.sql (schema chuẩn, thay cho `init_tables_recipe.sql` đã xoá)
  - ./01-spec.md, ./04-mock-ui.md (chỉ tham khảo — phạm vi đã thu hẹp, xem mục 1)
---

# Recipe & Meal Planning App — Danh sách task

> **Cách đọc.** Mỗi task có **Input** (cần gì để bắt đầu), **Output** (bàn giao gì), **File**, và **Xong khi**
> (cách kiểm tra). Đánh `[x]` vào ô ở đầu task khi xong. Làm theo thứ tự lát cắt: trong mỗi lát, làm
> **BE → Web → App**. Xong một lát là demo được trọn vẹn tính năng đó trên cả ba.
>
> Bản này thay cho plan Dart Frog cũ (revision 1, vẫn còn trong git history).

## 1. Phạm vi

Phạm vi bám theo các bảng trong `src/backend/migrations/sql/0001_init.sql` (viết lại từ `init_tables_recipe.sql` cũ):

| Có làm | Nguồn dữ liệu |
|--------|---------------|
| Đăng ký, đăng nhập, hồ sơ người dùng, mục tiêu calo | `auths`, `users` |
| Lịch sử cân nặng | `user_health_records` (bảng cũ `user_heath_records` đã đổi tên) |
| Danh mục nguyên liệu dùng chung, mỗi nguyên liệu có nhiều mức định lượng (calo, giá) | `products`, `product_nutritions` |
| Công thức riêng của từng user, gồm nhiều nguyên liệu | `recipes`, `recipe_items` |
| Nhật ký bữa ăn: bữa nào, lúc nào, ăn món gì | `meals`, `meal_items` |
| Tổng calo theo ngày so với mục tiêu | tính từ các bảng trên |

**Không làm ở bản này** (có trong spec cũ nhưng schema không có): macro đạm/tinh bột/béo, tag, tìm kiếm không dấu,
nháp công thức, ảnh, tủ đồ (pantry), sao chép tuần, quên mật khẩu, refresh token, idempotency key.

## 2. Stack và cấu trúc thư mục

| Phần | Công nghệ |
|------|-----------|
| Backend | Python 3.12, FastAPI, psycopg2 (SQL viết tay), argon2-cffi, PyJWT, pytest; quản lý bằng `uv` |
| Migration | Alembic; mỗi revision chạy một file SQL viết tay (SQLAlchemy chỉ dùng để kết nối, không có model) |
| Database | PostgreSQL 16 |
| Web | Vue 3 + Vite + TypeScript, Vue Router, Pinia, axios |
| App | Flutter 3.x (iOS + Android), Riverpod, go_router, dio, flutter_secure_storage |

```
src/
  backend/                  # FastAPI (đã có)
    app/
      core/                 # config, exception, security (get_current_user)
      db/                   # database.py
      routers/              # 1 file mỗi resource; request/ chứa request model
      schemas/              # response model
      services/             # nghiệp vụ + SQL
    migrations/             # Alembic: env.py, versions/ (revision), sql/ (SQL của từng revision)
    scripts/                # seed_dev.py (dữ liệu mẫu cho dev)
    tests/
  frontend/
    web/                    # Vue
    app/                    # Flutter
```

## 3. Quy ước chung (áp cho mọi task)

- **Một user chỉ thấy dữ liệu của mình.** Mọi truy vấn `recipes`, `meals`, `user_health_records` đều có
  `user_id = <user đang đăng nhập>`. Truy cập bản ghi của người khác trả **404** (không phải 403), để không lộ
  việc bản ghi đó tồn tại.
- **Mọi route trừ `/sign-up`, `/login`, `/health` đều cần header `Authorization: Bearer <token>`.** Thiếu hoặc
  sai token → 401.
- **Lỗi trả JSON** `{"detail": "<thông điệp>"}`. 400 sai dữ liệu nghiệp vụ, 401 chưa đăng nhập, 404 không thấy,
  409 trùng hoặc xung đột, 422 sai kiểu dữ liệu (FastAPI tự sinh).
- **Ghi nhiều bảng thì phải trong một transaction** (`with cursor.connection:`). Lỗi ở bước nào thì rollback
  toàn bộ.
- **Đơn vị:** API dùng gram cho cân nặng (`weight_g`), cm cho chiều cao, kcal cho calo, VND cho giá.
  Giao diện hiển thị cân nặng theo kg, làm tròn 1 chữ số thập phân.
- **Thời gian:** `eaten_at` là giờ địa phương của người dùng, không kèm múi giờ. "Ngày" của bữa ăn là
  `eaten_at::date`.
- **Danh sách có phân trang** `?page=1&size=20`, size tối đa 50. Response: `{"items": [...], "total": n}`.
- **Công thức tính** (dùng chung BE và FE, chỉ BE tính, FE hiển thị):
  - Một dòng nguyên liệu: `calo = quantity / measurement × calories`, `giá = quantity / measurement × price`.
    `quantity` tính theo cùng đơn vị `measure_unit` của định lượng.
  - Ví dụ: định lượng "Ức gà, gram, 100, 165 kcal, 12.000đ", `quantity = 250` → **412,5 kcal**, **30.000đ**.
  - Một công thức = tổng các dòng. Một món trong bữa = calo công thức × `portion` (ví dụ `0.5` = ăn nửa công thức).
  - Cộng trên số chưa làm tròn, chỉ làm tròn khi hiển thị (calo làm tròn đơn vị, giá làm tròn nghìn).
- Nhãn giao diện tiếng Việt. Tên biến, hàm, bảng, cột tiếng Anh.

## 4. Hợp đồng API

| Method | Path | Body / Query | Response | Task |
|--------|------|--------------|----------|------|
| GET | `/health` | — | `{"status":"ok"}` | BE-0.2 |
| POST | `/sign-up` | `{username, password, confirm_password}` | 201 `{id}` | BE-A1 |
| POST | `/login` | `{username, password}` | 200 `{access_token, token_type}` | BE-A1 |
| GET | `/me` | — | `User` | BE-A2 |
| PATCH | `/me` | các trường hồ sơ (gửi trường nào sửa trường đó) | `User` | BE-B1 |
| GET | `/me/health-records` | `?from&to` (ngày) | `[{id, weight_g, recorded_at}]` | BE-B2 |
| POST | `/me/health-records` | `{weight_g, recorded_at?}` | 201 `HealthRecord` | BE-B2 |
| DELETE | `/me/health-records/{id}` | — | 204 | BE-B2 |
| GET | `/products` | `?q&page&size` | `{items:[Product], total}` | BE-C1 |
| GET | `/products/{id}` | — | `Product` + `nutritions[]` | BE-C1 |
| GET | `/recipes` | `?q&page&size` | `{items:[RecipeSummary], total}` | BE-D1 |
| POST | `/recipes` | `RecipeInput` | 201 `RecipeDetail` | BE-D1 |
| GET | `/recipes/{id}` | — | `RecipeDetail` | BE-D1 |
| PUT | `/recipes/{id}` | `RecipeInput` | `RecipeDetail` | BE-D1 |
| DELETE | `/recipes/{id}` | — | 204, hoặc 409 nếu đang dùng trong bữa ăn | BE-D1 |
| GET | `/meals` | `?date=YYYY-MM-DD` | `[MealDetail]` | BE-E1 |
| POST | `/meals` | `MealInput` | 201 `MealDetail` | BE-E1 |
| PUT | `/meals/{id}` | `MealInput` | `MealDetail` | BE-E1 |
| DELETE | `/meals/{id}` | — | 204 | BE-E1 |
| GET | `/me/daily-summary` | `?date=YYYY-MM-DD` | `DailySummary` | BE-E2 |

Kiểu dữ liệu:

```text
User           {id, name, birth_date (YYYY-MM-DD), gender, height_cm, weight_g, daily_calorie_goals, created_at}
Product        {id, name}
Nutrition      {id, measure_unit, measurement, calories, price}
RecipeInput    {name, detail_recipe, items: [{product_nutrition_id, quantity}]}
RecipeSummary  {id, name, total_calories, total_price}
RecipeDetail   {id, name, detail_recipe, total_calories, total_price,
                items: [{id, product_id, product_name, product_nutrition_id,
                         measure_unit, measurement, quantity, calories, price}]}
MealInput      {meal_type, eaten_at, items: [{recipe_id, portion}]}
MealDetail     {id, meal_type, eaten_at, total_calories,
                items: [{id, recipe_id, recipe_name, portion, calories}]}
DailySummary   {date, goal_calories, total_calories, remaining_calories,
                by_meal_type: {breakfast, lunch, dinner, snack}}
```

---

# Phase 0 — Nền móng

## BE

### [x] BE-0.1 · Chuẩn hoá schema và migration

**Input:** `init_tables_recipe.sql` (schema gốc, có lỗi), DB local đang chạy.

**Việc cần làm:**
- Dựng Alembic trong `src/backend`: `migrations/env.py` lấy kết nối từ `.env` (`DB_HOST`, `DB_NAME`, `DB_USER`,
  `DB_PASSWORD`), bật `transaction_per_migration=True` để mỗi revision chạy trong một transaction riêng.
  Không dùng autogenerate (không có model SQLAlchemy); mỗi revision trong `migrations/versions/` chạy một file
  SQL viết tay trong `migrations/sql/` và có `downgrade()`.
- Đưa `init_tables_recipe.sql` thành `migrations/sql/0001_init.sql`, sửa luôn trong file đó:
  - Mọi `id` → `integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY`.
  - `auths.username` thêm `UNIQUE`.
  - Đổi tên `user_heath_records` → `user_health_records`, bỏ `UNIQUE` ở `user_id`, thêm
    `recorded_at timestamp NOT NULL DEFAULT now()`.
  - `users.birth_date` → `date`; `users.created_at` → `NOT NULL`.
  - `recipes` thêm `user_id integer NOT NULL REFERENCES users(id)` và `created_at`, `updated_at`; `name` → `NOT NULL`.
  - `meals.meal_type` → `NOT NULL`.
  - `meal_items` thêm `portion decimal NOT NULL DEFAULT 1 CHECK (portion > 0)`.
  - `recipe_items.quantity`, `product_nutritions.measurement` thêm `CHECK (> 0)`; `calories`, `price` thêm `CHECK (>= 0)`.
  - Khoá ngoại khai báo ngay tại cột, không `DEFERRABLE`. `recipe_items.recipe_id`, `meal_items.meal_id` →
    `ON DELETE CASCADE`; các khoá khác giữ mặc định (chặn xoá dòng cha đang được dùng, ví dụ công thức đã có
    trong bữa ăn).
  - Index thường (không `UNIQUE`): `recipes(user_id)`, `meals(user_id, eaten_at)`,
    `user_health_records(user_id, recorded_at)`, `recipe_items(product_nutrition_id)`, `meal_items(recipe_id)`.
  - Trigger `set_updated_at` tự gán `updated_at = now()` khi UPDATE `recipes`, `user_health_records`.
- `migrations/sql/0002_products.sql`: danh mục nguyên liệu dùng chung (29 nguyên liệu, 32 định lượng), chạy ở
  mọi môi trường.
- `scripts/seed_dev.py`: dữ liệu mẫu chỉ cho dev (tài khoản `hoa.ctp`, 15 công thức, lịch sử cân nặng, bữa ăn).
  Chạy lại khi tài khoản đã có thì bỏ qua.
- DB local cũ: drop rồi chạy lại từ đầu (toàn bộ dữ liệu cũ đã nằm trong `0002` và `seed_dev.py`).

**Output:** `alembic.ini`, `migrations/` (`env.py`, `versions/0001_init.py`, `versions/0002_seed_products.py`,
`sql/0001_init.sql`, `sql/0002_products.sql`), `scripts/seed_dev.py`, DB local đúng schema mới.

**Xong khi:**
- `uv run alembic upgrade head` trên DB trống chạy hết không lỗi. Chạy lần hai không có gì mới.
- `uv run alembic downgrade base` đưa DB về trống (không sót bảng, kiểu enum, function), rồi `upgrade head` lại được.
- Insert 2 dòng `auths` cùng username → lỗi unique; insert `meals` thiếu `meal_type` → lỗi not null.
- `init_tables_recipe.sql` ở gốc repo đã xoá, schema chỉ còn một nguồn là `migrations/sql/`.

### [ ] BE-0.2 · Dọn nền backend

**Input:** code backend hiện tại; review auth ngày 2026-10-08.

**Việc cần làm:**
- `app/core/config.py`: đọc env bằng `pydantic-settings`, **fail ngay khi khởi động** nếu thiếu biến. Biến DB đã
  đổi tên thành `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` ở BE-0.1; `app/db/database.py` và
  `migrations/env.py` chuyển sang đọc từ config này.
  Chỉ chấp nhận `JWT_ALGORITHM` ∈ {HS256, HS384, HS512}, `JWT_SECRET_KEY` dài ≥ 32 ký tự.
- Thêm `.env.example` liệt kê đủ biến, không có giá trị thật.
- `app/core/errors.py`: exception handler chung — `AppException(status_code, message)` → JSON `{"detail": ...}`.
  Lỗi không lường trước → `logger.exception(...)` + 500. Bỏ các `try/except` trả `Response` trong router.
- Thay `print` bằng `logging`. Bỏ log có chứa password hash.
- `main.py`: bỏ `connect_to_database()` lúc import; dùng `psycopg2.pool.SimpleConnectionPool` mở trong
  `lifespan`; thêm CORS cho origin web (`http://localhost:5173`); thêm `GET /health`.
- Route nào gọi DB thì dùng `def`, không dùng `async def`.
- Thiết lập test: `pytest`, `httpx`, DB test riêng (`DB_NAME=recipe_test`); fixture chạy `alembic upgrade head`
  (qua `alembic.command.upgrade`) lên DB test một lần mỗi phiên, mỗi test chạy trong transaction rồi rollback.
  Không chạy `seed_dev.py` cho test: test tự tạo dữ liệu mình cần.

**Output:** `app/core/config.py`, `app/core/errors.py`, `.env.example`, `tests/conftest.py`, `pyproject.toml` có
nhóm dev `pytest`.

**Xong khi:**
- Xoá `JWT_SECRET_KEY` khỏi `.env` → app không khởi động được, báo rõ thiếu biến nào.
- `uv run pytest` chạy được, có test `GET /health` → 200.

## Web

### [ ] WEB-0.1 · Khởi tạo dự án Vue

**Input:** BE-0.2 xong (có CORS và `/health`).

**Việc cần làm:**
- `npm create vue@latest src/frontend/web` (chọn TypeScript, Router, Pinia, Vitest, ESLint).
- `src/api/http.ts`: axios instance, `baseURL` lấy từ `VITE_API_URL`; interceptor gắn `Authorization` nếu có token;
  nhận 401 → xoá token, chuyển về `/login`.
- Layout chung: thanh điều hướng (Hôm nay, Bữa ăn, Công thức, Hồ sơ), vùng nội dung. Responsive ≥ 360px.
- Trang `/` tạm gọi `/health` và hiện kết quả.

**Output:** `src/frontend/web/` chạy được bằng `npm run dev`.

**Xong khi:** mở `http://localhost:5173` thấy "API: ok". `npm run build` và `npm run test:unit` pass.

## App

### [ ] APP-0.1 · Khởi tạo dự án Flutter

**Input:** BE-0.2 xong.

**Việc cần làm:**
- `flutter create --platforms=ios,android src/frontend/app`.
- Thêm `flutter_riverpod`, `go_router`, `dio`, `flutter_secure_storage`, `intl`.
- `lib/core/api_client.dart`: dio với `baseUrl` từ `--dart-define=API_URL=...`; interceptor gắn token, 401 → đăng xuất.
  Android emulator dùng `http://10.0.2.2:8000`.
- Bottom navigation 4 tab (Hôm nay, Bữa ăn, Công thức, Hồ sơ). Tab đầu tạm gọi `/health`.

**Output:** `src/frontend/app/` chạy được trên emulator.

**Xong khi:** app hiện "API: ok". `flutter analyze` và `flutter test` pass.

---

# Lát A — Tài khoản

## BE

### [ ] BE-A1 · Hoàn thiện đăng ký và đăng nhập

**Input:** BE-0.1, BE-0.2; code hiện có ở `app/services/auth_service.py`, `app/routers/auth.py`.

**Rule:**
- Username 3–30 ký tự, chỉ gồm `a-z 0-9 . _`, lưu dạng chữ thường. ✅ `Hoa.CTP` → lưu `hoa.ctp`. ❌ `ab`, `hoa ctp`.
- Password 8–128 ký tự. `confirm_password` phải khớp.
- Username đã tồn tại → 409. Hai lượt đăng ký cùng lúc cùng username: một lượt thành công, lượt kia 409 (bắt
  `UniqueViolation`, không chỉ dựa vào câu SELECT kiểm tra trước).
- Sai username hoặc password → cùng một thông điệp 401 "Sai tên đăng nhập hoặc mật khẩu".
- Tạo `users` + `auths` trong một transaction (đã làm).

**Output:** `POST /sign-up` → 201 `{id}`; `POST /login` → `{access_token, token_type: "bearer"}`, token hết hạn sau
`ACCESS_TOKEN_EXPIRE_MINUTES`. Validate bằng `Field(...)` trong `routers/request/*.py`.

**Xong khi:** test trong `tests/test_auth.py` pass cho các trường hợp: đăng ký ok, trùng username, password ngắn,
confirm sai, login ok, sai password, user không tồn tại, lỗi giữa chừng không để lại dòng `users` mồ côi.

### [ ] BE-A2 · Bảo vệ route bằng token

**Input:** BE-A1.

**Việc cần làm:**
- `app/core/security.py`: `get_current_user(token) -> CurrentUser(user_id)` dùng `HTTPBearer`, gọi
  `decode_access_token` (đã có ở `auth_service`, trả `TokenClaims`). Token hết hạn / sai chữ ký / thiếu → 401 kèm header `WWW-Authenticate: Bearer`.
- Token mang `sub = auth.id`; dependency tra ra `user_id` tương ứng.
- `GET /me` trả `User`.
- Gắn dependency vào router `products` và mọi router sau này.

**Output:** `app/core/security.py`, `app/routers/me.py`.

**Xong khi:** test: không token → 401; token hết hạn → 401; token hợp lệ → `/me` trả đúng user; `GET /products`
không token → 401.

## Web

### [ ] WEB-A1 · Màn đăng nhập và đăng ký

**Input:** BE-A1, BE-A2, WEB-0.1. Tham khảo wireframe S-01 trong [04-mock-ui.md](./04-mock-ui.md).

**Việc cần làm:**
- `views/LoginView.vue`, `views/RegisterView.vue`: validate giống rule BE-A1 ngay trên form; hiện lỗi từ `detail`.
- `stores/auth.ts` (Pinia): `login()`, `register()`, `logout()`, `me`. Token lưu `localStorage`.
- Router guard: chưa có token → chuyển `/login`; đã đăng nhập mà vào `/login` → chuyển `/`.
- Đăng ký xong tự đăng nhập luôn.

**Output:** đăng ký, đăng nhập, đăng xuất chạy được trên web.

**Xong khi:** đăng ký user mới → vào trang chủ thấy tên; reload vẫn đăng nhập; đăng xuất → về `/login`; token hết
hạn → tự về `/login`. Unit test cho validate form.

## App

### [ ] APP-A1 · Màn đăng nhập và đăng ký

**Input:** BE-A1, BE-A2, APP-0.1.

**Việc cần làm:** giống WEB-A1 — `features/auth/login_screen.dart`, `register_screen.dart`, `auth_controller.dart`
(Riverpod). Token lưu bằng `flutter_secure_storage`. `go_router` redirect theo trạng thái đăng nhập.

**Output:** đăng ký, đăng nhập, đăng xuất chạy được trên app.

**Xong khi:** các kịch bản như WEB-A1 chạy được trên emulator Android và iOS simulator; widget test cho form.

---

# Lát B — Hồ sơ và cân nặng

## BE

### [ ] BE-B1 · Sửa hồ sơ

**Input:** BE-A2.

**Rule:**
- Sửa được `name`, `birth_date`, `gender`, `height_cm`, `daily_calorie_goals`. Không sửa `weight_g` ở đây
  (cân nặng đi qua BE-B2).
- `name` 1–100 ký tự; `height_cm` 50–250; `daily_calorie_goals` 800–6000; `birth_date` kiểu ngày (`YYYY-MM-DD`, cột `date`), không ở tương lai.
- Chỉ trường có trong body mới được cập nhật (`model_dump(exclude_unset=True)`).

**Output:** `PATCH /me` → `User` sau khi sửa.

**Xong khi:** test: sửa 1 trường giữ nguyên trường khác; giá trị ngoài khoảng → 422; gửi `weight_g` bị bỏ qua.

### [ ] BE-B2 · Lịch sử cân nặng

**Input:** BE-0.1 (bảng `user_health_records`), BE-A2.

**Rule:**
- `weight_g` 20.000–400.000. `recorded_at` mặc định là hiện tại, không ở tương lai.
- Thêm bản ghi → cập nhật `users.weight_g` bằng bản ghi có `recorded_at` mới nhất (trùng giờ thì lấy `id` lớn
  hơn; DB cho phép hai lần cân cùng thời điểm), trong cùng transaction.
  Xoá bản ghi → tính lại `users.weight_g` theo bản ghi mới nhất còn lại (không còn bản ghi nào → `NULL`).
- Danh sách sắp `recorded_at` giảm dần; lọc `from`/`to` theo ngày.

**Output:** `GET/POST/DELETE /me/health-records`; `app/services/health_record_service.py`.

**Xong khi:** test: thêm 2 bản ghi khác ngày → `/me` trả cân nặng của bản mới nhất; xoá bản mới nhất →
`/me` quay về bản trước; xoá bản ghi của user khác → 404.

## Web

### [ ] WEB-B1 · Trang hồ sơ

**Input:** BE-B1, WEB-A1. Wireframe S-12.

**Việc cần làm:** `views/ProfileView.vue` — form sửa hồ sơ (cân nặng chỉ hiển thị, bấm sẽ sang trang cân nặng),
nút Đăng xuất. Hiện thông báo khi lưu thành công.

**Output:** sửa hồ sơ trên web.

**Xong khi:** sửa mục tiêu calo, reload vẫn thấy giá trị mới; nhập chiều cao 300 → báo lỗi trước khi gửi.

### [ ] WEB-B2 · Trang cân nặng

**Input:** BE-B2, WEB-B1.

**Việc cần làm:** `views/WeightView.vue` — form thêm cân nặng (nhập kg, gửi gram), danh sách các lần cân, nút xoá,
biểu đồ đường theo thời gian (`chart.js` + `vue-chartjs`).

**Output:** quản lý lịch sử cân nặng trên web.

**Xong khi:** nhập 65,5 kg → API nhận `65500`; biểu đồ cập nhật ngay; xoá một dòng → biểu đồ và hồ sơ cập nhật.

## App

### [ ] APP-B1 · Màn hồ sơ

**Input:** BE-B1, APP-A1.

**Việc cần làm / Output / Xong khi:** giống WEB-B1, ở `features/profile/profile_screen.dart`.

### [ ] APP-B2 · Màn cân nặng

**Input:** BE-B2, APP-B1.

**Việc cần làm / Output / Xong khi:** giống WEB-B2, ở `features/profile/weight_screen.dart`; biểu đồ dùng `fl_chart`.

---

# Lát C — Nguyên liệu

## BE

### [ ] BE-C1 · Danh mục nguyên liệu dùng chung

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

## Web

### [ ] WEB-C1 · Ô chọn nguyên liệu

**Input:** BE-C1, WEB-A1. Wireframe S-08.

**Việc cần làm:** `components/ProductPicker.vue` — ô tìm kiếm (debounce 300 ms), chọn nguyên liệu, rồi chọn một
định lượng (ví dụ "100 gram – 165 kcal – 12.000đ"). Emit `{product_nutrition_id, product_name, measure_unit, measurement}`.
Component này chỉ dùng trong màn soạn công thức (WEB-D2), chưa cần trang riêng.

**Output:** component dùng lại được.

**Xong khi:** gõ "ga" → hiện danh sách sau 300 ms; chọn xong emit đúng dữ liệu (unit test với API giả).

## App

### [ ] APP-C1 · Ô chọn nguyên liệu

**Input:** BE-C1, APP-A1.

**Việc cần làm / Output / Xong khi:** giống WEB-C1, dạng bottom sheet `features/recipes/product_picker_sheet.dart`.

---

# Lát D — Công thức

## BE

### [ ] BE-D1 · CRUD công thức

**Input:** BE-0.1 (cột `recipes.user_id`), BE-C1.

**Rule:**
- Công thức thuộc user tạo ra; user khác đọc/sửa/xoá → 404.
- `name` 1–200 ký tự, bắt buộc. `detail_recipe` tuỳ chọn, tối đa 10.000 ký tự.
- `items` có ít nhất 1 dòng. Mỗi `product_nutrition_id` chỉ xuất hiện 1 lần (trùng → 400). `quantity > 0`.
  `product_nutrition_id` không tồn tại → 400.
- Tạo / sửa = ghi `recipes` + thay toàn bộ `recipe_items` trong một transaction.
- Xoá công thức đang có trong `meal_items` → 409 "Công thức đang được dùng trong nhật ký bữa ăn".
- Danh sách tìm theo tên (`?q=`), sắp theo `updated_at` giảm dần. `updated_at` do trigger DB tự gán khi UPDATE
  `recipes`; code chỉ cần UPDATE dòng `recipes` (kể cả khi chỉ đổi nguyên liệu) để thời điểm sửa được ghi lại.

**Output:** `app/routers/recipes.py`, `app/services/recipe_service.py`, các endpoint `/recipes` theo mục 4.

**Xong khi:** test cho từng rule trên, trong đó có: sửa công thức có lỗi ở dòng nguyên liệu thứ 2 → công thức giữ
nguyên như trước khi sửa.

### [ ] BE-D2 · Tính calo và giá cho công thức

**Input:** BE-D1.

**Việc cần làm:** một hàm SQL hoặc Python duy nhất tính `calories`, `price` mỗi dòng và `total_calories`,
`total_price` theo công thức ở mục 3. Dùng cho cả `RecipeSummary` (danh sách) và `RecipeDetail`. Danh sách phải
tính bằng một câu SQL có `GROUP BY`, không gọi lặp từng công thức.

**Output:** các trường `total_calories`, `total_price`, `items[].calories`, `items[].price` có giá trị đúng.

**Xong khi:** test với ví dụ ở mục 3 (250 g ức gà → 412,5 kcal, 30.000đ); công thức 2 nguyên liệu cộng đúng;
nguyên liệu có `price` NULL → giá dòng đó là NULL, tổng giá chỉ cộng các dòng có giá.

## Web

### [ ] WEB-D1 · Danh sách và chi tiết công thức

**Input:** BE-D1, BE-D2, WEB-A1. Wireframe S-05, S-06.

**Việc cần làm:** `views/RecipeListView.vue` (ô tìm, thẻ công thức hiện tổng calo và giá, phân trang),
`views/RecipeDetailView.vue` (bảng nguyên liệu, cách làm, nút Sửa / Xoá; xoá gặp 409 thì hiện thông điệp).

**Output:** xem và xoá công thức trên web.

**Xong khi:** tìm "gà" lọc đúng; xoá công thức chưa dùng → biến mất khỏi danh sách; xoá công thức đã dùng → báo lỗi,
không mất.

### [ ] WEB-D2 · Soạn và sửa công thức

**Input:** WEB-C1, WEB-D1. Wireframe S-07.

**Việc cần làm:** `views/RecipeEditorView.vue` dùng cho cả tạo và sửa — tên, cách làm, danh sách nguyên liệu (thêm
bằng `ProductPicker`, nhập số lượng, xoá dòng). Tổng calo và giá **ước tính** ngay trên form; sau khi lưu hiện số
từ BE. Rời trang khi chưa lưu → hỏi xác nhận (dùng modal của trang, không dùng `window.confirm`).

**Output:** tạo và sửa công thức trên web.

**Xong khi:** tạo công thức 3 nguyên liệu → trang chi tiết hiện đúng tổng; sửa bớt 1 nguyên liệu → tổng giảm đúng;
chọn trùng nguyên liệu → form chặn trước khi gửi.

## App

### [ ] APP-D1 · Danh sách và chi tiết công thức

**Input:** BE-D1, BE-D2, APP-A1.

**Việc cần làm / Output / Xong khi:** giống WEB-D1, ở `features/recipes/recipe_list_screen.dart`,
`recipe_detail_screen.dart`; danh sách cuộn vô hạn thay cho phân trang.

### [ ] APP-D2 · Soạn và sửa công thức

**Input:** APP-C1, APP-D1.

**Việc cần làm / Output / Xong khi:** giống WEB-D2, ở `features/recipes/recipe_editor_screen.dart`; rời màn khi chưa
lưu → `PopScope` hỏi xác nhận.

---

# Lát E — Bữa ăn và tổng calo

## BE

### [ ] BE-E1 · Nhật ký bữa ăn

**Input:** BE-0.1 (cột `meal_items.portion`), BE-D2.

**Rule:**
- `meal_type` ∈ breakfast / lunch / dinner / snack, bắt buộc. `eaten_at` bắt buộc, không quá hiện tại + 7 ngày.
- `items` ít nhất 1 dòng; `recipe_id` phải là công thức của chính user (không phải → 400); `portion` 0,1–10.
- Tạo / sửa ghi `meals` + thay toàn bộ `meal_items` trong một transaction.
- `GET /meals?date=` trả các bữa của ngày đó, sắp theo `eaten_at`, mỗi món có `calories = calo công thức × portion`.
- Calo luôn tính theo công thức **hiện tại**: sửa công thức thì nhật ký các ngày cũ cũng đổi theo. Đây là giới hạn có
  chủ ý của bản này, ghi lại để không ai coi là bug.

**Output:** `app/routers/meals.py`, `app/services/meal_service.py`.

**Xong khi:** test: tạo bữa trưa 2 món, 1 món ăn nửa phần → tổng đúng; dùng công thức của user khác → 400; xoá bữa →
các `meal_items` cũng mất; lấy theo ngày không lẫn bữa của ngày bên cạnh (23:59 và 00:00).

### [ ] BE-E2 · Tổng calo theo ngày

**Input:** BE-E1, BE-B1.

**Rule:** `total_calories` = tổng calo các món trong ngày; `remaining_calories = goal - total` (có thể âm);
chưa đặt mục tiêu → `goal_calories` và `remaining_calories` là `null`. `by_meal_type` luôn đủ 4 khoá, bữa không ăn = 0.

**Output:** `GET /me/daily-summary?date=`.

**Xong khi:** test: ngày không có bữa nào → tổng 0, đủ 4 khoá; ăn quá mục tiêu → `remaining_calories` âm.

## Web

### [ ] WEB-E1 · Nhật ký bữa ăn theo ngày

**Input:** BE-E1, WEB-D1. Wireframe S-04, S-10.

**Việc cần làm:** `views/MealDiaryView.vue` — chọn ngày (nút ngày trước / sau / hôm nay), 4 nhóm bữa, mỗi bữa liệt kê
món và calo. Nút "Thêm món" mở dialog chọn công thức + phần ăn + giờ ăn. Sửa / xoá bữa.

**Output:** ghi nhật ký bữa ăn trên web.

**Xong khi:** thêm bữa sáng 1 món → hiện đúng nhóm, đúng calo; chuyển sang ngày hôm sau không thấy bữa đó.

### [ ] WEB-E2 · Trang "Hôm nay"

**Input:** BE-E2, WEB-E1. Wireframe S-03 (rút gọn).

**Việc cần làm:** `views/TodayView.vue` là trang chủ — vòng tiến độ calo đã ăn / mục tiêu, số còn lại, calo theo
từng bữa, lối tắt "Thêm bữa ăn". Chưa đặt mục tiêu → hiện lời nhắc sang trang Hồ sơ.

**Output:** trang chủ web.

**Xong khi:** thêm một bữa ở WEB-E1 rồi quay lại trang chủ → số liệu cập nhật; ăn quá mục tiêu → hiện "Vượt X kcal".

## App

### [ ] APP-E1 · Nhật ký bữa ăn theo ngày

**Input:** BE-E1, APP-D1.

**Việc cần làm / Output / Xong khi:** giống WEB-E1, ở `features/meals/meal_diary_screen.dart`; vuốt ngang để đổi ngày.

### [ ] APP-E2 · Màn "Hôm nay"

**Input:** BE-E2, APP-E1.

**Việc cần làm / Output / Xong khi:** giống WEB-E2, ở `features/today/today_screen.dart`, là tab đầu tiên.

---

# Phase cuối — Đóng gói

### [ ] OPS-1 · Chạy toàn bộ bằng Docker Compose

**Input:** tất cả task BE và WEB.

**Việc cần làm:** `docker-compose.yml` ở gốc gồm `db` (postgres:16), `api` (chạy `alembic upgrade head` rồi
`fastapi run`; không chạy `seed_dev.py`), `web` (build Vite, phục vụ bằng nginx). README gốc hướng dẫn chạy và trỏ
app Flutter tới API.

**Output:** `docker compose up` dựng được cả hệ thống từ máy sạch.

**Xong khi:** trên máy chưa cài gì ngoài Docker: `docker compose up` → mở web, đăng ký, tạo công thức, ghi bữa ăn,
thấy tổng calo.

---

## Bảng theo dõi nhanh

| Lát | BE | Web | App |
|-----|----|-----|-----|
| 0 Nền móng | BE-0.1, BE-0.2 | WEB-0.1 | APP-0.1 |
| A Tài khoản | BE-A1, BE-A2 | WEB-A1 | APP-A1 |
| B Hồ sơ, cân nặng | BE-B1, BE-B2 | WEB-B1, WEB-B2 | APP-B1, APP-B2 |
| C Nguyên liệu | BE-C1 | WEB-C1 | APP-C1 |
| D Công thức | BE-D1, BE-D2 | WEB-D1, WEB-D2 | APP-D1, APP-D2 |
| E Bữa ăn, tổng calo | BE-E1, BE-E2 | WEB-E1, WEB-E2 | APP-E1, APP-E2 |
| Đóng gói | OPS-1 | | |

Tổng: 11 task BE, 9 task Web, 9 task App, 1 task đóng gói.
