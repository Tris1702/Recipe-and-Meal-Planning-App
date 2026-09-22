import 'dart:io';

import 'package:api/src/db/database_config.dart';
import 'package:postgres/postgres.dart';

/// Thư mục migration, tính từ thư mục gốc của package `api`.
const migrationsDirectory = '../../db/migrations';

/// Mở kết nối tới PostgreSQL dùng cho test tích hợp và dọn sạch schema.
///
/// Dọn sạch ở lúc mở chứ không phải lúc đóng: nếu một lần chạy hỏng giữa
/// chừng, lần sau vẫn bắt đầu từ database trống.
Future<Connection> openTestConnection() async {
  final conn = await Connection.open(
    endpointFromEnvironment(),
    settings: connectionSettingsFromEnvironment(),
  );
  await conn.execute('DROP SCHEMA IF EXISTS public CASCADE');
  await conn.execute('CREATE SCHEMA public');
  return conn;
}

/// Thông báo cho người chạy test biết cần bật database.
String get databaseHint =>
    'Cần PostgreSQL đang chạy: docker compose up -d db '
    '(PGHOST=${Platform.environment['PGHOST'] ?? 'localhost'})';
