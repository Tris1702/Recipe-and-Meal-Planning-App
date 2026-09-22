import 'package:api/src/db/migration_files.dart';
import 'package:postgres/postgres.dart';

/// Áp dụng các migration trong [dirPath] còn thiếu trên [conn].
///
/// Trả về tên các migration vừa áp dụng lần này — chạy lại trên cùng một
/// database sẽ trả về danh sách rỗng.
///
/// Mỗi migration chạy trong transaction riêng cùng với dòng ghi nhận vào
/// `schema_migrations`: hoặc cả SQL lẫn dấu vết cùng vào, hoặc không gì vào cả.
/// Nếu ghi dấu vết ngoài transaction, một lần chạy hỏng giữa chừng sẽ để lại
/// database ở trạng thái không lần nào lặp lại được.
Future<List<String>> runMigrations(Connection conn, String dirPath) async {
  await conn.execute('''
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version integer PRIMARY KEY,
      name text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )''');

  final applied = (await conn.execute('SELECT version FROM schema_migrations'))
      .map((row) => row[0]! as int)
      .toSet();

  final justApplied = <String>[];
  for (final migration in discoverMigrations(dirPath)) {
    if (applied.contains(migration.version)) continue;

    await conn.runTx((tx) async {
      await tx.execute(migration.readSql());
      await tx.execute(
        Sql.named(
          'INSERT INTO schema_migrations (version, name) VALUES (@version, @name)',
        ),
        parameters: {'version': migration.version, 'name': migration.name},
      );
    });
    justApplied.add(migration.name);
  }

  return justApplied;
}
