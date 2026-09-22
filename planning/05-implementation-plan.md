---
doc-id: 2026-09-22-recipe-meal-planning-mvp
status: draft
inputs:
  - ./01-spec.md (draft)
  - ./02-tech-design.md (draft)
  - ./03-database.md (draft)
  - ./04-mock-ui.md (draft)
---

# Recipe & Meal Planning App — Implementation Plan

> **Mức chi tiết.** Task 1–6 viết đầy đủ step 2–5 phút kèm code, làm khuôn mẫu cho cả dự án.
> Task 7–65 là **task card**: tệp phải chạm, interface, BR sở hữu, trọng tâm test, tiêu chí xong.
> Khi bắt đầu một lát cắt, chạy `/to-plan` cho riêng lát đó để bung task card thành step có code.
> Lý do chia hai mức: viết sẵn code cho 65 task là đoán trước quyết định sẽ lỗi thời ngay sau lát cắt đầu.

**Goal:** Dựng MVP quản lý công thức, lập kế hoạch bữa ăn, dinh dưỡng và tủ đồ, chạy trên iOS, Android và Web
từ một codebase Flutter, với backend Dart Frog và PostgreSQL.

**Architecture:** Monorepo Dart bốn package (`shared`, `api_client`, `apps/api`, `apps/app`). API ba lớp
route → service → repository, SQL viết tay. Dinh dưỡng denormalized vào mục lịch nên mục quá khứ tự đóng băng.
Chi tiết: [02-tech-design.md](./02-tech-design.md).

**Tech Stack:** Dart 3.x · Flutter 3.x (iOS/Android/Web CanvasKit) · Dart Frog · PostgreSQL 16 (unaccent,
pg_trgm, citext) · Riverpod · go_router · melos · Docker.

## Global Constraints

Mọi task đều chịu các ràng buộc sau; reviewer đọc chúng như thấu kính cho từng task.

- Một codebase Flutter duy nhất cho iOS, Android và Web — không có codebase riêng cho web (`NFR-platform-001`).
- Ba dải bề rộng: `< 600` / `600–1024` / `> 1024` dp; không chức năng nào chỉ dùng được ở một dải (`NFR-platform-002`).
- Online-only: client không cache đọc, không ghi offline. Ngoại lệ duy nhất có chủ ý là **trạng thái nháp lưu trên máy chủ** (`BR-recipe-005`).
- Mọi danh sách trả về từ máy chủ phân trang, trần 50 bản ghi mỗi trang (`NFR-perf-002`).
- Mọi thao tác tạo nhận `Idempotency-Key` và phát lại response khi khoá lặp (`NFR-sec-003`).
- Mọi truy vấn dữ liệu người dùng mang điều kiện `user_id = :me`; không endpoint nào tiết lộ sự tồn tại của dữ liệu thuộc tài khoản khác (`BR-auth-001`).
- Mọi truy vấn công thức mang `deleted_at IS NULL` (ADR-007).
- Chỉ số dinh dưỡng đúng bốn loại: calo, đạm, tinh bột, chất béo (`BR-nutrition-001`).
- Cộng dồn dinh dưỡng trên giá trị chưa làm tròn; chỉ làm tròn ở con số cuối trình bày (`BR-nutrition-009`).
- Ngày trong kế hoạch bữa ăn là ngày lịch thuần, không giờ, không múi giờ (`BR-mealplan-001`).
- Nội dung tài liệu và nhãn giao diện bằng tiếng Việt; tên biến, hàm, bảng, cột bằng tiếng Anh.

## Thứ tự lát cắt

```
Phase 0 Nền móng  →  A Auth  →  B Nguyên liệu  →  C Công thức  →  D Tìm kiếm
                                                       ↓
                        H Cold start  ←  G Pantry  ←  F Kế hoạch  ←  E Dinh dưỡng
```

Mỗi lát cắt chạy hết từ schema tới màn hình và demo được độc lập. Lát B phải xong trước C vì công thức
buộc trỏ vào danh mục nguyên liệu (`BR-recipe-006`). Lát E xong trước F vì mục lịch cần dinh dưỡng mỗi khẩu
phần để denormalize (ADR-004). Lát H nằm cuối vì nó phụ thuộc **TQ-02** (nguồn dữ liệu dinh dưỡng).

---

# Phase 0 — Nền móng

## Task 1: Dựng monorepo bốn package

**Files:**
- Create: `melos.yaml`, `pubspec.yaml`, `analysis_options.yaml`, `.gitignore`
- Create: `packages/shared/pubspec.yaml`, `packages/shared/lib/shared.dart`
- Create: `packages/api_client/pubspec.yaml`, `apps/api/pubspec.yaml`, `apps/app/pubspec.yaml`
- Create: `docker-compose.yml` (PostgreSQL 16 cho test)

**Interfaces:**
- Produces: các lệnh `melos run analyze`, `melos run test`, `melos run test:integration` mà mọi task sau đều dùng.

**Owns:** `@ADR-001`

- [ ] **Step 1: Khởi tạo git và bộ khung thư mục**

```bash
cd /Users/hoa.ctp/Project/my_project/recipe_and_meal_planning_app
git init
mkdir -p packages/shared/lib packages/api_client/lib apps/api apps/app db/migrations
```

- [ ] **Step 2: Viết `melos.yaml`**

```yaml
name: recipe_meal_planner
packages:
  - packages/**
  - apps/**

command:
  bootstrap:
    runPubGetInParallel: true

scripts:
  analyze:
    run: melos exec -- dart analyze --fatal-infos
  test:
    run: melos exec --dir-exists=test -- dart test
  test:integration:
    run: melos exec --scope=api -- dart test --tags=integration
```

- [ ] **Step 3: Viết `packages/shared/pubspec.yaml`**

