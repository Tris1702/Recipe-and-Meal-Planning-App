import 'dart:io';

import 'package:api/src/db/database_config.dart';
import 'package:postgres/postgres.dart';

/// Thư mục migration, tính từ thư mục gốc của package `api`.
const migrationsDirectory = '../../db/migrations';

/// Mở kết nối tới PostgreSQL dùng cho test tích hợp và dọn sạch schema.
///
/// Dọn sạch ở lúc mở chứ không phải lúc đóng: nếu một lần chạy hỏng giữa
/// chừng, lần sau vẫn bắt đầu từ database trống.
///
/// Luôn nối tới database **riêng cho test** (`recipe_test` nếu không khai
/// `PGDATABASE_TEST`), không bao giờ nối vào database dev: hàm này xoá sạch
/// schema mỗi lần chạy.
Future<Connection> openTestConnection() async {
  final base = endpointFromEnvironment();
  final testDatabase =
      Platform.environment['PGDATABASE_TEST'] ?? 'recipe_test';
  if (testDatabase == base.database &&
      Platform.environment['PGDATABASE_TEST'] == null) {
    throw StateError(
      'Database test trùng database dev ($testDatabase). Đặt PGDATABASE_TEST.',
    );
  }
  final conn = await Connection.open(
    Endpoint(
      host: base.host,
      port: base.port,
      database: testDatabase,
      username: base.username,
      password: base.password,
    ),
    settings: connectionSettingsFromEnvironment(),
  );
  await conn.execute('DROP SCHEMA IF EXISTS public CASCADE');
  await conn.execute('CREATE SCHEMA public');
  return conn;
}

