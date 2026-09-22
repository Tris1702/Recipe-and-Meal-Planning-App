import 'dart:io';

import 'package:api/src/db/database_config.dart';
import 'package:api/src/db/migrator.dart';
import 'package:postgres/postgres.dart';

/// `dart run tool/migrate.dart up` — áp dụng migration còn thiếu.
Future<void> main(List<String> args) async {
  final command = args.isEmpty ? 'up' : args.first;
  if (command != 'up') {
    stderr.writeln('Chỉ hỗ trợ lệnh: up');
    exitCode = 64;
    return;
  }

  final directory = Platform.environment['MIGRATIONS_DIR'] ?? 'db/migrations';
  final conn = await Connection.open(
    endpointFromEnvironment(),
    settings: connectionSettingsFromEnvironment(),
  );

  try {
    final applied = await runMigrations(conn, directory);
    if (applied.isEmpty) {
      stdout.writeln('Không có migration mới.');
    } else {
      for (final name in applied) {
        stdout.writeln('applied $name');
      }
    }
  } finally {
    await conn.close();
  }
}