```yaml
name: shared
description: Model và luật validate dùng chung cho api và app.
publish_to: none
environment:
  sdk: ^3.5.0
dev_dependencies:
  test: ^1.25.0
  lints: ^4.0.0
```

- [ ] **Step 4: Viết `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: recipe
    ports: ["5432:5432"]
```

- [ ] **Step 5: Bootstrap và xác nhận toolchain chạy**

Run: `dart pub global activate melos && melos bootstrap && melos run analyze`
Expected: `analyze` chạy qua cả bốn package, 0 issue.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold melos monorepo with four packages"
```

---

## Task 2: Migration runner và migration 0001

**Files:**
- Create: `apps/api/tool/migrate.dart`
- Create: `db/migrations/0001_extensions_and_enums.sql`
- Test: `apps/api/test/tool/migrate_test.dart`

**Interfaces:**
- Produces: `dart run tool/migrate.dart up` — mọi task có migration đều dùng; bảng `schema_migrations` theo dõi version đã chạy.

**Owns:** `@ADR-010`

- [ ] **Step 1: Viết test thất bại — chạy migration hai lần là idempotent**

```dart
// apps/api/test/tool/migrate_test.dart
@Tags(['integration'])
library;

import 'package:test/test.dart';
import 'package:postgres/postgres.dart';
import '../../tool/migrate.dart';

void main() {
  test('chạy migration hai lần chỉ áp dụng một lần', () async {
    final conn = await openTestConnection();
    await runMigrations(conn, 'db/migrations');
    final first = await conn.execute('SELECT count(*) FROM schema_migrations');

    await runMigrations(conn, 'db/migrations');
    final second = await conn.execute('SELECT count(*) FROM schema_migrations');

    expect(second.first.first, equals(first.first.first));
  });
}
```

- [ ] **Step 2: Chạy để xác nhận nó fail**

Run: `docker compose up -d db && melos run test:integration`
Expected: FAIL — `runMigrations` chưa tồn tại.

- [ ] **Step 3: Viết `0001_extensions_and_enums.sql`**

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT lower(public.unaccent('public.unaccent', $1)) $$;

DO $$ BEGIN
  CREATE TYPE recipe_status AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE meal_slot AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE unit_dimension AS ENUM ('mass', 'volume', 'count');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
```

- [ ] **Step 4: Viết `migrate.dart`**

```dart
Future<void> runMigrations(Connection conn, String dir) async {
  await conn.execute('''
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version integer PRIMARY KEY,
      name text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )''');

  final applied = (await conn.execute('SELECT version FROM schema_migrations'))
      .map((r) => r[0] as int).toSet();

  final files = Directory(dir).listSync()
      .whereType<File>()
      .where((f) => f.path.endsWith('.sql'))
      .toList()..sort((a, b) => a.path.compareTo(b.path));

  for (final f in files) {
    final name = f.uri.pathSegments.last;
    final version = int.parse(name.split('_').first);
    if (applied.contains(version)) continue;

    await conn.runTx((tx) async {
      await tx.execute(f.readAsStringSync());
      await tx.execute(
        r'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
        parameters: [version, name],
      );
    });
    stdout.writeln('applied $name');
  }
}
```

- [ ] **Step 5: Chạy test để xác nhận pass**

Run: `melos run test:integration`
Expected: PASS.

- [ ] **Step 6: Kiểm tra `immutable_unaccent` hoạt động với tiếng Việt**

Run: `docker compose exec db psql -U app -d recipe -c "SELECT immutable_unaccent('Phở Bò');"`
Expected: `pho bo`

- [ ] **Step 7: Commit**

```bash
git add apps/api/tool/migrate.dart db/migrations/0001_extensions_and_enums.sql apps/api/test/
git commit -m "feat(db): migration runner and initial extensions"
```

---

## Task 3: Khung Dart Frog với error mapper

**Files:**
- Create: `apps/api/routes/_middleware.dart`, `apps/api/routes/health.dart`
- Create: `apps/api/lib/src/middleware/error_mapper.dart`
- Create: `apps/api/lib/src/error/app_exception.dart`
- Test: `apps/api/test/middleware/error_mapper_test.dart`

**Interfaces:**
- Produces: `AppException(code, httpStatus, message, details)` — mọi service ném exception này; `errorMapper()` middleware.

**Owns:** `@ADR-002`

- [ ] **Step 1: Viết test thất bại — exception nghiệp vụ thành JSON lỗi ổn định**

```dart
test('AppException được map thành khuôn lỗi chung', () async {
  final handler = errorMapper().call((_) => throw AppException(
        code: 'VALIDATION_FAILED', httpStatus: 422, message: 'Thiếu bước nấu'));

  final res = await handler(_request());

  expect(res.statusCode, 422);
  expect(jsonDecode(await res.body())['error']['code'], 'VALIDATION_FAILED');
});
```

- [ ] **Step 2: Chạy để xác nhận fail**

Run: `melos run test`
Expected: FAIL — `errorMapper` chưa tồn tại.

- [ ] **Step 3: Viết `app_exception.dart` và `error_mapper.dart`**

