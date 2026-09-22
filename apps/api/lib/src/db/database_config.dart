import 'dart:io';

import 'package:postgres/postgres.dart';

/// Thông số kết nối database, đọc từ biến môi trường.
///
/// Giá trị mặc định khớp `docker-compose.yml` để máy dev chạy được ngay.
Endpoint endpointFromEnvironment([Map<String, String>? environment]) {
  final env = environment ?? Platform.environment;
  return Endpoint(
    host: env['PGHOST'] ?? 'localhost',
    port: int.parse(env['PGPORT'] ?? '5432'),
    database: env['PGDATABASE'] ?? 'recipe',
    username: env['PGUSER'] ?? 'app',
    password: env['PGPASSWORD'] ?? 'app',
  );
}

/// Máy dev và CI chạy PostgreSQL trong container không bật TLS.
ConnectionSettings connectionSettingsFromEnvironment([
  Map<String, String>? environment,
]) {
  final env = environment ?? Platform.environment;
  final sslMode = (env['PGSSLMODE'] ?? 'disable') == 'disable'
      ? SslMode.disable
      : SslMode.require;
  return ConnectionSettings(sslMode: sslMode);
}