```dart
class AppException implements Exception {
  AppException({
    required this.code,
    required this.httpStatus,
    required this.message,
    this.details = const {},
  });
  final String code;
  final int httpStatus;
  final String message;
  final Map<String, dynamic> details;
}

Middleware errorMapper() => (handler) => (context) async {
      try {
        return await handler(context);
      } on AppException catch (e) {
        return Response.json(statusCode: e.httpStatus, body: {
          'error': {'code': e.code, 'message': e.message, 'details': e.details},
        });
      } catch (e, st) {
        log('unhandled', error: e, stackTrace: st);
        return Response.json(statusCode: 500, body: {
          'error': {'code': 'INTERNAL', 'message': 'Lỗi hệ thống', 'details': {}},
        });
      }
    };
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `melos run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/
git commit -m "feat(api): dart frog skeleton with stable error envelope"
```

---

# Lát cắt A — Auth

## Task 4: Bảng `users` và đăng ký

**Files:**
- Create: `db/migrations/0002_users_and_auth.sql`
- Create: `apps/api/lib/src/service/auth_service.dart`, `apps/api/lib/src/repository/user_repository.dart`
- Create: `apps/api/routes/v1/auth/register.dart`
- Test: `apps/api/test/service/auth_service_test.dart`, `apps/api/test/repository/user_repository_test.dart`

**Interfaces:**
- Produces: `AuthService.register({required String email, required String password}) → Future<AuthTokens>`; `AuthTokens(accessToken, refreshToken, expiresIn)`.

**Owns:** `@BR-auth-002` | `@NFR-sec-001`

- [ ] **Step 1: Viết test thất bại — email trùng bị từ chối, không phân biệt hoa thường**

```dart
test('email đã có tài khoản đang tồn tại thì không tạo tài khoản thứ hai', () async {
  await service.register(email: 'an@example.com', password: 'Str0ng!pass');

  expect(
    () => service.register(email: 'AN@Example.com', password: 'Other!pass1'),
    throwsA(isA<AppException>().having((e) => e.code, 'code', 'EMAIL_TAKEN')),
  );
  expect(await repo.countByEmail('an@example.com'), 1);
});
```

- [ ] **Step 2: Chạy để xác nhận fail**

Run: `melos run test:integration`
Expected: FAIL — `AuthService` chưa tồn tại.

- [ ] **Step 3: Viết migration `0002_users_and_auth.sql`**

Dùng nguyên DDL ở [03-database.md](./03-database.md) mục 4.1 và 4.2 (`users`, `refresh_tokens`,
`password_reset_tokens`, `login_attempts`). Điểm mấu chốt cho task này:

```sql
CREATE UNIQUE INDEX users_email_active_uq ON users (email) WHERE deleted_at IS NULL;
```

Index **có mệnh đề `WHERE`** chứ không phải `UNIQUE` thẳng — nếu thiếu, email của tài khoản đã xoá hẳn
không dùng lại được, trái ví dụ ✅ của `BR-auth-008`.

- [ ] **Step 4: Viết `AuthService.register` với băm mật khẩu**

```dart
Future<AuthTokens> register({required String email, required String password}) async {
  final hash = await _hasher.hash(password);          // argon2id, NFR-sec-001
  try {
    final user = await _users.insert(email: email, passwordHash: hash);
    return _issueTokens(user.id);
  } on PgException catch (e) {
    if (e.code == '23505') {                          // unique_violation
      throw AppException(code: 'EMAIL_TAKEN', httpStatus: 409, message: 'Email đã có tài khoản');
    }
    rethrow;
  }
}
```

*Lý do bắt lỗi khoá duy nhất thay vì `SELECT` trước rồi `INSERT`:* kiểm tra trước rồi chèn có khoảng trống
tranh chấp giữa hai request đồng thời; để database phán quyết là cách duy nhất không có khoảng trống đó.

- [ ] **Step 5: Chạy test để xác nhận pass**

Run: `melos run test:integration`
Expected: PASS.

- [ ] **Step 6: Thêm test băm mật khẩu**

```dart
test('mật khẩu không được lưu dưới dạng khôi phục được', () async {
  await service.register(email: 'b@example.com', password: 'Str0ng!pass');
  final row = await repo.rawByEmail('b@example.com');
  expect(row['password_hash'], isNot(contains('Str0ng!pass')));
  expect(row['password_hash'], startsWith(r'$argon2id$'));
});
```

- [ ] **Step 7: Commit**

```bash
git add db/migrations/0002_users_and_auth.sql apps/api/
git commit -m "feat(auth): register with unique active email and argon2id hashing"
```

---

## Task 5: Đăng nhập, JWT và xoay vòng refresh token

**Files:**
- Create: `apps/api/lib/src/security/jwt.dart`, `apps/api/lib/src/repository/refresh_token_repository.dart`
- Create: `apps/api/routes/v1/auth/login.dart`, `apps/api/routes/v1/auth/refresh.dart`
- Modify: `apps/api/lib/src/service/auth_service.dart`
- Test: `apps/api/test/service/auth_refresh_test.dart`

**Interfaces:**
- Consumes: `AuthTokens` (Task 4).
- Produces: `AuthService.login(...)`, `AuthService.refresh(String refreshToken)`, `JwtVerifier.verify(String) → String userId`.

**Owns:** `@BR-auth-006`

- [ ] **Step 1: Viết test thất bại — access token hết hạn nhưng refresh còn hạn thì thao tác vẫn thành công**

```dart
test('access token hết hạn, refresh còn hạn thì gia hạn được và không mất nội dung', () async {
  final tokens = await service.register(email: 'c@example.com', password: 'Str0ng!pass');
  clock.advance(const Duration(minutes: 16));           // access sống 15 phút

  expect(() => verifier.verify(tokens.accessToken), throwsA(isA<TokenExpired>()));

  final renewed = await service.refresh(tokens.refreshToken);
  expect(verifier.verify(renewed.accessToken), isNotEmpty);
  expect(renewed.refreshToken, isNot(tokens.refreshToken));   // xoay vòng
});
```

- [ ] **Step 2: Chạy để xác nhận fail** — Run `melos run test:integration`, expected FAIL.
- [ ] **Step 3: Viết `JwtVerifier` và `AuthService.login`/`refresh`** — refresh token lưu **băm**, mỗi lần dùng thì thu hồi bản cũ và phát bản mới trong cùng transaction.
- [ ] **Step 4: Chạy test để xác nhận pass.**
- [ ] **Step 5: Thêm test dùng lại refresh token đã xoay vòng bị từ chối** (phát hiện token bị đánh cắp).
- [ ] **Step 6: Commit** — `git commit -m "feat(auth): jwt login with rotating refresh tokens"`

---

## Task 6: Giới hạn tần suất đăng nhập

**Files:**
- Create: `apps/api/lib/src/middleware/rate_limit.dart`
- Modify: `apps/api/routes/v1/auth/_middleware.dart`
- Test: `apps/api/test/middleware/rate_limit_test.dart`

**Interfaces:**
- Consumes: bảng `login_attempts` (Task 4).
- Produces: `rateLimitLogin()` middleware.

**Owns:** `@BR-auth-005` | `@NFR-sec-002`

- [ ] **Step 1: Viết test thất bại — lần thứ 6 bị từ chối dù mật khẩu đúng**

```dart
test('5 lần sai trong 15 phút thì lần thứ 6 bị từ chối kể cả khi mật khẩu đúng', () async {
  for (var i = 0; i < 5; i++) {
    await expectLater(service.login(email: 'd@example.com', password: 'sai'), throwsA(anything));
  }
  expect(
    () => service.login(email: 'd@example.com', password: 'Str0ng!pass'),   // đúng
    throwsA(isA<AppException>().having((e) => e.code, 'code', 'RATE_LIMITED')),
  );
});

test('sai 2 lần rồi đúng thì đăng nhập được bình thường', () async {
  for (var i = 0; i < 2; i++) {
    await expectLater(service.login(email: 'e@example.com', password: 'sai'), throwsA(anything));
  }
  expect((await service.login(email: 'e@example.com', password: 'Str0ng!pass')).accessToken, isNotEmpty);
});
```

Test thứ hai không thừa: nó chốt rằng bộ đếm tính **liên tiếp trong cửa sổ**, không phải cộng dồn vĩnh viễn.

- [ ] **Step 2: Chạy để xác nhận fail** — expected FAIL.
- [ ] **Step 3: Viết `rateLimitLogin()`** đếm `login_attempts` 15 phút gần nhất theo email, và song song theo IP.
- [ ] **Step 4: Chạy test để xác nhận pass.**
- [ ] **Step 5: Commit** — `git commit -m "feat(auth): rate limit login attempts per email and ip"`

---

> **Hết phần khuôn mẫu.** Từ Task 7 trở đi là task card. Mỗi card đủ để chạy `/to-plan` bung ra step có code.

---

## Task 7: Quên và đặt lại mật khẩu
**Files:** `apps/api/lib/src/service/auth_service.dart`, `apps/api/lib/src/mail/`, `routes/v1/auth/forgot-password.dart`, `reset-password.dart`
**Owns:** `@BR-auth-003`
**Trọng tâm test:** token dùng một lần (lần hai bị từ chối); hết hạn sau 60 phút; `forgot-password` luôn trả 204 dù email có hay không.
**Xong khi:** đặt lại được mật khẩu và truy cập lại toàn bộ dữ liệu cũ; hai ví dụ ❌ của `BR-auth-003` đều có test.

## Task 8: Đổi mật khẩu và thu hồi phiên khác
**Files:** `auth_service.dart`, `refresh_token_repository.dart`, `routes/v1/auth/change-password.dart`
**Owns:** `@BR-auth-004`
**Trọng tâm test:** phiên hiện tại còn sống, mọi phiên khác chết ngay.

## Task 9: Từ chối khi cả hai token hết hạn
**Files:** `apps/api/lib/src/middleware/auth.dart`
**Owns:** `@BR-auth-007`
**Trọng tâm test:** không bản ghi nào được ghi khi thao tác bị từ chối (kiểm tra bằng đếm dòng trước/sau).

## Task 10: Xoá tài khoản và dọn sau 30 ngày
**Files:** `auth_service.dart`, `apps/api/tool/purge_accounts.dart`, `routes/v1/auth/account.dart`
**Owns:** `@BR-auth-008`
**Trọng tâm test:** đăng nhập lại sau 10 ngày khôi phục được; sau 40 ngày thì không, và email dùng đăng ký lại được.

## Task 11: Phạm vi sở hữu dữ liệu
**Files:** `apps/api/lib/src/middleware/auth.dart`, mọi repository
**Owns:** `@BR-auth-001` | `@NFR-compliance-001`
**Trọng tâm test:** tài khoản B yêu cầu tài nguyên của A nhận `404`, **không phải** `403` — `403` là tiết lộ sự tồn tại.
**Xong khi:** có một test dùng chung quét mọi route `/v1/**` cần xác thực, không phải test rời từng route.

## Task 12: Middleware idempotency
**Files:** `db/migrations/0006_idempotency.sql`, `apps/api/lib/src/middleware/idempotency.dart`
**Owns:** `@ADR-009` | `@NFR-sec-003`
**Trọng tâm test:** cùng khoá cùng nội dung phát lại response cũ; cùng khoá khác nội dung trả `422`.

## Task 13: [UI] Khung ứng dụng responsive và điều hướng
**Screen:** khung chung cho S-01…S-12
**Files:** `apps/app/lib/src/core/layout/breakpoints.dart`, `core/theme/`, `routing/app_router.dart`, `core/shell/adaptive_scaffold.dart`
**Owns:** `@NFR-platform-001`, `@NFR-platform-002`
**Trọng tâm test:** widget test render khung ở cả ba dải và khẳng định đúng kiểu điều hướng (thanh dưới / rail / sidebar).
**Xong khi:** `flutter build web`, `flutter build apk --debug` và `flutter build ios --simulator` đều chạy được.

## Task 14: [UI] S-01 Đăng nhập và đăng ký
**Screen:** S-01 ([04-mock-ui.md](./04-mock-ui.md))
**Files:** `apps/app/lib/src/features/auth/`
**Owns:** — (không sở hữu BR; hành vi thuộc Task 4–6)
**Trọng tâm test:** email trùng báo ngay dưới ô và **không** xoá nội dung đã nhập; trạng thái bị tạm khoá hiện thời gian còn lại.

## Task 15: [UI] S-02 Quên và đặt lại mật khẩu
**Screen:** S-02
**Files:** `apps/app/lib/src/features/auth/`
**Owns:** —
**Trọng tâm test:** câu xác nhận không tiết lộ email có tồn tại hay không.

---

# Lát cắt B — Danh mục nguyên liệu

## Task 16: Bảng `units` và dữ liệu đơn vị
**Files:** `db/migrations/0003_units_and_ingredients.sql`, `packages/shared/lib/src/unit/unit.dart`
**Owns:** `@BR-ingredient-005`
**Trọng tâm test:** 0,5 kg thành 500 g, 1 l thành 1.000 ml; ràng buộc `units_factor_rule` từ chối đơn vị đếm mang hệ số toàn hệ thống.

## Task 17: Danh mục nguyên liệu hai tầng
**Files:** `0003_units_and_ingredients.sql`, `apps/api/lib/src/repository/ingredient_repository.dart`, `service/ingredient_service.dart`
**Interfaces:** Produces `IngredientRepository.visibleTo(userId)` — mọi truy vấn nguyên liệu đi qua đây.
**Owns:** `@BR-ingredient-001`, `@BR-ingredient-002`, `@BR-ingredient-003` | `@ADR-003`
**Trọng tâm test:** tài khoản khác không dùng được nguyên liệu riêng; calo 5.000 và calo âm đều bị từ chối; ràng buộc `ing_nutrition_all_or_none` chặn trạng thái nửa vời.

## Task 18: Hệ số quy đổi riêng theo nguyên liệu
**Files:** `ingredient_unit_factors` trong `0003`, `packages/shared/lib/src/unit/conversion.dart`
**Interfaces:** Produces `Conversion.toBase({ingredient, quantity, unit}) → double?` — trả `null` nghĩa là không quy đổi được; đây là kiểu trả về mà cả dinh dưỡng lẫn pantry đều dựa vào.
**Owns:** `@BR-ingredient-004`
**Trọng tâm test:** 2 quả trứng thành 110 g khi có hệ số; 3 nhánh hành trả `null` khi chưa khai; hệ số của nguyên liệu này **không** áp dụng cho nguyên liệu kia.

## Task 19: Endpoint tìm nguyên liệu
**Files:** `routes/v1/ingredients/index.dart`
**Owns:** —
**Trọng tâm test:** tìm "thit bo" ra "Thịt bò nạc"; kết quả gồm nguyên liệu hệ thống và nguyên liệu riêng của chính người dùng, không của người khác.

## Task 20: [UI] S-08 Chọn nguyên liệu
**Screen:** S-08
**Files:** `apps/app/lib/src/features/ingredient/`
**Owns:** —
**Trọng tâm test:** ghi chú `ⓘ` về việc bỏ trống dữ liệu dinh dưỡng luôn hiển thị; calo > 900 báo lỗi ngay tại ô.

---

# Lát cắt C — Công thức

## Task 21: Bảng `recipes` và trạng thái nháp
**Files:** `db/migrations/0004_recipes.sql`, `apps/api/lib/src/service/recipe_service.dart`, `repository/recipe_repository.dart`
**Interfaces:** Produces `RecipeService.saveDraft(...)`, `Recipe` model trong `shared`.
**Owns:** `@BR-recipe-001`, `@BR-recipe-005`
**Trọng tâm test:** nháp chỉ có tên vẫn lưu được; nháp không ra ở tìm kiếm và không gắn được vào lịch; tên chỉ khoảng trắng và tên 121 ký tự đều bị từ chối.

## Task 22: Dòng nguyên liệu của công thức
**Files:** `0004_recipes.sql`, `recipe_service.dart`
**Owns:** `@BR-recipe-006`, `@BR-recipe-007`, `@BR-recipe-009`
**Trọng tâm test:** chuỗi tự do không khớp danh mục bị từ chối; dòng tuỳ khẩu vị kèm số lượng bị từ chối; trùng nguyên liệu **cùng** đơn vị bị chặn nhưng **khác** đơn vị thì hợp lệ.

## Task 23: Bước nấu
**Files:** `0004_recipes.sql`, `recipe_service.dart`
**Owns:** `@BR-recipe-010`
**Trọng tâm test:** xoá bước giữa thì các bước còn lại được đánh số lại liên tiếp từ 1.

## Task 24: Tag
**Files:** `0004_recipes.sql`, `packages/shared/lib/src/validation/tag.dart`
**Owns:** `@BR-recipe-013`, `@BR-recipe-014`
**Trọng tâm test:** "ăn chay", "Ăn Chay", " ăn  chay " gộp thành một; tag thứ 21 bị từ chối và 20 tag cũ giữ nguyên.

## Task 25: Validate khi công bố
**Files:** `recipe_service.dart`, `routes/v1/recipes/[id]/publish.dart`
**Owns:** `@BR-recipe-002`, `@BR-recipe-003`, `@BR-recipe-004`, `@BR-recipe-008`
**Trọng tâm test:** mỗi trường hợp thiếu nói rõ **thiếu cái gì**; công thức toàn dòng tuỳ khẩu vị bị từ chối.

## Task 26: Trùng tên hợp lệ và nhân bản
**Files:** `recipe_service.dart`, `routes/v1/recipes/[id]/duplicate.dart`
**Owns:** `@BR-recipe-015`, `@BR-recipe-016`
**Trọng tâm test:** sửa bản sao không đụng bản gốc.

## Task 27: Kiểm soát ghi đè lạc quan
**Files:** `recipe_repository.dart`, `routes/v1/recipes/[id]/index.dart`
**Owns:** `@BR-recipe-017` | `@ADR-008`, `@NFR-data-001`
**Trọng tâm test:** ghi dựa trên phiên bản cũ trả `409` và **không trường nào** đổi (so sánh toàn bộ dòng trước/sau).

## Task 28: Tạo công thức idempotent
**Files:** `routes/v1/recipes/index.dart`
**Owns:** `@BR-recipe-018`
**Trọng tâm test:** cùng khoá gửi lại ra một công thức; khoá khác cùng tên ra hai công thức.

## Task 29: Ảnh công thức qua URL ký
**Files:** `apps/api/lib/src/service/image_service.dart`, `storage/s3_client.dart`, `routes/v1/recipes/[id]/image-upload-url.dart`
**Owns:** `@BR-recipe-011`, `@BR-recipe-012` | `@ADR-006`, `@NFR-data-002`
**Trọng tâm test:** ảnh 25 MB bị từ chối và ảnh cũ giữ nguyên; tài khoản khác không xin được URL đọc; vượt hạn mức trả `413`.
**Phụ thuộc:** TQ-01 (chọn nhà cung cấp object storage).

## Task 30: Xoá mềm công thức
**Files:** `recipe_repository.dart`, `routes/v1/recipes/[id]/index.dart`
**Owns:** `@BR-recipe-019` | `@ADR-007`
**Trọng tâm test:** công thức đã xoá biến khỏi tìm kiếm và không gắn mới vào lịch được.

## Task 31: [UI] Adapter chọn ảnh đa nền tảng
**Screen:** dùng chung cho S-07
**Files:** `apps/app/lib/src/core/media/image_source.dart` + hai hiện thực mobile/web
**Owns:** `@NFR-platform-003`
**Trọng tâm test:** chạy thật trên Chrome (bytes, không đường dẫn) và trên iOS với ảnh HEIC.

## Task 32: [UI] S-07 Soạn công thức
**Screen:** S-07
**Files:** `apps/app/lib/src/features/recipe/editor/`
**Owns:** —
**Trọng tâm test:** tự lưu nháp sau 3 giây ngừng gõ và trước khi rời màn hình; xung đột phiên bản **không** làm mất nội dung đang soạn; kéo thả sắp xếp bước đánh số lại tự động.

## Task 33: [UI] S-06 Chi tiết công thức
**Screen:** S-06
**Files:** `apps/app/lib/src/features/recipe/detail/`
**Owns:** —
**Trọng tâm test:** đổi số khẩu phần làm cả định lượng lẫn dinh dưỡng đổi theo tỉ lệ.

---

# Lát cắt D — Tìm kiếm

## Task 34: `search_text` và index trigram
**Files:** `0004_recipes.sql`, `recipe_service.dart` (cập nhật `search_text` trong cùng transaction)
**Owns:** `@BR-search-002`, `@BR-search-003` | `@ADR-005`
**Trọng tâm test:** "pho bo" ra "Phở bò"; "THỊT" ra công thức có nguyên liệu thịt; từ khoá chỉ có trong bước nấu **không** ra kết quả. Test hiệu năng: `EXPLAIN` xác nhận dùng index trigram, không seq scan.

## Task 35: Phạm vi và từ khoá rỗng
**Files:** `recipe_repository.dart`, `routes/v1/recipes/index.dart`
**Owns:** `@BR-search-001`, `@BR-search-004`
**Trọng tâm test:** nháp không ra kết quả; công thức tài khoản khác không ra kết quả; từ khoá rỗng ra toàn bộ.

## Task 36: Bộ lọc
**Files:** `recipe_repository.dart`
**Owns:** `@BR-search-005`, `@BR-search-006`
**Trọng tâm test:** hai **loại** lọc khác nhau giao nhau; nhiều **giá trị** trong cùng một loại hợp nhau. Đây là hai luật ngược nhau nên cần test cho từng luật, không gộp.

## Task 37: Phân trang con trỏ
**Files:** `recipe_repository.dart`
**Owns:** `@BR-search-007` | `@NFR-perf-002`
**Trọng tâm test:** 320 công thức lấy hết bằng con trỏ, không trùng không sót, kể cả khi có công thức mới được chèn giữa hai lần lấy.

## Task 38: [UI] S-05 Danh sách công thức
**Screen:** S-05
**Files:** `apps/app/lib/src/features/recipe/list/`
**Owns:** —
**Trọng tâm test:** cuộn tải tiếp; ba trạng thái skeleton/rỗng/lỗi đều render được.

---

# Lát cắt E — Dinh dưỡng

## Task 39: Tính dinh dưỡng công thức
**Files:** `apps/api/lib/src/service/nutrition_service.dart`, `recipe_nutrition` trong `0004`
**Interfaces:** Consumes `Conversion.toBase` (Task 18). Produces `NutritionService.computeForRecipe(recipeId) → RecipeNutrition`.
**Owns:** `@BR-nutrition-001`, `@BR-nutrition-002`
**Trọng tâm test:** 400 g thịt bò 250 kcal/100 g + 200 g bún 110 kcal/100 g, 4 khẩu phần → tổng 1.220 kcal, mỗi khẩu phần 305 kcal.

## Task 40: Cờ ước tính chưa đầy đủ
**Files:** `nutrition_service.dart`
**Owns:** `@BR-nutrition-003`, `@BR-nutrition-004`
**Trọng tâm test:** thiếu hệ số quy đổi và thiếu dữ liệu dinh dưỡng là **hai đường** khác nhau cùng dẫn tới cờ; cả hai đều trả về **tên nguyên liệu** gây ra; công thức vẫn công bố được.

## Task 41: Scale theo khẩu phần
**Files:** `nutrition_service.dart`, `routes/v1/recipes/[id]/index.dart`
**Owns:** `@BR-nutrition-005`
**Trọng tâm test:** công thức cơ sở 4 khẩu phần xem ở 6 khẩu phần thì 800 g thịt thành 1.200 g.

## Task 42: Luật làm tròn
**Files:** `packages/shared/lib/src/nutrition/rounding.dart`
**Owns:** `@BR-nutrition-009`
**Trọng tâm test:** ba mục 333,4 kcal ra tổng 1.000 kcal, **không** phải 999 — test này là lý do tồn tại của cả task.

## Task 43: Tuyên bố miễn trừ
**Files:** `apps/app/lib/src/features/profile/`, `features/meal_plan/day/`
**Owns:** `@BR-nutrition-011`
**Trọng tâm test:** tuyên bố hiển thị ở nơi người dùng đọc số liệu, không giấu trong trang điều khoản.

---

# Lát cắt F — Kế hoạch bữa ăn

## Task 44: `meal_plan_entries` và tạo mục lịch
**Files:** `db/migrations/0005_meal_plan_and_pantry.sql`, `apps/api/lib/src/service/meal_plan_service.dart`
**Interfaces:** Consumes `NutritionService.computeForRecipe` (Task 39). Produces `MealPlanService.addEntry(...)` ghi kèm snapshot bốn chỉ số.
**Owns:** `@BR-mealplan-001`, `@BR-mealplan-002`, `@BR-mealplan-003`, `@BR-mealplan-004` | `@ADR-004`
**Trọng tâm test:** đổi múi giờ thiết bị không làm mục lịch nhảy ngày; khẩu phần 0 và 51 bị từ chối; khẩu phần 0,5 hợp lệ nhưng 0,3 thì không; không khai khẩu phần thì lấy theo công thức.

## Task 45: Nhiều mục trong một bữa
**Files:** `meal_plan_service.dart`
**Owns:** `@BR-mealplan-005`
**Trọng tâm test:** gắn cùng một công thức hai lần vào một bữa ra **hai mục riêng**, không gộp và không chặn.

## Task 46: Giới hạn khoảng ngày
**Files:** `meal_plan_service.dart`
**Owns:** `@BR-mealplan-006`, `@BR-mealplan-007`
**Trọng tâm test:** biên đúng 30 ngày và đúng 365 ngày (không phải 29/31 và 364/366).

## Task 47: Tuần và endpoint đọc kế hoạch
**Files:** `routes/v1/meal-plan/index.dart`, `packages/shared/lib/src/date/week.dart`
**Owns:** `@BR-mealplan-010`
**Trọng tâm test:** tuần chứa ngày 25/09/2026 luôn ra Thứ Hai 21/09 đến Chủ Nhật 27/09.

## Task 48: Tổng dinh dưỡng theo ngày
**Files:** `meal_plan_service.dart`, `repository/meal_plan_repository.dart`
**Owns:** `@BR-nutrition-006`, `@BR-nutrition-007`, `@BR-nutrition-008`
**Trọng tâm test:** ngày trống ra 0 và được coi là đầy đủ; một món ước tính chưa đầy đủ làm cả ngày mang cờ.

## Task 49: Mục tiêu calo mỗi ngày
**Files:** `routes/v1/me/index.dart`, `apps/app/lib/src/features/profile/`
**Owns:** `@BR-auth-010`, `@BR-nutrition-010`
**Trọng tâm test:** mục tiêu 0 và số âm bị từ chối; ngày 2.300 kcal với mục tiêu 2.000 được đánh dấu vượt.

## Task 50: Lan truyền khi sửa hoặc xoá công thức
**Files:** `recipe_service.dart`, `meal_plan_service.dart`
**Owns:** `@BR-recipe-020`, `@BR-recipe-021`, `@BR-recipe-022`
**Trọng tâm test:** đây là task rủi ro nhất của dự án — cần test cho cả ba mốc thời gian:
- sửa công thức → mục **hôm qua** không đổi, mục **hôm nay** đổi, mục **ngày mai** đổi;
- xoá công thức → mục hôm qua giữ tên và số liệu, mục ngày mai biến mất và tổng ngày mai giảm đúng phần đó.

## Task 51: Gỡ mục lịch
**Files:** `meal_plan_service.dart`
**Owns:** `@BR-mealplan-009`
**Trọng tâm test:** gỡ mục không đụng công thức trong kho.

## Task 52: Sao chép tuần
**Files:** `meal_plan_service.dart`, `routes/v1/meal-plan/copy-week.dart`
**Owns:** `@BR-mealplan-008`
**Trọng tâm test:** mục sẵn có ở tuần đích được giữ và bản sao thêm vào bên cạnh — **không ghi đè**.

## Task 53: [UI] S-03 Kế hoạch tuần
**Screen:** S-03
**Files:** `apps/app/lib/src/features/meal_plan/week/`
**Owns:** —
**Trọng tâm test:** lưới 7×4 ở Expanded, danh sách cuộn dọc ở Compact; dấu `▲` vượt mục tiêu và `⚠` ước tính chưa đầy đủ hiện đúng ngày.

## Task 54: [UI] S-04 Chi tiết một ngày
**Screen:** S-04
**Files:** `apps/app/lib/src/features/meal_plan/day/`
**Owns:** —
**Trọng tâm test:** cờ `⚠` luôn kèm **tên nguyên liệu** gây ra nó.

## Task 55: [UI] S-10 Thêm món vào lịch
**Screen:** S-10
**Files:** `apps/app/lib/src/features/meal_plan/add/`
**Owns:** —
**Trọng tâm test:** lịch chặn chọn ngày ngoài khoảng −30/+365; xem trước tác động lên tổng ngày.

## Task 56: [UI] S-11 Sao chép tuần
**Screen:** S-11
**Files:** `apps/app/lib/src/features/meal_plan/copy/`
**Owns:** —
**Trọng tâm test:** câu giải thích nêu đúng số món của cả hai tuần và nói rõ là cộng thêm.

---

# Lát cắt G — Pantry

## Task 57: `pantry_items`, gộp và tách lô
**Files:** `0005_meal_plan_and_pantry.sql`, `apps/api/lib/src/service/pantry_service.dart`
**Owns:** `@BR-pantry-001`, `@BR-pantry-002`, `@BR-pantry-003`
**Trọng tâm test:** trùng cả ba thì cộng dồn; khác hạn dùng thì tách lô; **hai lô cùng không khai hạn cũng phải gộp** — đây là chỗ `NULLS NOT DISTINCT` chứng minh nó cần thiết, thiếu nó là sinh hai dòng.

## Task 58: Luật khả dụng
**Files:** `pantry_service.dart`
**Owns:** `@BR-pantry-004`, `@BR-pantry-005`, `@BR-pantry-006`
**Trọng tâm test:** hạn đúng hôm nay **vẫn còn hạn**, hạn hôm qua thì không; số lượng 0 không tính; không khai hạn thì luôn tính.

## Task 59: Đối chiếu công thức với pantry
**Files:** `pantry_service.dart`, `routes/v1/recipes/[id]/pantry-check.dart`
**Interfaces:** Consumes `Conversion.toBase` (Task 18). Produces `PantryCheck` với ba kết luận `enough | short(shortfall) | unknown`.
**Owns:** `@BR-pantry-007`, `@BR-pantry-008`, `@BR-pantry-009`, `@BR-pantry-010`
**Trọng tâm test:** ba kết luận đều có test riêng; tính theo khẩu phần đang xem chứ không phải khẩu phần cơ sở; dòng tuỳ khẩu vị bị bỏ qua; một dòng `unknown` làm cả công thức không được kết luận là đủ; lên lịch không làm đổi tồn.

## Task 60: Bộ lọc "nấu được với đồ đang có"
**Files:** `recipe_repository.dart`, `routes/v1/recipes/index.dart`
**Owns:** `@BR-search-008`
**Trọng tâm test:** công thức có dòng `unknown` **không** nằm trong kết quả; `EXPLAIN` xác nhận không sinh truy vấn N+1.

## Task 61: [UI] S-09 Tủ đồ
**Screen:** S-09
**Files:** `apps/app/lib/src/features/pantry/`
**Owns:** —
**Trọng tâm test:** lô quá hạn và lô số lượng 0 hiển thị kèm dòng chữ "không tính khi đối chiếu".

## Task 62: [UI] S-12 Hồ sơ và cài đặt
**Screen:** S-12
**Files:** `apps/app/lib/src/features/profile/`
**Owns:** —
**Trọng tâm test:** hộp thoại xoá tài khoản nêu **số lượng dữ liệu cụ thể** và mốc 30 ngày.

---

# Lát cắt H — Cold start và hoàn thiện

## Task 63: Seed danh mục nguyên liệu
**Files:** `db/migrations/0007_seed_ingredients.sql`
**Owns:** —
**Phụ thuộc:** **TQ-02** — chốt nguồn dữ liệu dinh dưỡng trước khi bắt đầu task này.
**Trọng tâm test:** mọi dòng seed thoả `ing_kcal_range` và `ing_nutrition_all_or_none`; nhóm nguyên liệu đếm được hay gặp nhất đều có hệ số quy đổi.

## Task 64: Công thức mẫu cho tài khoản mới
**Files:** `db/migrations/0008_seed_starter_recipes.sql`, `auth_service.dart`
**Owns:** `@BR-auth-009`
**Trọng tâm test:** người dùng mới lên lịch được ngay một món mẫu; xoá một món mẫu không ảnh hưởng tài khoản khác (chứng minh là **bản sao** chứ không phải tham chiếu chung).

## Task 65: Kiểm chứng hiệu năng
**Files:** `apps/api/test/perf/`
**Owns:** `@NFR-perf-001`
**Trọng tâm test:** với 1.000 công thức và 200 mục pantry, p95 của tìm kiếm, đọc kế hoạch một tuần và đối chiếu pantry đều dưới 300 ms. Chạy trên dữ liệu sinh sẵn, không phải dữ liệu rỗng.

---

## Bảng đối chiếu sở hữu

Mỗi BR và mỗi ADR thuộc **đúng một** task.

| Nhóm | Số lượng | Task sở hữu |
|------|---------|-------------|
| `BR-auth-*` | 10 | 4, 5, 6, 7, 8, 9, 10, 11, 49, 64 |
| `BR-ingredient-*` | 5 | 16, 17, 18 |
| `BR-recipe-*` | 22 | 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 50 |
| `BR-search-*` | 8 | 34, 35, 36, 37, 60 |
| `BR-mealplan-*` | 10 | 44, 45, 46, 47, 51, 52 |
| `BR-nutrition-*` | 11 | 39, 40, 41, 42, 43, 48, 49 |
| `BR-pantry-*` | 10 | 57, 58, 59 |
| `ADR-001…010` | 10 | 1, 2, 3, 12, 17, 27, 29, 30, 34, 44 |
| `NFR-*` | 11 | 4, 6, 11, 12, 13, 27, 29, 31, 37, 65 |

**Tổng: 76 BR + 10 ADR + 11 NFR, không id nào bị bỏ sót, không id nào thuộc hai task.**

## Kiểm chứng

```
melos run analyze           # dart analyze toàn monorepo, --fatal-infos
melos run test              # unit + widget, không cần hạ tầng
docker compose up -d db
melos run test:integration  # repository chạy trên PostgreSQL thật
```

## Việc còn treo trước khi bắt tay

| # | Việc | Chặn lát cắt nào |
|---|------|------------------|
| TQ-01 | Chọn nhà cung cấp object storage và email | C (Task 29), A (Task 7) |
| TQ-02 | Chốt nguồn dữ liệu dinh dưỡng nguyên liệu Việt | H (Task 63), và làm E kém giá trị nếu thiếu |
| TQ-03 | Chọn nơi triển khai | Không chặn lát cắt nào, chỉ chặn khâu deploy |
| TQ-04 | Có chạy `to-bdd` sinh `.feature` cho 76 BR trước khi code không | Không chặn, nhưng quyết định hình dạng của khâu test E2E |
